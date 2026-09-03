import { describe, expect, it } from 'vitest';
import { formatCss } from './cssFormatter';

describe('formatCss', () => {
  it('formats css with selected indentation', () => {
    const result = formatCss('.card{color:red;background:blue;}', {
      mode: 'expanded',
      indentation: '2-spaces',
      sortDeclarations: false,
      preserveComments: true,
    });

    expect(result.error).toBe('');
    expect(result.output).toContain('.card {\n  color: red;\n  background: blue;\n}');
  });

  it('compresses css and removes comments when requested', () => {
    const result = formatCss('/* note */\n.card { color: red; }', {
      mode: 'compressed',
      indentation: '2-spaces',
      sortDeclarations: false,
      preserveComments: false,
    });

    expect(result.output).toBe('.card{color:red}');
  });

  it('formats css with nested brace style', () => {
    const result = formatCss('.card{color:red;}', {
      mode: 'nested',
      indentation: '2-spaces',
      sortDeclarations: false,
      preserveComments: true,
    });

    expect(result.output).toContain('.card\n{\n  color: red;\n}');
  });

  it('formats css with compact one-line rule blocks', () => {
    const result = formatCss('.card{color:red;background:blue;}', {
      mode: 'compact',
      indentation: '2-spaces',
      sortDeclarations: false,
      preserveComments: true,
    });

    expect(result.output).toBe('.card { color: red; background: blue; }');
  });

  it('sorts declarations inside simple blocks', () => {
    const result = formatCss('.card{z-index:1;color:red;background:blue;}', {
      mode: 'expanded',
      indentation: '2-spaces',
      sortDeclarations: true,
      preserveComments: true,
    });

    expect(result.output.indexOf('background: blue')).toBeLessThan(result.output.indexOf('color: red'));
    expect(result.output.indexOf('color: red')).toBeLessThan(result.output.indexOf('z-index: 1'));
  });

  it('returns validation errors for malformed css', () => {
    const result = formatCss('.card { color: red;', {
      mode: 'expanded',
      indentation: '2-spaces',
      sortDeclarations: false,
      preserveComments: true,
    });

    expect(result.error).toBe('Missing closing brace.');
    expect(result.output).toBe('');
  });
});
