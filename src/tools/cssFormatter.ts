export type CssOutputMode = 'expanded' | 'nested' | 'compact' | 'compressed';
export type CssIndentation = '2-spaces' | '4-spaces' | 'tabs';

export interface CssFormatterOptions {
  mode: CssOutputMode;
  indentation: CssIndentation;
  sortDeclarations: boolean;
  preserveComments: boolean;
}

export interface CssFormatterResult {
  output: string;
  error: string;
}

export function formatCss(input: string, options: CssFormatterOptions): CssFormatterResult {
  const source = input.trim();
  if (!source) return { output: '', error: '' };

  const validationError = validateCss(source);
  if (validationError) return { output: '', error: validationError };

  const normalized = options.preserveComments ? source : source.replace(/\/\*[\s\S]*?\*\//g, '');

  return {
    output: formatCssByMode(normalized, options),
    error: '',
  };
}

function formatCssByMode(input: string, options: CssFormatterOptions): string {
  if (options.mode === 'compressed') return minifyCss(input, options);
  if (options.mode === 'compact') return compactCss(input, options);
  return prettifyCss(input, options);
}

function validateCss(input: string): string {
  let depth = 0;
  let quote: '"' | "'" | '' = '';
  let inComment = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (inComment) {
      if (char === '*' && next === '/') {
        inComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = '';
      continue;
    }

    if (char === '/' && next === '*') {
      inComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'") quote = char;
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth < 0) return 'Unexpected closing brace.';
  }

  if (quote) return 'Unclosed string.';
  if (inComment) return 'Unclosed comment.';
  if (depth > 0) return 'Missing closing brace.';

  return '';
}

function prettifyCss(input: string, options: CssFormatterOptions): string {
  const tokens = tokenizeCss(input);
  const indent = getIndentation(options.indentation);
  const lines: string[] = [];
  let depth = 0;
  let current = '';

  for (const token of tokens) {
    if (token === '{') {
      const selector = options.mode === 'nested' ? current.trim() : `${current.trim()} {`;
      pushLine(selector, lines, depth, indent);
      if (options.mode === 'nested') pushLine('{', lines, depth, indent);
      current = '';
      depth += 1;
      continue;
    }

    if (token === '}') {
      if (current.trim()) pushDeclarationBlock(current, lines, depth, indent, options.sortDeclarations);
      current = '';
      depth = Math.max(0, depth - 1);
      pushLine('}', lines, depth, indent);
      continue;
    }

    if (token === ';') {
      current += ';';
      if (!options.sortDeclarations) {
        pushDeclarationBlock(current, lines, depth, indent, false);
        current = '';
      }
      continue;
    }

    if (token === ',') {
      current = `${current.trim()}, `;
      continue;
    }

    current += token;
  }

  if (current.trim()) pushDeclarationBlock(current, lines, depth, indent, options.sortDeclarations);

  return lines.join('\n').replace(/}\n([^\n])/g, '}\n\n$1');
}

function compactCss(input: string, options: CssFormatterOptions): string {
  const tokens = tokenizeCss(input);
  const lines: string[] = [];
  let selector = '';
  let current = '';
  let depth = 0;

  for (const token of tokens) {
    if (token === '{') {
      selector = current.trim();
      current = '';
      depth += 1;
      continue;
    }

    if (token === '}') {
      if (current.trim()) {
        const block = options.sortDeclarations ? sortDeclarationText(current, true) : normalizeDeclaration(current).replace(/;\s*/g, '; ');
        lines.push(`${selector} { ${block.replace(/;+\s*$/, '')}; }`);
      }
      selector = '';
      current = '';
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (token === ';') {
      current += ';';
      continue;
    }

    if (token === ',' && depth === 0) {
      current = `${current.trim()}, `;
      continue;
    }

    current += token;
  }

  return lines.join('\n');
}

function minifyCss(input: string, options: CssFormatterOptions): string {
  const source = options.preserveComments ? input : input.replace(/\/\*[\s\S]*?\*\//g, '');
  const minified = source
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();

  if (!options.sortDeclarations) return minified;

  return minified.replace(/\{([^{}]+)}/g, (_, block: string) => `{${sortDeclarationText(block, true)}}`);
}

function tokenizeCss(input: string): string[] {
  const tokens: string[] = [];
  let buffer = '';
  let quote: '"' | "'" | '' = '';
  let inComment = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (inComment) {
      buffer += char;
      if (char === '*' && next === '/') {
        buffer += next;
        tokens.push(normalizeWhitespace(buffer));
        buffer = '';
        inComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      buffer += char;
      if (char === '\\') {
        buffer += next ?? '';
        index += 1;
      } else if (char === quote) quote = '';
      continue;
    }

    if (char === '/' && next === '*') {
      if (buffer.trim()) tokens.push(normalizeWhitespace(buffer));
      buffer = '/*';
      inComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      buffer += char;
      continue;
    }

    if ('{};,'.includes(char)) {
      if (buffer.trim()) tokens.push(normalizeWhitespace(buffer));
      tokens.push(char);
      buffer = '';
      continue;
    }

    buffer += char;
  }

  if (buffer.trim()) tokens.push(normalizeWhitespace(buffer));

  return tokens;
}

function pushDeclarationBlock(value: string, lines: string[], depth: number, indent: string, sort: boolean): void {
  const declarations = sort ? sortDeclarationText(value, false) : normalizeDeclaration(value);
  if (!declarations) return;
  declarations.split('\n').forEach((line) => pushLine(line, lines, depth, indent));
}

function sortDeclarationText(value: string, compact: boolean): string {
  const hasTrailingSemicolon = value.trim().endsWith(';');
  const declarations = value
    .split(';')
    .map((declaration) => normalizeDeclaration(declaration))
    .filter(Boolean);

  if (!declarations.every((declaration) => declaration.includes(':'))) return normalizeDeclaration(value);

  const separator = compact ? ';' : ';\n';
  const sorted = declarations.sort((left, right) => left.split(':')[0].localeCompare(right.split(':')[0])).join(separator);
  return compact ? sorted : `${sorted}${hasTrailingSemicolon ? ';' : ''}`;
}

function normalizeDeclaration(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*:\s*/g, ': ')
    .replace(/\s*,\s*/g, ', ');
}

function normalizeWhitespace(value: string): string {
  if (value.trim().startsWith('/*')) return value.trim();
  return value.replace(/\s+/g, ' ');
}

function pushLine(value: string, lines: string[], depth: number, indent: string): void {
  if (!value.trim()) return;
  lines.push(`${indent.repeat(depth)}${value.trim()}`);
}

function getIndentation(indentation: CssIndentation): string {
  if (indentation === '4-spaces') return '    ';
  if (indentation === 'tabs') return '\t';
  return '  ';
}
