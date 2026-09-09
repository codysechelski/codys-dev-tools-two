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

  it('computes word-level ranges for a changed line, covering only the differing word', () => {
    const result = computeLineDiff('hello world', 'hello there', opts);

    expect(result.removedLines).toEqual([1]);
    expect(result.addedLines).toEqual([1]);
    expect('hello world'.slice(result.removedWordRanges[0].from, result.removedWordRanges[0].to)).toBe('world');
    expect('hello there'.slice(result.addedWordRanges[0].from, result.addedWordRanges[0].to)).toBe('there');
  });

  it('computes word-level ranges relative to the whole document, not just the line', () => {
    const result = computeLineDiff('one\nhello world\nthree', 'one\nhello there\nthree', opts);

    const removedRange = result.removedWordRanges[0];
    const addedRange = result.addedWordRanges[0];
    expect('one\nhello world\nthree'.slice(removedRange.from, removedRange.to)).toBe('world');
    expect('one\nhello there\nthree'.slice(addedRange.from, addedRange.to)).toBe('there');
  });

  it('produces no word-level ranges for a purely added or purely removed line', () => {
    const added = computeLineDiff('a', 'a\nb', opts);
    const removed = computeLineDiff('a\nb', 'a', opts);

    expect(added.removedWordRanges).toEqual([]);
    expect(added.addedWordRanges).toEqual([]);
    expect(removed.removedWordRanges).toEqual([]);
    expect(removed.addedWordRanges).toEqual([]);
  });

  it('produces no word-level ranges when nothing differs', () => {
    const result = computeLineDiff('same', 'same', opts);

    expect(result.removedWordRanges).toEqual([]);
    expect(result.addedWordRanges).toEqual([]);
  });

  it('pairs multiple changed lines within one replace block independently', () => {
    const result = computeLineDiff('cat sat\ndog ran', 'cat sat\ncow ran', opts);

    // Only the second line differs, so only it should produce word ranges.
    expect(result.removedWordRanges).toHaveLength(1);
    expect(result.addedWordRanges).toHaveLength(1);
    const original = 'cat sat\ndog ran';
    const changed = 'cat sat\ncow ran';
    expect(original.slice(result.removedWordRanges[0].from, result.removedWordRanges[0].to)).toBe('dog');
    expect(changed.slice(result.addedWordRanges[0].from, result.addedWordRanges[0].to)).toBe('cow');
  });

  it('leaves unpaired extra lines in an uneven replace block without word-level ranges', () => {
    // Two removed lines, three added lines, all mutually dissimilar so nothing lines up as "common"
    // and this becomes one adjacent removed+added block with uneven counts.
    const result = computeLineDiff('aaa\nbbb', 'xxx\nyyy\nzzz', opts);

    expect(result.removedLines).toEqual([1, 2]);
    expect(result.addedLines).toEqual([1, 2, 3]);
    // Both removed lines pair up with the first two added lines (min of the two counts); the
    // third added line ("zzz") has no removed counterpart, so only 2 ranges come out per side.
    expect(result.removedWordRanges).toHaveLength(2);
    expect(result.addedWordRanges).toHaveLength(2);
  });

  it('respects ignoreWhitespace, treating re-indented but otherwise identical lines as unchanged', () => {
    const withWhitespace = computeLineDiff('if (x) {\n  doThing();\n}', 'if (x) {\n    doThing();\n}', { ignoreWhitespace: false });
    const ignoringWhitespace = computeLineDiff('if (x) {\n  doThing();\n}', 'if (x) {\n    doThing();\n}', { ignoreWhitespace: true });

    expect(withWhitespace.identical).toBe(false);
    expect(ignoringWhitespace.identical).toBe(true);
  });
});
