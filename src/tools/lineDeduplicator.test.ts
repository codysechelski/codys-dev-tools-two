import { describe, expect, it } from 'vitest';
import { analyzeLines, removeDuplicateLines, removeLinesByNumber, sortLines } from './lineDeduplicator';

const baseOptions = { caseInsensitive: false, trimWhitespace: false, ignoreBlankLines: false };

describe('analyzeLines', () => {
  it('finds exact duplicate lines and reports their line numbers', () => {
    const analysis = analyzeLines('apple\nbanana\napple\ncherry\nbanana\nbanana', baseOptions);

    expect(analysis.totalLines).toBe(6);
    expect(analysis.uniqueLineCount).toBe(3);
    expect(analysis.duplicates).toEqual([
      { text: 'apple', occurrences: 2, lineNumbers: [1, 3] },
      { text: 'banana', occurrences: 3, lineNumbers: [2, 5, 6] },
    ]);
  });

  it('treats differently-cased lines as distinct by default', () => {
    const analysis = analyzeLines('Apple\napple', baseOptions);

    expect(analysis.duplicates).toEqual([]);
    expect(analysis.uniqueLineCount).toBe(2);
  });

  it('groups case-insensitively when enabled', () => {
    const analysis = analyzeLines('Apple\napple\nAPPLE', { ...baseOptions, caseInsensitive: true });

    expect(analysis.duplicates).toEqual([{ text: 'Apple', occurrences: 3, lineNumbers: [1, 2, 3] }]);
  });

  it('treats whitespace-padded lines as duplicates when trimming is enabled', () => {
    const analysis = analyzeLines('apple\n  apple  ', { ...baseOptions, trimWhitespace: true });

    expect(analysis.duplicates).toEqual([{ text: 'apple', occurrences: 2, lineNumbers: [1, 2] }]);
  });

  it('excludes blank lines when ignoreBlankLines is enabled', () => {
    const analysis = analyzeLines('apple\n\n\napple', { ...baseOptions, ignoreBlankLines: true });

    expect(analysis.totalLines).toBe(2);
    expect(analysis.duplicates).toEqual([{ text: 'apple', occurrences: 2, lineNumbers: [1, 4] }]);
  });

  it('counts blank lines as duplicates when not ignored', () => {
    const analysis = analyzeLines('apple\n\n\nbanana', baseOptions);

    expect(analysis.duplicates).toEqual([{ text: '', occurrences: 2, lineNumbers: [2, 3] }]);
  });
});

describe('sortLines', () => {
  const sortDefaults = { ...baseOptions, sortScheme: 'ordinal' as const, sortDirection: 'ascending' as const };

  it('sorts ordinally with uppercase ranked above lowercase by default', () => {
    expect(sortLines('banana\nApple\ncherry\nBanana', sortDefaults)).toBe('Apple\nBanana\nbanana\ncherry');
  });

  it('sorts descending', () => {
    expect(sortLines('a\nc\nb', { ...sortDefaults, sortDirection: 'descending' })).toBe('c\nb\na');
  });

  it('folds case when case-insensitive is enabled, keeping stable order for ties', () => {
    expect(sortLines('banana\nApple\napple', { ...sortDefaults, caseInsensitive: true })).toBe('Apple\napple\nbanana');
  });

  it('sorts numbers naturally with the natural scheme', () => {
    const result = sortLines('item10\nitem2\nitem1', { ...sortDefaults, sortScheme: 'natural' });

    expect(result).toBe('item1\nitem2\nitem10');
  });

  it('sorts ordinally without numeric awareness by default', () => {
    const result = sortLines('item10\nitem2\nitem1', sortDefaults);

    expect(result).toBe('item1\nitem10\nitem2');
  });

  it('trims lines and drops blank lines when requested', () => {
    const result = sortLines('  b  \n\n a ', { ...sortDefaults, trimWhitespace: true, ignoreBlankLines: true });

    expect(result).toBe('a\nb');
  });
});

describe('removeDuplicateLines', () => {
  it('keeps the first occurrence of each line and preserves order', () => {
    expect(removeDuplicateLines('apple\nbanana\napple\ncherry', baseOptions)).toBe('apple\nbanana\ncherry');
  });

  it('dedupes case-insensitively when enabled, keeping the first-seen casing', () => {
    expect(removeDuplicateLines('Apple\napple\nAPPLE', { ...baseOptions, caseInsensitive: true })).toBe('Apple');
  });

  it('dedupes whitespace-padded lines when trimming is enabled', () => {
    expect(removeDuplicateLines('apple\n  apple  \napple', { ...baseOptions, trimWhitespace: true })).toBe('apple');
  });

  it('drops blank lines when ignoreBlankLines is enabled', () => {
    expect(removeDuplicateLines('apple\n\nbanana\n', { ...baseOptions, ignoreBlankLines: true })).toBe('apple\nbanana');
  });
});

describe('removeLinesByNumber', () => {
  it('removes only the specified line numbers, leaving the rest untouched', () => {
    expect(removeLinesByNumber('apple\nbanana\napple\ncherry\napple', [3, 5])).toBe('apple\nbanana\ncherry');
  });

  it('is a no-op when no line numbers are given', () => {
    expect(removeLinesByNumber('apple\nbanana', [])).toBe('apple\nbanana');
  });
});
