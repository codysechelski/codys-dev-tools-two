import { describe, expect, it } from 'vitest';
import { computeLineDiff } from './diffTool';

const opts = { ignoreWhitespace: false };

describe('computeLineDiff', () => {
  it('reports no differences for identical text', () => {
    const result = computeLineDiff('a\nb\nc', 'a\nb\nc', opts);

    expect(result.identical).toBe(true);
    expect(result.removedLines).toEqual([]);
    expect(result.addedLines).toEqual([]);
  });

  it('reports no differences for two empty strings', () => {
    const result = computeLineDiff('', '', opts);

    expect(result.identical).toBe(true);
  });

  it('marks a single changed line as removed on the left and added on the right', () => {
    const result = computeLineDiff('a\nb\nc', 'a\nB\nc', opts);

    expect(result.removedLines).toEqual([2]);
    expect(result.addedLines).toEqual([2]);
    expect(result.identical).toBe(false);
  });

  it('marks purely appended lines as added only, with no removals', () => {
    const result = computeLineDiff('a\nb', 'a\nb\nc\nd', opts);

    expect(result.removedLines).toEqual([]);
    expect(result.addedLines).toEqual([3, 4]);
  });

  it('marks purely deleted lines as removed only, with no additions', () => {
    const result = computeLineDiff('a\nb\nc\nd', 'a\nb', opts);

    expect(result.removedLines).toEqual([3, 4]);
    expect(result.addedLines).toEqual([]);
  });

  it('handles a line inserted in the middle without flagging unrelated lines', () => {
    const result = computeLineDiff('a\nc', 'a\nb\nc', opts);

    expect(result.removedLines).toEqual([]);
    expect(result.addedLines).toEqual([2]);
  });

  it('handles multiple separate hunks independently', () => {
    const result = computeLineDiff('one\ntwo\nthree\nfour\nfive', 'ONE\ntwo\nthree\nFOUR\nfive', opts);

    expect(result.removedLines).toEqual([1, 4]);
    expect(result.addedLines).toEqual([1, 4]);
  });

  it('treats an entirely new document as fully added when the original is empty', () => {
    const result = computeLineDiff('', 'a\nb', opts);

    expect(result.removedLines).toEqual([]);
    expect(result.addedLines).toEqual([1, 2]);
  });

  it('treats an emptied document as fully removed when the changed text is empty', () => {
    const result = computeLineDiff('a\nb', '', opts);

    expect(result.removedLines).toEqual([1, 2]);
    expect(result.addedLines).toEqual([]);
  });

  it('respects ignoreWhitespace, treating re-indented but otherwise identical lines as unchanged', () => {
    const withWhitespace = computeLineDiff('if (x) {\n  doThing();\n}', 'if (x) {\n    doThing();\n}', { ignoreWhitespace: false });
    const ignoringWhitespace = computeLineDiff('if (x) {\n  doThing();\n}', 'if (x) {\n    doThing();\n}', { ignoreWhitespace: true });

    expect(withWhitespace.identical).toBe(false);
    expect(ignoringWhitespace.identical).toBe(true);
  });
});
