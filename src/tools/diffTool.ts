import { diffLines } from 'diff';

export interface DiffOptions {
  ignoreWhitespace: boolean;
}

export interface LineDiffResult {
  removedLines: number[];
  addedLines: number[];
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
  let originalLine = 1;
  let changedLine = 1;

  for (const part of parts) {
    const count = part.count ?? 0;

    if (part.removed) {
      for (let offset = 0; offset < count; offset += 1) removedLines.push(originalLine + offset);
      originalLine += count;
    } else if (part.added) {
      for (let offset = 0; offset < count; offset += 1) addedLines.push(changedLine + offset);
      changedLine += count;
    } else {
      originalLine += count;
      changedLine += count;
    }
  }

  return {
    removedLines,
    addedLines,
    removedCount: removedLines.length,
    addedCount: addedLines.length,
    identical: removedLines.length === 0 && addedLines.length === 0,
  };
}
