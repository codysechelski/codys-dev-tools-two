export type SortScheme = 'ordinal' | 'locale' | 'natural';
export type SortDirection = 'ascending' | 'descending';

export interface LineToolOptions {
  caseInsensitive: boolean;
  trimWhitespace: boolean;
  ignoreBlankLines: boolean;
}

export interface SortOptions extends LineToolOptions {
  sortScheme: SortScheme;
  sortDirection: SortDirection;
}

export interface DuplicateLine {
  text: string;
  occurrences: number;
  lineNumbers: number[];
}

export interface LineAnalysis {
  totalLines: number;
  uniqueLineCount: number;
  duplicates: DuplicateLine[];
}

const LINE_SPLIT_PATTERN = /\r\n|\r|\n/;

export function splitLines(input: string): string[] {
  return input.length ? input.split(LINE_SPLIT_PATTERN) : [];
}

function isBlank(line: string): boolean {
  return line.trim().length === 0;
}

function normalizeOutput(line: string, trimWhitespace: boolean): string {
  return trimWhitespace ? line.trim() : line;
}

function normalizeKey(line: string, options: Pick<LineToolOptions, 'caseInsensitive' | 'trimWhitespace'>): string {
  const base = options.trimWhitespace ? line.trim() : line;
  return options.caseInsensitive ? base.toLocaleLowerCase() : base;
}

interface LineGroup {
  text: string;
  lineNumbers: number[];
}

function groupLines(input: string, options: LineToolOptions): { totalLines: number; groups: LineGroup[] } {
  const groups = new Map<string, LineGroup>();
  let totalLines = 0;

  splitLines(input).forEach((line, index) => {
    if (options.ignoreBlankLines && isBlank(line)) return;

    totalLines += 1;
    const key = normalizeKey(line, options);
    const existing = groups.get(key);
    if (existing) {
      existing.lineNumbers.push(index + 1);
    } else {
      groups.set(key, { text: normalizeOutput(line, options.trimWhitespace), lineNumbers: [index + 1] });
    }
  });

  return { totalLines, groups: [...groups.values()] };
}

export function analyzeLines(input: string, options: LineToolOptions): LineAnalysis {
  const { totalLines, groups } = groupLines(input, options);
  const duplicates = groups
    .filter((group) => group.lineNumbers.length > 1)
    .map((group) => ({ text: group.text, occurrences: group.lineNumbers.length, lineNumbers: group.lineNumbers }));

  return { totalLines, uniqueLineCount: groups.length, duplicates };
}

export function compareLines(a: string, b: string, scheme: SortScheme, caseInsensitive: boolean): number {
  if (scheme === 'ordinal') {
    if (!caseInsensitive) return a < b ? -1 : a > b ? 1 : 0;

    const foldedA = a.toLocaleLowerCase();
    const foldedB = b.toLocaleLowerCase();
    if (foldedA !== foldedB) return foldedA < foldedB ? -1 : 1;
    return a < b ? -1 : a > b ? 1 : 0;
  }

  const collator = new Intl.Collator(undefined, {
    numeric: scheme === 'natural',
    sensitivity: caseInsensitive ? 'base' : 'variant',
  });
  return collator.compare(a, b);
}

export function sortLines(input: string, options: SortOptions): string {
  let lines = splitLines(input);
  if (options.ignoreBlankLines) lines = lines.filter((line) => !isBlank(line));
  if (options.trimWhitespace) lines = lines.map((line) => line.trim());

  const direction = options.sortDirection === 'descending' ? -1 : 1;
  lines.sort((a, b) => direction * compareLines(a, b, options.sortScheme, options.caseInsensitive));

  return lines.join('\n');
}

export function removeDuplicateLines(input: string, options: LineToolOptions): string {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of splitLines(input)) {
    if (options.ignoreBlankLines && isBlank(line)) continue;

    const key = normalizeKey(line, options);
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(normalizeOutput(line, options.trimWhitespace));
  }

  return result.join('\n');
}

export function removeLinesByNumber(input: string, lineNumbersToRemove: number[]): string {
  const removeSet = new Set(lineNumbersToRemove);

  return splitLines(input)
    .filter((_, index) => !removeSet.has(index + 1))
    .join('\n');
}
