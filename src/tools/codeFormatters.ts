export type CodeOutputMode = 'formatted' | 'compact';
export type CodeIndentation = '2-spaces' | '4-spaces' | 'tabs';

export interface CodeFormatterOptions {
  mode: CodeOutputMode;
  indentation: CodeIndentation;
  preserveComments: boolean;
  preserveBlankLines?: boolean;
  jsSemicolons?: 'preserve' | 'add' | 'remove';
  jsQuoteStyle?: 'preserve' | 'single' | 'double';
  jsTrailingCommas?: 'preserve' | 'remove';
  htmlWrapTextNodes?: boolean;
  htmlCollapseWhitespace?: boolean;
  htmlVoidTagStyle?: 'preserve' | 'xhtml';
  pythonNormalizeIndentation?: boolean;
  luaNormalizeIndentation?: boolean;
  xmlWrapTextNodes?: boolean;
  xmlCollapseWhitespace?: boolean;
  xmlSelfCloseEmptyTags?: boolean;
}

export interface CodeFormatterResult {
  output: string;
  error: string;
}

export function formatJavaScript(input: string, options: CodeFormatterOptions): CodeFormatterResult {
  const source = input.trim();
  if (!source) return { output: '', error: '' };

  const validationError = validateBalanced(source, [['{', '}'], ['(', ')'], ['[', ']']]);
  if (validationError) return { output: '', error: validationError };

  const withoutComments = options.preserveComments ? source : removeJsComments(source);
  const normalized = normalizeJavaScript(withoutComments, options);
  return { output: options.mode === 'compact' ? minifyJavaScript(normalized) : prettifyJavaScript(normalized, getIndentation(options.indentation), Boolean(options.preserveBlankLines)), error: '' };
}

export function formatHtml(input: string, options: CodeFormatterOptions): CodeFormatterResult {
  const source = input.trim();
  if (!source) return { output: '', error: '' };

  const validationError = validateHtml(source);
  if (validationError) return { output: '', error: validationError };

  const withoutComments = options.preserveComments ? source : source.replace(/<!--[\s\S]*?-->/g, '');
  const normalized = normalizeHtml(withoutComments, options);
  return { output: options.mode === 'compact' ? minifyHtml(normalized) : prettifyHtml(normalized, getIndentation(options.indentation), Boolean(options.preserveBlankLines), options.htmlWrapTextNodes !== false), error: '' };
}

export function formatXml(input: string, options: CodeFormatterOptions): CodeFormatterResult {
  const source = input.trim();
  if (!source) return { output: '', error: '' };

  const validationError = validateXml(source);
  if (validationError) return { output: '', error: validationError };

  const withoutComments = options.preserveComments ? source : source.replace(/<!--[\s\S]*?-->/g, '');
  const normalized = normalizeXml(withoutComments, options);
  return {
    output:
      options.mode === 'compact'
        ? minifyXml(normalized)
        : prettifyXml(normalized, getIndentation(options.indentation), Boolean(options.preserveBlankLines), options.xmlWrapTextNodes !== false),
    error: '',
  };
}

export function formatPython(input: string, options: CodeFormatterOptions): CodeFormatterResult {
  const source = input.trim();
  if (!source) return { output: '', error: '' };

  const validationError = validateBalanced(source, [['(', ')'], ['[', ']'], ['{', '}']]);
  if (validationError) return { output: '', error: validationError };

  const withoutComments = options.preserveComments ? source : source.replace(/(^|\s)#.*$/gm, '');
  const normalized = options.pythonNormalizeIndentation === false ? withoutComments : normalizePythonIndentation(withoutComments, getIndentation(options.indentation));
  return { output: options.mode === 'compact' ? minifyPython(normalized, Boolean(options.preserveBlankLines)) : prettifyPython(normalized, getIndentation(options.indentation), Boolean(options.preserveBlankLines)), error: '' };
}

export function formatLua(input: string, options: CodeFormatterOptions): CodeFormatterResult {
  const source = input.trim();
  if (!source) return { output: '', error: '' };

  const validationError = validateLuaBlocks(source);
  if (validationError) return { output: '', error: validationError };

  const withoutComments = options.preserveComments ? source : removeLuaComments(source);
  const normalized = options.luaNormalizeIndentation === false ? withoutComments : normalizeLuaIndentation(withoutComments, getIndentation(options.indentation), Boolean(options.preserveBlankLines));
  return { output: normalized, error: '' };
}

function prettifyJavaScript(input: string, indent: string, preserveBlankLines: boolean): string {
  const tokens = tokenizeCode(input, '{};');
  const lines: string[] = [];
  let depth = 0;
  let current = '';

  for (const token of tokens) {
    if (token === '{') {
      pushLine(`${current.trim()} {`, lines, depth, indent);
      current = '';
      depth += 1;
    } else if (token === '}') {
      if (current.trim()) pushLine(current, lines, depth, indent);
      current = '';
      depth = Math.max(0, depth - 1);
      pushLine('}', lines, depth, indent);
    } else if (token === ';') {
      current += ';';
      pushLine(current, lines, depth, indent);
      current = '';
    } else {
      current += token;
    }
  }

  if (current.trim()) pushLine(current, lines, depth, indent);
  const formatted = lines.join('\n').replace(/}\n([^\n}])/g, '}\n\n$1');
  return preserveBlankLines ? restoreBlankLines(input, formatted) : formatted;
}

function minifyJavaScript(input: string): string {
  return input.replace(/\s+/g, ' ').replace(/\s*([{}()[\]=:+\-*/%,;<>])\s*/g, '$1').trim();
}

function prettifyHtml(input: string, indent: string, preserveBlankLines: boolean, wrapTextNodes: boolean): string {
  const tokens = input.replace(/>\s*</g, '><').match(/<!--[^]*?-->|<[^>]+>|[^<]+/g) ?? [];
  const lines: string[] = [];
  let depth = 0;

  for (const rawToken of tokens) {
    const token = rawToken.trim();
    if (!token) continue;

    if (/^<\//.test(token)) depth = Math.max(0, depth - 1);
    if (!wrapTextNodes && !token.startsWith('<') && lines.length) {
      lines[lines.length - 1] += token;
    } else {
      pushLine(token, lines, depth, indent);
    }
    if (/^<[^/!][^>]*[^/]?>$/.test(token) && !isVoidHtmlTag(token)) depth += 1;
  }

  const formatted = lines.join('\n');
  return preserveBlankLines ? restoreBlankLines(input, formatted) : formatted;
}

function minifyHtml(input: string): string {
  return input.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
}

const XML_TAG_PATTERN = /<!\[CDATA\[[\s\S]*?]]>|<!--[^]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<[^>]+>/gi;
const XML_TOKEN_PATTERN = /<!\[CDATA\[[\s\S]*?]]>|<!--[^]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<[^>]+>|[^<]+/gi;

function prettifyXml(input: string, indent: string, preserveBlankLines: boolean, wrapTextNodes: boolean): string {
  const tokens = input.replace(/>\s*</g, '><').match(XML_TOKEN_PATTERN) ?? [];
  const lines: string[] = [];
  let depth = 0;

  for (const rawToken of tokens) {
    const token = rawToken.trim();
    if (!token) continue;

    const isClosingTag = /^<\//.test(token);
    if (isClosingTag) depth = Math.max(0, depth - 1);
    if (!wrapTextNodes && !token.startsWith('<') && lines.length) {
      lines[lines.length - 1] += token;
    } else {
      pushLine(token, lines, depth, indent);
    }
    if (isXmlOpeningTag(token)) depth += 1;
  }

  const formatted = lines.join('\n');
  return preserveBlankLines ? restoreBlankLines(input, formatted) : formatted;
}

function minifyXml(input: string): string {
  return input.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
}

function prettifyPython(input: string, indent: string, preserveBlankLines: boolean): string {
  const lines: string[] = [];
  let depth = 0;

  input.split('\n').forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      if (preserveBlankLines && lines.at(-1) !== '') lines.push('');
      return;
    }
    if (/^(elif|else|except|finally)\b/.test(line)) depth = Math.max(0, depth - 1);
    pushLine(line, lines, depth, indent);
    if (line.endsWith(':')) depth += 1;
    if (/^(return|raise|pass|break|continue)\b/.test(line)) depth = Math.max(0, depth - 1);
  });

  return lines.join('\n');
}

function minifyPython(input: string, preserveBlankLines: boolean): string {
  const lines = input.split('\n').map((line) => line.trim());
  if (!preserveBlankLines) return lines.filter(Boolean).join('\n');

  return lines.filter((line, index) => line || (lines[index - 1] && lines[index + 1])).join('\n');
}

function normalizeJavaScript(input: string, options: CodeFormatterOptions): string {
  let output = input;
  if (options.jsTrailingCommas === 'remove') output = output.replace(/,\s*([}\]])/g, '$1');
  if (options.jsQuoteStyle === 'single') output = output.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (_, value: string) => `'${value.replace(/'/g, "\\'")}'`);
  if (options.jsQuoteStyle === 'double') output = output.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, value: string) => `"${value.replace(/"/g, '\\"')}"`);
  if (options.jsSemicolons === 'remove') output = output.replace(/;\s*(?=\n|$|})/g, '');
  if (options.jsSemicolons === 'add') output = output.replace(/([^;{}\s])\s*(?=\n|$)/g, '$1;');
  return output;
}

function normalizeHtml(input: string, options: CodeFormatterOptions): string {
  let output = input;
  if (options.htmlCollapseWhitespace) output = output.replace(/>\s+</g, '><').replace(/\s+/g, ' ');
  if (options.htmlVoidTagStyle === 'xhtml') {
    output = output.replace(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)([^>/]*?)>/gi, '<$1$2 />');
  }
  return output;
}

function normalizeXml(input: string, options: CodeFormatterOptions): string {
  let output = input;
  if (options.xmlCollapseWhitespace) output = output.replace(/>\s+</g, '><').replace(/\s+/g, ' ');
  if (options.xmlSelfCloseEmptyTags) output = output.replace(/<([\w:.-]+)((?:\s+[^<>]*?)?)>\s*<\/\1>/g, '<$1$2/>');
  return output;
}

function normalizePythonIndentation(input: string, indent: string): string {
  return input
    .split('\n')
    .map((line) => {
      const leading = line.match(/^\s*/)?.[0] ?? '';
      const depth = Math.floor(leading.replace(/\t/g, '    ').length / 2);
      return `${indent.repeat(depth)}${line.trimStart()}`;
    })
    .join('\n');
}

function normalizeLuaIndentation(input: string, indent: string, preserveBlankLines: boolean): string {
  const lines: string[] = [];
  let depth = 0;

  input.split('\n').forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      if (preserveBlankLines && lines.at(-1) !== '') lines.push('');
      return;
    }

    if (/^(end|until|else|elseif)\b/.test(line)) depth = Math.max(0, depth - 1);
    pushLine(line, lines, depth, indent);
    if (/\b(function|then|do)\b/.test(line) || /^repeat\b/.test(line)) depth += 1;
    if (/^(else|elseif)\b/.test(line)) depth += 1;
  });

  return lines.join('\n');
}

function validateLuaBlocks(input: string): string {
  let depth = 0;
  let quote = '';
  let longString = false;

  input.split('\n').forEach((line) => {
    const withoutComment = line.replace(/--.*$/, '');
    for (let index = 0; index < withoutComment.length; index += 1) {
      const char = withoutComment[index];
      const next = withoutComment[index + 1];
      if (longString) {
        if (char === ']' && next === ']') {
          longString = false;
          index += 1;
        }
        continue;
      }
      if (quote) {
        if (char === '\\') index += 1;
        else if (char === quote) quote = '';
        continue;
      }
      if ((char === '"' || char === "'") && withoutComment[index - 1] !== '\\') quote = char;
      if (char === '[' && next === '[') {
        longString = true;
        index += 1;
      }
    }

    const code = withoutComment.replace(/(['"])(?:\\.|(?!\1).)*\1/g, '');
    const closers = code.match(/\b(end|until)\b/g)?.length ?? 0;
    const openers = code.match(/\b(function|then|do|repeat)\b/g)?.length ?? 0;
    depth += openers - closers;
  });

  if (quote) return 'Unclosed string.';
  if (longString) return 'Unclosed long string.';
  if (depth > 0) return 'Missing closing end or until.';
  if (depth < 0) return 'Unexpected closing end or until.';
  return '';
}

function removeLuaComments(input: string): string {
  return input.replace(/--\[\[[\s\S]*?]]/g, '').replace(/--.*$/gm, '');
}

function restoreBlankLines(input: string, formatted: string): string {
  if (!/\n\s*\n/.test(input)) return formatted;
  return formatted.replace(/\n{2,}/g, '\n\n');
}

function validateBalanced(input: string, pairs: Array<[string, string]>): string {
  const closers = new Map(pairs.map(([open, close]) => [close, open]));
  const stack: string[] = [];
  let quote = '';

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    const opener = pairs.find(([open]) => open === char)?.[0];
    if (opener) stack.push(opener);
    if (closers.has(char) && stack.pop() !== closers.get(char)) return `Unexpected closing ${char}.`;
  }

  if (quote) return 'Unclosed string.';
  if (stack.length) return `Missing closing ${pairs.find(([open]) => open === stack.at(-1))?.[1] ?? 'delimiter'}.`;
  return '';
}

function validateHtml(input: string): string {
  const stack: string[] = [];
  const tags = input.match(/<[^>]+>/g) ?? [];
  for (const tag of tags) {
    if (/^<!--/.test(tag) || /^<!/.test(tag) || /^<\?/.test(tag) || /\/>$/.test(tag) || isVoidHtmlTag(tag)) continue;
    const name = tag.match(/^<\/?\s*([\w-]+)/)?.[1]?.toLowerCase();
    if (!name) continue;
    if (tag.startsWith('</')) {
      if (stack.pop() !== name) return `Unexpected closing </${name}>.`;
    } else {
      stack.push(name);
    }
  }
  return stack.length ? `Missing closing </${stack.at(-1)}>.` : '';
}

function validateXml(input: string): string {
  const stack: string[] = [];
  const tags = input.match(XML_TAG_PATTERN) ?? [];

  for (const tag of tags) {
    if (/^<!\[CDATA\[/.test(tag) || /^<!--/.test(tag) || /^<\?/.test(tag) || /^<!DOCTYPE/i.test(tag) || /\/>$/.test(tag)) continue;

    const name = tag.match(/^<\/?\s*([\w:.-]+)/)?.[1];
    if (!name) continue;

    if (tag.startsWith('</')) {
      if (stack.pop() !== name) return `Unexpected closing </${name}>.`;
    } else {
      stack.push(name);
    }
  }

  return stack.length ? `Missing closing </${stack.at(-1)}>.` : '';
}

function tokenizeCode(input: string, punctuation: string): string[] {
  const tokens: string[] = [];
  let buffer = '';
  let quote = '';

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quote) {
      buffer += char;
      if (char === '\\') {
        buffer += input[index + 1] ?? '';
        index += 1;
      } else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      buffer += char;
      continue;
    }
    if (punctuation.includes(char)) {
      if (buffer.trim()) tokens.push(buffer.replace(/\s+/g, ' '));
      tokens.push(char);
      buffer = '';
      continue;
    }
    buffer += char;
  }
  if (buffer.trim()) tokens.push(buffer.replace(/\s+/g, ' '));
  return tokens;
}

function removeJsComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function isVoidHtmlTag(tag: string): boolean {
  return /<\s*(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b/i.test(tag);
}

function isXmlOpeningTag(token: string): boolean {
  if (!token.startsWith('<') || token.startsWith('</')) return false;
  if (token.startsWith('<!') || token.startsWith('<?')) return false;
  return !token.endsWith('/>');
}

function pushLine(value: string, lines: string[], depth: number, indent: string): void {
  if (!value.trim()) return;
  lines.push(`${indent.repeat(depth)}${value.trim()}`);
}

function getIndentation(indentation: CodeIndentation): string {
  if (indentation === '4-spaces') return '    ';
  if (indentation === 'tabs') return '\t';
  return '  ';
}
