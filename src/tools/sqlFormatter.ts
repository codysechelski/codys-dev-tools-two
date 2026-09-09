import { tokenizeSql, type SqlToken } from './sqlTokenizer';

export type SqlOutputMode = 'expanded' | 'compact' | 'minified';
export type SqlKeywordCase = 'upper' | 'lower' | 'preserve';
export type SqlIndentation = '2-spaces' | '4-spaces' | 'tabs';

export interface SqlFormatterOptions {
  mode: SqlOutputMode;
  indentation: SqlIndentation;
  keywordCase: SqlKeywordCase;
  preserveComments: boolean;
}

export interface SqlFormatterResult {
  output: string;
  error: string;
}

// Reserved words and common functions that get the keyword-case treatment. Anything not in this
// list (table/column/relationship names, aliases, bind variables, etc.) is always left untouched.
// This intentionally covers both ANSI SQL and SOQL (Salesforce Object Query Language): SOQL's
// SELECT/FROM/WHERE/child-relationship-subquery shape is close enough to standard SQL SELECT
// syntax that a dialect-agnostic tokenizer/formatter handles it well, aside from a handful of
// SOQL-only clauses (WITH SECURITY_ENFORCED, USING SCOPE, FOR VIEW/REFERENCE) called out below.
const KEYWORDS = new Set([
  'select', 'from', 'where', 'group', 'by', 'order', 'having', 'limit', 'offset',
  'union', 'all', 'insert', 'into', 'values', 'update', 'set', 'delete', 'with', 'returning',
  'for', 'using', 'scope', 'join', 'inner', 'left', 'right', 'full', 'outer', 'cross', 'on',
  'and', 'or', 'not', 'in', 'like', 'between', 'is', 'null', 'nulls', 'first', 'last', 'as',
  'distinct', 'case', 'when', 'then', 'else', 'end', 'exists', 'asc', 'desc', 'top', 'default',
  'primary', 'key', 'foreign', 'references', 'constraint', 'create', 'alter', 'drop', 'table',
  'view', 'database', 'schema', 'truncate', 'cascade', 'reference', 'typeof',
  'security_enforced', 'data', 'category',
  'count', 'sum', 'avg', 'min', 'max', 'upper', 'lower', 'trim', 'coalesce', 'cast', 'convert',
  'now', 'current_date', 'current_timestamp', 'true', 'false',
]);

// Clause-starting phrases (checked longest-first) that begin a new top-level line. Order within
// this list doesn't matter; matching always tries longer phrases before shorter ones.
const CLAUSE_PHRASES: string[][] = [
  ['union', 'all'],
  ['group', 'by'],
  ['order', 'by'],
  ['insert', 'into'],
  ['delete', 'from'],
  ['left', 'outer', 'join'],
  ['right', 'outer', 'join'],
  ['full', 'outer', 'join'],
  ['inner', 'join'],
  ['left', 'join'],
  ['right', 'join'],
  ['full', 'join'],
  ['cross', 'join'],
  ['for', 'update'],
  ['for', 'view'],
  ['for', 'reference'],
  ['using', 'scope'],
  ['select'],
  ['from'],
  ['where'],
  ['having'],
  ['limit'],
  ['offset'],
  ['union'],
  ['values'],
  ['update'],
  ['set'],
  ['delete'],
  ['with'],
  ['returning'],
  ['join'],
].sort((a, b) => b.length - a.length);

// Words that, immediately followed by "(", should keep a space before it (a clause keyword
// opening a list/subquery). Anything else immediately followed by "(" is assumed to be a
// function call and gets no space, e.g. COUNT(Id) rather than COUNT (Id).
const SPACE_BEFORE_PAREN_WORDS = new Set([
  'in', 'values', 'exists', 'and', 'or', 'not', 'where', 'on', 'as', 'from', 'into', 'set',
  'default', 'using', 'update', 'when', 'then', 'else', 'select',
]);

interface ClauseSegment {
  keyword: SqlToken[] | null;
  body: SqlToken[];
}

interface BooleanCondition {
  connector: SqlToken | null;
  tokens: SqlToken[];
}

export function formatSql(input: string, options: SqlFormatterOptions): SqlFormatterResult {
  const source = input.trim();
  if (!source) return { output: '', error: '' };

  const { tokens: rawTokens, error: tokenizeError } = tokenizeSql(source);
  if (tokenizeError) return { output: '', error: tokenizeError };

  const balanceError = validateBalance(rawTokens);
  if (balanceError) return { output: '', error: balanceError };

  const tokens = options.preserveComments ? rawTokens : rawTokens.filter((token) => token.type !== 'comment');

  const rawStatementGroups = splitOnTopLevelSemicolons(tokens);
  const hadTrailingSemicolon = rawStatementGroups.length > 1 && rawStatementGroups[rawStatementGroups.length - 1].length === 0;
  const statementGroups = rawStatementGroups.filter((group) => group.length > 0);
  if (statementGroups.length === 0) return { output: '', error: '' };

  const formattedStatements = statementGroups.map((statementTokens) => formatStatement(statementTokens, 0, options));
  const statementSeparator = options.mode === 'minified' ? '; ' : ';\n\n';
  const lineJoiner = options.mode === 'minified' ? ' ' : '\n';

  const output = formattedStatements.map((lines) => lines.join(lineJoiner)).join(statementSeparator) + (hadTrailingSemicolon ? ';' : '');

  return { output, error: '' };
}

function validateBalance(tokens: SqlToken[]): string | null {
  let depth = 0;
  for (const token of tokens) {
    if (token.type === 'punct' && token.text === '(') depth += 1;
    if (token.type === 'punct' && token.text === ')') {
      depth -= 1;
      if (depth < 0) return 'Unexpected closing parenthesis.';
    }
  }
  if (depth > 0) return 'Missing closing parenthesis.';
  return null;
}

function splitOnTopLevelSemicolons(tokens: SqlToken[]): SqlToken[][] {
  const groups: SqlToken[][] = [];
  let current: SqlToken[] = [];
  let depth = 0;

  for (const token of tokens) {
    if (token.type === 'punct' && token.text === '(') depth += 1;
    if (token.type === 'punct' && token.text === ')') depth = Math.max(0, depth - 1);

    if (depth === 0 && token.type === 'punct' && token.text === ';') {
      groups.push(current);
      current = [];
      continue;
    }

    current.push(token);
  }
  groups.push(current);
  return groups;
}

function formatStatement(tokens: SqlToken[], indentLevel: number, options: SqlFormatterOptions): string[] {
  const segments = splitTopLevelClauses(tokens);
  const lines: string[] = [];
  for (const segment of segments) lines.push(...renderClauseLine(segment, indentLevel, options));
  return lines;
}

function splitTopLevelClauses(tokens: SqlToken[]): ClauseSegment[] {
  const segments: ClauseSegment[] = [];
  let currentKeyword: SqlToken[] | null = null;
  let currentBody: SqlToken[] = [];
  let depth = 0;
  let i = 0;

  const flush = (): void => {
    if (currentKeyword || currentBody.length) segments.push({ keyword: currentKeyword, body: currentBody });
    currentKeyword = null;
    currentBody = [];
  };

  while (i < tokens.length) {
    const token = tokens[i];
    if (token.type === 'punct' && token.text === '(') depth += 1;
    if (token.type === 'punct' && token.text === ')') depth = Math.max(0, depth - 1);

    if (depth === 0 && token.type === 'word') {
      const match = matchClausePhrase(tokens, i);
      if (match) {
        flush();
        currentKeyword = tokens.slice(i, i + match.length);
        i += match.length;
        continue;
      }
    }

    currentBody.push(token);
    i += 1;
  }
  flush();
  return segments;
}

function matchClausePhrase(tokens: SqlToken[], index: number): { length: number } | null {
  for (const phrase of CLAUSE_PHRASES) {
    if (matchesWords(tokens, index, phrase)) return { length: phrase.length };
  }
  return null;
}

function matchesWords(tokens: SqlToken[], index: number, words: string[]): boolean {
  for (let offset = 0; offset < words.length; offset += 1) {
    const token = tokens[index + offset];
    if (!token || token.type !== 'word' || token.text.toLowerCase() !== words[offset]) return false;
  }
  return true;
}

function canonicalClauseName(tokens: SqlToken[]): string {
  return tokens.map((token) => token.text.toLowerCase()).join(' ');
}

function renderClauseLine(segment: ClauseSegment, indentLevel: number, options: SqlFormatterOptions): string[] {
  const indent = getIndentString(options.indentation).repeat(indentLevel);
  const keywordText = segment.keyword ? renderKeywordPhrase(segment.keyword, options) : '';
  const clauseName = segment.keyword ? canonicalClauseName(segment.keyword) : null;

  if (options.mode === 'expanded' && clauseName === 'select') {
    const lines = [`${indent}${keywordText}`];
    const columns = splitTopLevelByComma(segment.body);
    columns.forEach((columnTokens, index) => {
      lines.push(...renderSelectItem(columnTokens, indentLevel + 1, options, index === columns.length - 1));
    });
    return lines;
  }

  if (options.mode === 'expanded' && (clauseName === 'where' || clauseName === 'having')) {
    const lines = [`${indent}${keywordText}`];
    const conditionIndent = indent + getIndentString(options.indentation);
    for (const condition of splitTopLevelBoolean(segment.body)) {
      const prefix = condition.connector ? `${renderKeywordPhrase([condition.connector], options)} ` : '';
      lines.push(`${conditionIndent}${prefix}${renderInline(condition.tokens, options)}`);
    }
    return lines;
  }

  // "INSERT INTO table (col1, col2)": the paren here is a column list, not a function call, so it
  // always gets a space after the table name even though renderInline's default heuristic
  // (identifier immediately followed by "(" => tight, like a function call) would otherwise join them.
  if (clauseName === 'insert into' && segment.body.length) {
    const [tableToken, ...rest] = segment.body;
    const tableText = renderTokenText(tableToken, options);
    const bodyText = rest.length ? `${tableText} ${renderInline(rest, options)}` : tableText;
    return [`${indent}${keywordText} ${bodyText}`];
  }

  const bodyText = renderInline(segment.body, options);
  if (!keywordText) return bodyText ? [`${indent}${bodyText}`] : [];
  return [bodyText ? `${indent}${keywordText} ${bodyText}` : `${indent}${keywordText}`];
}

function renderSelectItem(tokens: SqlToken[], indentLevel: number, options: SqlFormatterOptions, isLast: boolean): string[] {
  const indent = getIndentString(options.indentation).repeat(indentLevel);
  const trailingComma = isLast ? '' : ',';

  const subquery = extractBareSubquery(tokens);
  if (subquery) {
    const innerLines = formatStatement(subquery, indentLevel + 1, options);
    return [`${indent}(`, ...innerLines, `${indent})${trailingComma}`];
  }

  return [`${indent}${renderInline(tokens, options)}${trailingComma}`];
}

/** Recognizes a select item that is entirely a single parenthesized subquery, e.g. `(SELECT Id FROM Contacts)`. */
function extractBareSubquery(tokens: SqlToken[]): SqlToken[] | null {
  if (tokens.length < 2) return null;
  if (tokens[0].type !== 'punct' || tokens[0].text !== '(') return null;
  if (tokens[tokens.length - 1].type !== 'punct' || tokens[tokens.length - 1].text !== ')') return null;

  let depth = 0;
  for (let i = 0; i < tokens.length; i += 1) {
    if (tokens[i].type === 'punct' && tokens[i].text === '(') depth += 1;
    if (tokens[i].type === 'punct' && tokens[i].text === ')') {
      depth -= 1;
      if (depth === 0 && i !== tokens.length - 1) return null;
    }
  }

  const inner = tokens.slice(1, -1);
  if (!inner.length || inner[0].type !== 'word' || inner[0].text.toLowerCase() !== 'select') return null;
  return inner;
}

function splitTopLevelByComma(tokens: SqlToken[]): SqlToken[][] {
  const groups: SqlToken[][] = [];
  let current: SqlToken[] = [];
  let depth = 0;

  for (const token of tokens) {
    if (token.type === 'punct' && token.text === '(') depth += 1;
    if (token.type === 'punct' && token.text === ')') depth = Math.max(0, depth - 1);

    if (depth === 0 && token.type === 'punct' && token.text === ',') {
      groups.push(current);
      current = [];
      continue;
    }
    current.push(token);
  }
  groups.push(current);
  return groups.filter((group) => group.length > 0);
}

function splitTopLevelBoolean(tokens: SqlToken[]): BooleanCondition[] {
  const conditions: BooleanCondition[] = [];
  let current: SqlToken[] = [];
  let connector: SqlToken | null = null;
  let depth = 0;

  for (const token of tokens) {
    if (token.type === 'punct' && token.text === '(') depth += 1;
    if (token.type === 'punct' && token.text === ')') depth = Math.max(0, depth - 1);

    const lower = token.type === 'word' ? token.text.toLowerCase() : '';
    if (depth === 0 && (lower === 'and' || lower === 'or')) {
      conditions.push({ connector, tokens: current });
      connector = token;
      current = [];
      continue;
    }
    current.push(token);
  }
  conditions.push({ connector, tokens: current });
  return conditions.filter((condition) => condition.tokens.length > 0);
}

function renderInline(tokens: SqlToken[], options: SqlFormatterOptions): string {
  let out = '';
  for (let i = 0; i < tokens.length; i += 1) {
    const text = renderTokenText(tokens[i], options);
    if (i === 0) {
      out += text;
      continue;
    }
    out += needsSpaceBetween(tokens[i - 1], tokens[i], tokens[i - 2] ?? null) ? ` ${text}` : text;
  }
  return out;
}

function needsSpaceBetween(prev: SqlToken, current: SqlToken, beforePrev: SqlToken | null): boolean {
  if (prev.type === 'punct' && prev.text === '(') return false;
  if (current.type === 'punct' && (current.text === ')' || current.text === ',' || current.text === ';')) return false;

  if (current.type === 'punct' && current.text === '(') {
    return !(prev.type === 'word' && !SPACE_BEFORE_PAREN_WORDS.has(prev.text.toLowerCase()));
  }

  if (prev.type === 'op' && (prev.text === '-' || prev.text === '+') && isUnaryOperatorContext(beforePrev)) return false;

  return true;
}

function isUnaryOperatorContext(beforePrev: SqlToken | null): boolean {
  if (!beforePrev) return true;
  if (beforePrev.type === 'punct' && (beforePrev.text === '(' || beforePrev.text === ',')) return true;
  if (beforePrev.type === 'op') return true;
  if (beforePrev.type === 'word' && isKeyword(beforePrev.text)) return true;
  return false;
}

function renderTokenText(token: SqlToken, options: SqlFormatterOptions): string {
  if (token.type === 'word' && isKeyword(token.text)) return applyCase(token.text, options.keywordCase);
  if (token.type === 'comment' && token.text.startsWith('--')) return `/*${token.text.slice(2)} */`;
  return token.text;
}

function renderKeywordPhrase(tokens: SqlToken[], options: SqlFormatterOptions): string {
  return tokens.map((token) => applyCase(token.text, options.keywordCase)).join(' ');
}

function isKeyword(text: string): boolean {
  return !text.includes('.') && KEYWORDS.has(text.toLowerCase());
}

function applyCase(text: string, mode: SqlKeywordCase): string {
  if (mode === 'upper') return text.toUpperCase();
  if (mode === 'lower') return text.toLowerCase();
  return text;
}

function getIndentString(indentation: SqlIndentation): string {
  if (indentation === '4-spaces') return '    ';
  if (indentation === 'tabs') return '\t';
  return '  ';
}
