export type TableDelimiter = 'auto' | 'comma' | 'tab' | 'semicolon' | 'pipe' | 'custom';
export type TableAlignment = 'none' | 'left' | 'center' | 'right';
export type TableOutputMode = 'aligned' | 'compact';

export interface MarkdownTableOptions {
  delimiter: TableDelimiter;
  customDelimiter: string;
  hasHeaderRow: boolean;
  trimCells: boolean;
  alignment: TableAlignment;
  outputMode: TableOutputMode;
}

export interface MarkdownTableResult {
  output: string;
  detectedDelimiter: Exclude<TableDelimiter, 'auto' | 'custom'> | '';
  columnCount: number;
  rowCount: number;
  error: string;
  warning: string;
}

const delimiterValues: Record<Exclude<TableDelimiter, 'auto' | 'custom'>, string> = {
  comma: ',',
  tab: '\t',
  semicolon: ';',
  pipe: '|',
};

const detectableDelimiters: Array<{ type: Exclude<TableDelimiter, 'auto' | 'custom'>; value: string }> = [
  { type: 'tab', value: '\t' },
  { type: 'comma', value: ',' },
  { type: 'semicolon', value: ';' },
  { type: 'pipe', value: '|' },
];

export function convertTableToMarkdown(input: string, options: MarkdownTableOptions): MarkdownTableResult {
  const normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const emptyResult = { output: '', detectedDelimiter: '' as const, columnCount: 0, rowCount: 0 };

  if (!normalized.trim()) {
    return { ...emptyResult, error: '', warning: '' };
  }

  const detected = options.delimiter === 'auto' ? detectDelimiter(normalized) : undefined;
  const resolvedDelimiter = resolveDelimiter(options, detected);

  if (resolvedDelimiter === undefined) {
    return { ...emptyResult, error: 'Enter a custom delimiter.', warning: '' };
  }

  const isPipeDelimited = resolvedDelimiter === '|';
  const lines = normalized.split('\n').filter((line) => line.length > 0);
  const dataLines = isPipeDelimited ? lines.filter((line) => !isSeparatorRow(line)) : lines;

  if (!dataLines.length) {
    return { ...emptyResult, error: 'No table data found.', warning: '' };
  }

  const parsedRows = dataLines.map((line) => (isPipeDelimited ? splitPipeRow(line) : splitDelimitedLine(line, resolvedDelimiter)));
  const trimmedRows = options.trimCells ? parsedRows.map((row) => row.map((cell) => cell.trim())) : parsedRows;
  const columnCount = Math.max(...trimmedRows.map((row) => row.length));
  const hadRaggedRows = trimmedRows.some((row) => row.length !== columnCount);
  const rows = trimmedRows.map((row) => padRow(row, columnCount));

  const header = options.hasHeaderRow ? rows[0] : generateHeader(columnCount);
  const bodyRows = options.hasHeaderRow ? rows.slice(1) : rows;

  return {
    output: buildMarkdownTable(header, bodyRows, options),
    detectedDelimiter: detected ? detectableDelimiters.find((candidate) => candidate.value === detected)?.type ?? '' : '',
    columnCount,
    rowCount: bodyRows.length,
    error: '',
    warning: hadRaggedRows ? 'Some rows had a different number of columns than others; short rows were padded with empty cells.' : '',
  };
}

function resolveDelimiter(options: MarkdownTableOptions, detected: string | undefined): string | undefined {
  if (options.delimiter === 'custom') return options.customDelimiter || undefined;
  if (options.delimiter !== 'auto') return delimiterValues[options.delimiter];

  // No confidently detected delimiter (e.g. a single-column paste) — treat every line as one cell.
  return detected ?? '\u0000';
}

function detectDelimiter(input: string): string | undefined {
  const lines = input
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .slice(0, 20);

  if (!lines.length) return undefined;

  const scored = detectableDelimiters
    .map((candidate) => ({ ...candidate, score: scoreDelimiter(lines, candidate.value) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length || scored[0].score === scored[1]?.score) return undefined;

  return scored[0].value;
}

function scoreDelimiter(lines: string[], delimiter: string): number {
  const counts = lines.map((line) => splitDelimitedLine(line, delimiter).length - 1);
  const positiveCounts = counts.filter((count) => count > 0);
  if (!positiveCounts.length) return 0;

  const firstCount = positiveCounts[0];
  const consistency = positiveCounts.every((count) => count === firstCount) ? 20 : 0;

  return positiveCounts.length * 10 + Math.min(...positiveCounts) + consistency;
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

function stripOuterPipes(line: string): string {
  let result = line.trim();
  if (result.startsWith('|')) result = result.slice(1);
  if (result.endsWith('|') && !result.endsWith('\\|')) result = result.slice(0, -1);
  return result;
}

function splitPipeRow(line: string): string[] {
  const stripped = stripOuterPipes(line);
  const columns: string[] = [];
  let current = '';
  let index = 0;

  while (index < stripped.length) {
    const character = stripped[index];

    if (character === '\\' && stripped[index + 1] === '|') {
      current += '|';
      index += 2;
      continue;
    }

    if (character === '|') {
      columns.push(current);
      current = '';
      index += 1;
      continue;
    }

    current += character;
    index += 1;
  }

  columns.push(current);

  return columns;
}

function isSeparatorRow(line: string): boolean {
  const stripped = stripOuterPipes(line).trim();
  if (!stripped) return false;

  return stripped.split('|').every((cell) => /^:?-+:?$/.test(cell.trim()));
}

function padRow(row: string[], columnCount: number): string[] {
  if (row.length >= columnCount) return row;

  return [...row, ...Array(columnCount - row.length).fill('')];
}

function generateHeader(columnCount: number): string[] {
  return Array.from({ length: columnCount }, (_, index) => `Column ${index + 1}`);
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>').replace(/\t/g, ' ');
}

function alignmentToken(width: number, alignment: TableAlignment): string {
  const dashWidth = Math.max(3, width);

  if (alignment === 'left') return `:${'-'.repeat(dashWidth - 1)}`;
  if (alignment === 'right') return `${'-'.repeat(dashWidth - 1)}:`;
  if (alignment === 'center') return `:${'-'.repeat(Math.max(1, dashWidth - 2))}:`;
  return '-'.repeat(dashWidth);
}

function buildMarkdownTable(header: string[], bodyRows: string[][], options: MarkdownTableOptions): string {
  const escapedHeader = header.map(escapeMarkdownCell);
  const escapedBody = bodyRows.map((row) => row.map(escapeMarkdownCell));
  const columnCount = escapedHeader.length;

  const widths = Array.from({ length: columnCount }, (_, column) => {
    const headerLength = escapedHeader[column]?.length ?? 0;
    const bodyLengths = escapedBody.map((row) => row[column]?.length ?? 0);
    return Math.max(headerLength, ...bodyLengths, 3);
  });

  const headerLine = buildRowLine(escapedHeader, widths, options.outputMode);
  const separatorLine = buildSeparatorLine(widths, columnCount, options);
  const bodyLines = escapedBody.map((row) => buildRowLine(row, widths, options.outputMode));

  return [headerLine, separatorLine, ...bodyLines].join('\n');
}

function buildRowLine(cells: string[], widths: number[], mode: TableOutputMode): string {
  const displayCells = mode === 'aligned' ? cells.map((cell, index) => cell.padEnd(widths[index] ?? cell.length)) : cells;
  return `| ${displayCells.join(' | ')} |`;
}

function buildSeparatorLine(widths: number[], columnCount: number, options: MarkdownTableOptions): string {
  const tokens = Array.from({ length: columnCount }, (_, index) => alignmentToken(options.outputMode === 'aligned' ? widths[index] : 3, options.alignment));
  return `| ${tokens.join(' | ')} |`;
}
