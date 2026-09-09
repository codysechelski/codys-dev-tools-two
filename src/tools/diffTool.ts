import { diffLines, diffWordsWithSpace, type Change } from 'diff';

export interface DiffOptions {
  ignoreWhitespace: boolean;
}

export interface CharRange {
  from: number;
  to: number;
}

export interface LineDiffResult {
  removedLines: number[];
  addedLines: number[];
  /** Word-level ranges (absolute offsets into `original`) for lines that were changed rather than purely removed. */
  removedWordRanges: CharRange[];
  /** Word-level ranges (absolute offsets into `changed`) for lines that were changed rather than purely added. */
  addedWordRanges: CharRange[];
  removedCount: number;
  addedCount: number;
  identical: boolean;
}

export function computeLineDiff(original: string, changed: string, options: DiffOptions): LineDiffResult {
  // ignoreNewlineAtEof avoids flagging the last line as changed just because only one side ends with a
  // trailing newline (e.g. "a\nb" vs "a\nb\nc") — that's not a meaningful difference for this tool's purposes.
  const parts = diffLines(original, changed, { ignoreWhitespace: options.ignoreWhitespace, ignoreNewlineAtEof: true });

  const removedLines: number[] = [];
  const addedLines: number[] = [];
  const removedWordRanges: CharRange[] = [];
  const addedWordRanges: CharRange[] = [];
  let originalLine = 1;
  let changedLine = 1;
  let originalOffset = 0;
  let changedOffset = 0;

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    const count = part.count ?? 0;
    const next = parts[i + 1];

    if (part.removed && next?.added) {
      const nextCount = next.count ?? 0;
      diffChangedLinePair(part.value, next.value, originalOffset, changedOffset, removedWordRanges, addedWordRanges);

      for (let offset = 0; offset < count; offset += 1) removedLines.push(originalLine + offset);
      for (let offset = 0; offset < nextCount; offset += 1) addedLines.push(changedLine + offset);

      originalLine += count;
      changedLine += nextCount;
      originalOffset += part.value.length;
      changedOffset += next.value.length;
      i += 1; // the "added" part was already consumed above
      continue;
    }

    if (part.removed) {
      for (let offset = 0; offset < count; offset += 1) removedLines.push(originalLine + offset);
      originalLine += count;
      originalOffset += part.value.length;
      continue;
    }

    if (part.added) {
      for (let offset = 0; offset < count; offset += 1) addedLines.push(changedLine + offset);
      changedLine += count;
      changedOffset += part.value.length;
      continue;
    }

    originalLine += count;
    changedLine += count;
    originalOffset += part.value.length;
    changedOffset += part.value.length;
  }

  return {
    removedLines,
    addedLines,
    removedWordRanges,
    addedWordRanges,
    removedCount: removedLines.length,
    addedCount: addedLines.length,
    identical: removedLines.length === 0 && addedLines.length === 0,
  };
}

/**
 * Pairs up the individual lines of a removed block with the individual lines of the following
 * added block (by position) and, for each pair, computes a word-level diff so callers can
 * highlight exactly what changed within an edited line, not just that the line changed. Extra
 * lines on either side (when the two blocks have different line counts) are left without
 * word-level ranges — they still get the caller's line-level highlighting, just not the finer detail.
 */
function diffChangedLinePair(
  removedValue: string,
  addedValue: string,
  removedBaseOffset: number,
  addedBaseOffset: number,
  removedWordRanges: CharRange[],
  addedWordRanges: CharRange[],
): void {
  const removedPieces = splitIntoLinePieces(removedValue);
  const addedPieces = splitIntoLinePieces(addedValue);
  const pairCount = Math.min(removedPieces.length, addedPieces.length);

  let removedPieceOffset = removedBaseOffset;
  let addedPieceOffset = addedBaseOffset;

  for (let i = 0; i < pairCount; i += 1) {
    const removedLine = stripTrailingNewline(removedPieces[i]);
    const addedLine = stripTrailingNewline(addedPieces[i]);

    diffWordsWithinLine(removedLine, addedLine, removedPieceOffset, addedPieceOffset, removedWordRanges, addedWordRanges);

    removedPieceOffset += removedPieces[i].length;
    addedPieceOffset += addedPieces[i].length;
  }
}

function diffWordsWithinLine(
  removedLine: string,
  addedLine: string,
  removedLineOffset: number,
  addedLineOffset: number,
  removedWordRanges: CharRange[],
  addedWordRanges: CharRange[],
): void {
  if (removedLine === addedLine) return;

  const wordParts: Change[] = diffWordsWithSpace(removedLine, addedLine);
  let removedRunning = removedLineOffset;
  let addedRunning = addedLineOffset;

  for (const part of wordParts) {
    const length = part.value.length;
    if (part.removed) {
      if (length > 0) removedWordRanges.push({ from: removedRunning, to: removedRunning + length });
      removedRunning += length;
    } else if (part.added) {
      if (length > 0) addedWordRanges.push({ from: addedRunning, to: addedRunning + length });
      addedRunning += length;
    } else {
      removedRunning += length;
      addedRunning += length;
    }
  }
}

function splitIntoLinePieces(value: string): string[] {
  return value.match(/[^\n]*\n|[^\n]+/g) ?? [];
}

function stripTrailingNewline(line: string): string {
  return line.endsWith('\n') ? line.slice(0, -1) : line;
}
