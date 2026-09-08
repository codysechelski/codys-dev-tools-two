import { describe, expect, it } from 'vitest';
import { convertTableToMarkdown, type MarkdownTableOptions } from './markdownTableConverter';

const base: MarkdownTableOptions = {
  delimiter: 'auto',
  customDelimiter: '',
  hasHeaderRow: true,
  trimCells: true,
  alignment: 'none',
  outputMode: 'aligned',
};

describe('convertTableToMarkdown', () => {
  it('converts comma-separated input, auto-detecting the delimiter', () => {
    const result = convertTableToMarkdown('Name,Age\nAda,36\nGrace,85', base);

    expect(result.error).toBe('');
    expect(result.detectedDelimiter).toBe('comma');
    expect(result.columnCount).toBe(2);
    expect(result.rowCount).toBe(2);
    expect(result.output).toBe('| Name  | Age |\n| ----- | --- |\n| Ada   | 36  |\n| Grace | 85  |');
  });

  it('converts tab-separated input (Excel/webpage paste), auto-detecting the delimiter', () => {
    const result = convertTableToMarkdown('Name\tAge\nAda\t36', base);

    expect(result.detectedDelimiter).toBe('tab');
    expect(result.output).toBe('| Name | Age |\n| ---- | --- |\n| Ada  | 36  |');
  });

  it('respects an explicit semicolon delimiter', () => {
    const result = convertTableToMarkdown('Name;Age\nAda;36', { ...base, delimiter: 'semicolon' });

    expect(result.output).toBe('| Name | Age |\n| ---- | --- |\n| Ada  | 36  |');
  });

  it('respects a custom delimiter', () => {
    const result = convertTableToMarkdown('Name|Age\nAda|36', { ...base, delimiter: 'custom', customDelimiter: '|' });

    expect(result.output).toBe('| Name | Age |\n| ---- | --- |\n| Ada  | 36  |');
  });

  it('errors when a custom delimiter is selected but left blank', () => {
    const result = convertTableToMarkdown('a,b', { ...base, delimiter: 'custom', customDelimiter: '' });

    expect(result.output).toBe('');
    expect(result.error).toBe('Enter a custom delimiter.');
  });

  it('honors quoted CSV fields containing the delimiter', () => {
    const result = convertTableToMarkdown('Name,City\n"Smith, Ada","New York"', { ...base, delimiter: 'comma' });

    expect(result.output).toContain('| Smith, Ada | New York |');
  });

  it('re-parses a pasted markdown table, dropping the separator row', () => {
    const result = convertTableToMarkdown('| Name | Age |\n| --- | --- |\n| Ada | 36 |', { ...base, delimiter: 'pipe' });

    expect(result.rowCount).toBe(1);
    expect(result.output).toBe('| Name | Age |\n| ---- | --- |\n| Ada  | 36  |');
  });

  it('treats the first line as generic column headers when there is no header row', () => {
    const result = convertTableToMarkdown('Ada,36\nGrace,85', { ...base, delimiter: 'comma', hasHeaderRow: false });

    expect(result.output).toBe('| Column 1 | Column 2 |\n| -------- | -------- |\n| Ada      | 36       |\n| Grace    | 85       |');
  });

  it('pads ragged rows and reports a warning', () => {
    const result = convertTableToMarkdown('a,b,c\n1,2', { ...base, delimiter: 'comma' });

    expect(result.warning).toContain('padded with empty cells');
    expect(result.columnCount).toBe(3);
  });

  it('escapes pipe characters inside cell values', () => {
    const result = convertTableToMarkdown('Name,Note\nAda,"a | b"', { ...base, delimiter: 'comma' });

    expect(result.output).toContain('a \\| b');
  });

  it('applies left, center, and right alignment tokens', () => {
    const left = convertTableToMarkdown('a,b\n1,2', { ...base, delimiter: 'comma', alignment: 'left' });
    const center = convertTableToMarkdown('a,b\n1,2', { ...base, delimiter: 'comma', alignment: 'center' });
    const right = convertTableToMarkdown('a,b\n1,2', { ...base, delimiter: 'comma', alignment: 'right' });

    expect(left.output.split('\n')[1]).toBe('| :-- | :-- |');
    expect(center.output.split('\n')[1]).toBe('| :-: | :-: |');
    expect(right.output.split('\n')[1]).toBe('| --: | --: |');
  });

  it('produces compact output without column padding', () => {
    const result = convertTableToMarkdown('Name,Age\nAda,36\nGrace,85', { ...base, delimiter: 'comma', outputMode: 'compact' });

    expect(result.output).toBe('| Name | Age |\n| --- | --- |\n| Ada | 36 |\n| Grace | 85 |');
  });

  it('treats single-column input as a one-column table instead of erroring', () => {
    const result = convertTableToMarkdown('Ada\nGrace', { ...base, hasHeaderRow: false });

    expect(result.error).toBe('');
    expect(result.columnCount).toBe(1);
    expect(result.output).toBe('| Column 1 |\n| -------- |\n| Ada      |\n| Grace    |');
  });

  it('returns nothing for empty input', () => {
    const result = convertTableToMarkdown('   ', base);

    expect(result.output).toBe('');
    expect(result.error).toBe('');
  });
});
