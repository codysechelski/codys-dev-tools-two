import { describe, expect, it } from 'vitest';
import { applyTemplate, detectDelimiter, formatStringTemplate, parseRows } from './stringTemplateFormatter';

const defaults = {
  input: '1,one\n2,two',
  template: "The number {0} is spelled '{1}'",
  delimiter: 'comma' as const,
  customDelimiter: '',
  skipFirstLine: false,
  trimCells: true,
  lineEnding: 'lf' as const,
  staticTextBefore: '',
  staticTextAfter: '',
  joinWith: 'lf' as const,
};

describe('stringTemplateFormatter utilities', () => {
  it('formats delimited rows with numeric placeholders', () => {
    expect(formatStringTemplate(defaults).output).toBe("The number 1 is spelled 'one'\nThe number 2 is spelled 'two'");
  });

  it('supports rowIndex and colIndex placeholders', () => {
    const result = formatStringTemplate({
      ...defaults,
      template: "The number at index {rowIndex},{colIndex} is {0} and the spelling at index {rowIndex},{colIndex} is '{1}'",
    });

    expect(result.output).toBe(
      "The number at index 0,0 is 1 and the spelling at index 0,1 is 'one'\nThe number at index 1,0 is 2 and the spelling at index 1,1 is 'two'",
    );
  });

  it('supports static text before and after with a join token', () => {
    const result = formatStringTemplate({
      ...defaults,
      input: 'Texas,TX',
      template: '<option value="{1}">{0}</option>',
      staticTextBefore: '<select name="state_picklist">',
      staticTextAfter: '</select>',
      joinWith: 'lf',
    });

    expect(result.output).toBe('<select name="state_picklist">\n<option value="TX">Texas</option>\n</select>');
  });

  it('skips the first line when requested', () => {
    const result = formatStringTemplate({ ...defaults, input: 'Number,Name\n1,one', skipFirstLine: true });

    expect(result.output).toBe("The number 1 is spelled 'one'");
  });

  it('parses tab, whitespace, custom, and quoted values', () => {
    expect(parseRows('Texas\tTX', 'tab', '\t', true, false)).toEqual([['Texas', 'TX']]);
    expect(parseRows('1   one', 'whitespace', 'whitespace', true, false)).toEqual([['1', 'one']]);
    expect(parseRows('a<->b', 'custom', '<->', true, false)).toEqual([['a', 'b']]);
    expect(parseRows('"Texas, USA",TX', 'comma', ',', true, false)).toEqual([['Texas, USA', 'TX']]);
  });

  it('leaves unknown placeholders intact', () => {
    expect(applyTemplate('{0} {unknown}', ['a'], 0)).toBe('a {unknown}');
  });

  it('allows placeholder braces to be escaped', () => {
    expect(applyTemplate('{0} is in the \\{0\\} place and {1} is in the \\{1\\} place.', ['foo', 'bar'], 0)).toBe(
      'foo is in the {0} place and bar is in the {1} place.',
    );
  });

  it('detects clear delimiters and ignores unclear input', () => {
    expect(detectDelimiter('Texas\tTX\nOhio\tOH')).toBe('tab');
    expect(detectDelimiter('1|one\n2|two')).toBe('pipe');
    expect(detectDelimiter('1,one;uno\n2,two;dos')).toBeUndefined();
  });

  it('leaves out-of-range placeholders blank and reports a warning', () => {
    const result = formatStringTemplate({ ...defaults, template: "The number {0} is spelled '{1}' ({2})" });

    expect(result.output).toBe("The number 1 is spelled 'one' ()\nThe number 2 is spelled 'two' ()");
    expect(result.error).toBe('');
    expect(result.warning).toContain('row 0 {2}');
    expect(result.warning).toContain('row 1 {2}');
  });

  it('has no warning when every placeholder is in range', () => {
    expect(formatStringTemplate(defaults).warning).toBe('');
  });
});
