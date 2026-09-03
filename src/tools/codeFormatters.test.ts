import { describe, expect, it } from 'vitest';
import { formatHtml, formatJavaScript, formatLua, formatPython } from './codeFormatters';

const options = { mode: 'formatted' as const, indentation: '2-spaces' as const, preserveComments: true };

describe('formatJavaScript', () => {
  it('formats JavaScript blocks', () => {
    const result = formatJavaScript('function test(){const value=1;return value;}', options);
    expect(result.error).toBe('');
    expect(result.output).toContain('function test() {\n  const value=1;');
  });

  it('reports unbalanced JavaScript delimiters', () => {
    expect(formatJavaScript('function test(){', options).error).toBe('Missing closing }.');
  });

  it('can normalize common JavaScript style options', () => {
    const result = formatJavaScript('const name="Cody"\nconst list=[1,2,]', {
      ...options,
      jsSemicolons: 'add',
      jsQuoteStyle: 'single',
      jsTrailingCommas: 'remove',
    });

    expect(result.output).toContain("const name='Cody';");
    expect(result.output).toContain('const list=[1,2];');
  });
});

describe('formatHtml', () => {
  it('formats nested HTML', () => {
    const result = formatHtml('<main><h1>Hello</h1><p>World</p></main>', options);
    expect(result.error).toBe('');
    expect(result.output).toContain('<main>\n  <h1>\n    Hello');
  });

  it('reports mismatched HTML tags', () => {
    expect(formatHtml('<main><p>Bad</main>', options).error).toBe('Unexpected closing </main>.');
  });

  it('can collapse whitespace and use XHTML-style void tags', () => {
    const result = formatHtml('<main>  <img src="x">   <p>Hello   world</p></main>', {
      ...options,
      htmlCollapseWhitespace: true,
      htmlVoidTagStyle: 'xhtml',
      htmlWrapTextNodes: false,
    });

    expect(result.output).toContain('<img src="x" />');
    expect(result.output).toContain('<p>Hello world');
  });
});

describe('formatPython', () => {
  it('formats Python indentation', () => {
    const result = formatPython('def test():\nvalue = 1\nreturn value', options);
    expect(result.error).toBe('');
    expect(result.output).toContain('def test():\n  value = 1');
  });

  it('minifies Python by trimming blank lines', () => {
    const result = formatPython('def test():\n\n  return 1', { ...options, mode: 'compact' });
    expect(result.output).toBe('def test():\nreturn 1');
  });

  it('can preserve blank lines and normalize indentation', () => {
    const result = formatPython('def test():\n\n\treturn 1', {
      ...options,
      indentation: '4-spaces',
      preserveBlankLines: true,
      pythonNormalizeIndentation: true,
    });

    expect(result.output).toContain('def test():\n\n    return 1');
  });
});

describe('formatLua', () => {
  it('formats Lua block indentation', () => {
    const result = formatLua('local function greet(name)\nlocal message = "Hello, " .. name\nreturn message\nend', {
      ...options,
      luaNormalizeIndentation: true,
    });

    expect(result.error).toBe('');
    expect(result.output).toContain('local function greet(name)\n  local message = "Hello, " .. name\n  return message\nend');
  });

  it('can remove Lua comments', () => {
    const result = formatLua('-- note\nlocal value = 1', {
      ...options,
      preserveComments: false,
    });

    expect(result.output).toBe('local value = 1');
  });

  it('reports missing Lua block endings', () => {
    const result = formatLua('if ready then\nprint("ready")', options);

    expect(result.error).toBe('Missing closing end or until.');
  });
});
