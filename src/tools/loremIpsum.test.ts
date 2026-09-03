import { describe, expect, it } from 'vitest';
import { generateLoremIpsum, stripHtml } from './loremIpsum';

const baseOptions = {
  unitCount: 2,
  unit: 'paragraphs' as const,
  sentenceCountMode: 'exactly' as const,
  sentenceCount: 2,
  wordCountMode: 'exactly' as const,
  wordCount: 6,
  termWordCountMode: 'exactly' as const,
  termWordCount: 2,
  varyEndingPunctuation: false,
  varySentencePunctuation: false,
  includeCommonHtmlTags: false,
  random: () => 0.2,
};

describe('generateLoremIpsum', () => {
  it('generates paragraph markup', () => {
    const output = generateLoremIpsum(baseOptions);

    expect(output).toContain('<p>');
    expect(output.match(/<p>/g)).toHaveLength(2);
    expect(output).toContain('.');
  });

  it('generates exact words without wrapping markup', () => {
    const output = generateLoremIpsum({ ...baseOptions, unitCount: 5, unit: 'words' });

    expect(output.split(' ')).toHaveLength(5);
    expect(output).not.toContain('<p>');
  });

  it('generates definition list items with terms and definitions', () => {
    const output = generateLoremIpsum({ ...baseOptions, unit: 'definition-list-items' });

    expect(output).toContain('<dl>');
    expect(output.match(/<dt>/g)).toHaveLength(2);
    expect(output.match(/<dd>/g)).toHaveLength(2);
  });

  it('can include varied punctuation and common html tags', () => {
    let index = 0;
    const rolls = [0.03, 0.04, 0.02, 0.03, 0.04, 0.02, 0.03, 0.04, 0.02, 0.03, 0.04, 0.02];
    const output = generateLoremIpsum({
      ...baseOptions,
      unitCount: 1,
      sentenceCount: 1,
      wordCount: 10,
      varyEndingPunctuation: true,
      varySentencePunctuation: true,
      includeCommonHtmlTags: true,
      random: () => rolls[index++ % rolls.length] ?? 0.2,
    });

    expect(output).toMatch(/[?!]/);
    expect(output).toMatch(/<em>|<strong>|<a href="#">/);
    expect(output).toMatch(/[,;:]/);
  });
});

describe('stripHtml', () => {
  it('returns readable text from generated markup', () => {
    expect(stripHtml('<p>Hello <strong>world</strong>.</p>')).toBe('Hello world.');
  });
});
