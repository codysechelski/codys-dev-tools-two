import { describe, expect, it } from 'vitest';
import { formatJson, sortJsonKeys } from './jsonFormatter';

describe('formatJson', () => {
  it('formats JSON with 2 spaces', () => {
    const result = formatJson('{"b":1,"a":{"d":2}}', {
      mode: 'formatted',
      indentation: '2-spaces',
      sortKeys: false,
    });

    expect(result.error).toBe('');
    expect(result.output).toBe(`{
  "b": 1,
  "a": {
    "d": 2
  }
}`);
  });

  it('formats JSON with 4 spaces', () => {
    const result = formatJson('{"a":{"b":1}}', {
      mode: 'formatted',
      indentation: '4-spaces',
      sortKeys: false,
    });

    expect(result.output).toContain('\n    "a"');
    expect(result.output).toContain('\n        "b"');
  });

  it('formats JSON with tabs', () => {
    const result = formatJson('{"a":{"b":1}}', {
      mode: 'formatted',
      indentation: 'tabs',
      sortKeys: false,
    });

    expect(result.output).toContain('\n\t"a"');
    expect(result.output).toContain('\n\t\t"b"');
  });

  it('minifies JSON', () => {
    const result = formatJson('{ "a": 1, "b": true }', {
      mode: 'compact',
      indentation: '4-spaces',
      sortKeys: false,
    });

    expect(result.output).toBe('{"a":1,"b":true}');
  });

  it('creates newline-delimited JSON for arrays', () => {
    const result = formatJson('[{"a":1},{"b":2}]', {
      mode: 'newline-delimited',
      indentation: '2-spaces',
      sortKeys: false,
    });

    expect(result.output).toBe('{"a":1}\n{"b":2}');
  });

  it('falls back to formatted JSON when newline-delimited mode receives a non-array', () => {
    const result = formatJson('{"a":1}', {
      mode: 'newline-delimited',
      indentation: '2-spaces',
      sortKeys: false,
    });

    expect(result.output).toBe(`{
  "a": 1
}`);
  });

  it('returns parse errors for invalid JSON', () => {
    const result = formatJson('{bad}', {
      mode: 'formatted',
      indentation: '2-spaces',
      sortKeys: false,
    });

    expect(result.output).toBe('');
    expect(result.error).not.toBe('');
  });
});

describe('sortJsonKeys', () => {
  it('sorts object keys recursively without reordering arrays', () => {
    expect(sortJsonKeys({ b: 1, a: [{ d: 4, c: 3 }] })).toEqual({ a: [{ c: 3, d: 4 }], b: 1 });
  });
});
