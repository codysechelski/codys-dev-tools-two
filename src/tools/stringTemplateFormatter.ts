export type InputDelimiter = 'comma' | 'tab' | 'semicolon' | 'colon' | 'dash' | 'underscore' | 'pipe' | 'space' | 'whitespace' | 'custom';
export type JoinToken = 'lf' | 'crlf' | 'comma' | 'comma-space' | 'semicolon' | 'semicolon-space' | 'colon' | 'colon-space' | 'pipe' | 'tab' | 'space' | 'none';

export interface StringTemplateFormatterOptions {
  input: string;
  template: string;
  delimiter: InputDelimiter;
  customDelimiter: string;
  skipFirstLine: boolean;
  trimCells: boolean;
  lineEnding: JoinToken;
  staticTextBefore: string;
  staticTextAfter: string;
  joinWith: JoinToken;
}

export interface StringTemplateFormatterResult {
  output: string;
  rows: string[][];
  error: string;
  warning: string;
}

const delimiterValues: Record<Exclude<InputDelimiter, 'custom' | 'whitespace'>, string> = {
  comma: ',',
  tab: '\t',
  semicolon: ';',
  colon: ':',
  dash: '-',
  underscore: '_',
  pipe: '|',
  space: ' ',
};

const joinValues: Record<JoinToken, string> = {
  lf: '\n',
  crlf: '\r\n',
  comma: ',',
  'comma-space': ', ',
  semicolon: ';',
  'semicolon-space': '; ',
  colon: ':',
  'colon-space': ': ',
  pipe: '|',
  tab: '\t',
  space: ' ',
  none: '',
};

const detectableDelimiters: Array<{ type: InputDelimiter; value: string }> = [
  { type: 'tab', value: '\t' },
  { type: 'comma', value: ',' },
  { type: 'semicolon', value: ';' },
  { type: 'colon', value: ':' },
  { type: 'pipe', value: '|' },
  { type: 'dash', value: '-' },
  { type: 'underscore', value: '_' },
];

export function formatStringTemplate(options: StringTemplateFormatterOptions): StringTemplateFormatterResult {
  const delimiter = getDelimiter(options);

  if (!delimiter) {
    return { output: '', rows: [], error: 'Enter a custom delimiter.', warning: '' };
  }

  const rows = parseRows(options.input, options.delimiter, delimiter, options.trimCells, options.skipFirstLine);
  const formattedRows = rows.map((row, rowIndex) => applyTemplate(options.template, row, rowIndex));
  const rowOutput = formattedRows.join(getJoinValue(options.lineEnding));
  const parts = [options.staticTextBefore, rowOutput, options.staticTextAfter].filter((part) => part.length > 0);
  const outOfRangeByRow = rows
    .map((row, rowIndex) => ({ rowIndex, columns: findOutOfRangeColumns(options.template, row) }))
    .filter((entry) => entry.columns.length > 0);

  return {
    output: parts.join(getJoinValue(options.joinWith)),
    rows,
    error: '',
    warning: buildOutOfRangeWarning(outOfRangeByRow),
  };
}

export function parseRows(input: string, delimiterType: InputDelimiter, delimiter: string, trimCells: boolean, skipFirstLine: boolean): string[][] {
  const lines = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const dataLines = skipFirstLine ? lines.slice(1) : lines;

  return dataLines.filter((line) => line.length > 0).map((line) => parseLine(line, delimiterType, delimiter, trimCells));
}

export function applyTemplate(template: string, row: string[], rowIndex: number): string {
  const tokens = [...template.matchAll(/(?<!\\)\{(rowIndex|colIndex|\d+)(?<!\\)\}/g)];
  let output = '';
  let cursor = 0;

  tokens.forEach((token, tokenIndex) => {
    const [placeholder, key] = token;
    const index = token.index ?? 0;
    output += template.slice(cursor, index);
    output += getPlaceholderValue(key, row, rowIndex, tokens.slice(tokenIndex + 1));
    cursor = index + placeholder.length;
  });

  return unescapeBraces(output + template.slice(cursor));
}

export function getJoinValue(join: JoinToken): string {
  return joinValues[join];
}

export function detectDelimiter(input: string): InputDelimiter | undefined {
  const lines = input
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .slice(0, 10);

  if (!lines.length) return undefined;

  const candidates = detectableDelimiters.map((candidate) => ({ ...candidate, score: scoreDelimiter(lines, candidate.value) })).filter((candidate) => candidate.score > 0);
  const whitespaceScore = scoreWhitespace(lines);
  if (whitespaceScore > 0) candidates.push({ type: 'whitespace', value: 'whitespace', score: whitespaceScore });

  const sorted = candidates.sort((a, b) => b.score - a.score);
  if (sorted.length === 0 || sorted[0].score === sorted[1]?.score) return undefined;

  return sorted[0].type;
}

function parseLine(line: string, delimiterType: InputDelimiter, delimiter: string, trimCells: boolean): string[] {
  if (delimiterType === 'whitespace') {
    const columns = line.trim().split(/\s+/);

    return trimCells ? columns.map((column) => column.trim()) : columns;
  }

  const columns = splitDelimitedLine(line, delimiter);

  return trimCells ? columns.map((column) => column.trim()) : columns;
}

function splitDelimitedLine(line: string, delimiter: string): string[] {
  const columns: string[] = [];
  let current = '';
  let index = 0;
  let inQuotes = false;

  while (index < line.length) {
    const character = line[index];

    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 2;
        continue;
      }

      inQuotes = !inQuotes;
      index += 1;
      continue;
    }

    if (!inQuotes && line.startsWith(delimiter, index)) {
      columns.push(current);
      current = '';
      index += delimiter.length;
      continue;
    }

    current += character;
    index += 1;
  }

  columns.push(current);

  return columns;
}

function getPlaceholderValue(key: string, row: string[], rowIndex: number, nextTokens: RegExpMatchArray[]): string {
  if (key === 'rowIndex') return rowIndex.toString();
  if (key === 'colIndex') return getNextColumnIndex(nextTokens);

  return row[Number(key)] ?? '';
}

function getNextColumnIndex(nextTokens: RegExpMatchArray[]): string {
  const nextColumnToken = nextTokens.find((token) => /^\d+$/.test(token[1] ?? ''));

  return nextColumnToken?.[1] ?? '';
}

function findOutOfRangeColumns(template: string, row: string[]): number[] {
  const tokens = [...template.matchAll(/(?<!\\)\{(rowIndex|colIndex|\d+)(?<!\\)\}/g)];

  return tokens
    .map((token) => token[1])
    .filter((key) => /^\d+$/.test(key))
    .map(Number)
    .filter((columnIndex) => columnIndex >= row.length);
}

function buildOutOfRangeWarning(entries: Array<{ rowIndex: number; columns: number[] }>): string {
  if (!entries.length) return '';

  const occurrences = entries.flatMap((entry) => entry.columns.map((columnIndex) => `row ${entry.rowIndex} {${columnIndex}}`));
  const maxListed = 5;
  const listed = occurrences.slice(0, maxListed).join(', ');
  const remaining = occurrences.length - maxListed;
  const suffix = remaining > 0 ? `, and ${remaining} more` : '';
  const plural = occurrences.length === 1 ? 'placeholder is' : 'placeholders are';

  return `${occurrences.length} ${plural} out of range for the input data and were left blank: ${listed}${suffix}.`;
}

function scoreDelimiter(lines: string[], delimiter: string): number {
  const counts = lines.map((line) => splitDelimitedLine(line, delimiter).length - 1);
  const positiveCounts = counts.filter((count) => count > 0);
  if (!positiveCounts.length) return 0;

  const firstCount = positiveCounts[0];
  const consistency = positiveCounts.every((count) => count === firstCount) ? 20 : 0;

  return positiveCounts.length * 10 + Math.min(...positiveCounts) + consistency;
}

function scoreWhitespace(lines: string[]): number {
  if (lines.some((line) => line.includes('\t'))) return 0;

  const counts = lines.map((line) => line.trim().split(/\s+/).length - 1).filter((count) => count > 0);
  if (!counts.length) return 0;

  const firstCount = counts[0];
  const consistency = counts.every((count) => count === firstCount) ? 20 : 0;

  return counts.length * 10 + Math.min(...counts) + consistency;
}

function unescapeBraces(value: string): string {
  return value.replace(/\\([{}])/g, '$1');
}

function getDelimiter(options: StringTemplateFormatterOptions): string {
  if (options.delimiter === 'custom') return options.customDelimiter;
  if (options.delimiter === 'whitespace') return 'whitespace';

  return delimiterValues[options.delimiter];
}
