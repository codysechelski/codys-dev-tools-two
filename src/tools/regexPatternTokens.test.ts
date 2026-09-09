import { describe, expect, it } from 'vitest';
import { tokenizeRegexPattern } from './regexPatternTokens';

describe('tokenizeRegexPattern', () => {
  it('returns no tokens for an empty pattern', () => {
    expect(tokenizeRegexPattern('')).toEqual([]);
  });

  it('classifies escape sequences', () => {
    expect(tokenizeRegexPattern('\\d')).toEqual([{ from: 0, to: 2, type: 'escape' }]);
  });

  it('classifies a character class as a single token, including escaped brackets inside it', () => {
    expect(tokenizeRegexPattern('[\\]abc]')).toEqual([{ from: 0, to: 7, type: 'charClass' }]);
  });

  it('classifies a negated character class', () => {
    expect(tokenizeRegexPattern('[^abc]')).toEqual([{ from: 0, to: 6, type: 'charClass' }]);
  });

  it('classifies a plain capturing group as separate open/close tokens', () => {
    const tokens = tokenizeRegexPattern('(a)');

    expect(tokens).toEqual([
      { from: 0, to: 1, type: 'group' },
      { from: 1, to: 2, type: 'literal' },
      { from: 2, to: 3, type: 'group' },
    ]);
  });

  it('classifies a non-capturing group opener as a single token', () => {
    const tokens = tokenizeRegexPattern('(?:a)');

    expect(tokens[0]).toEqual({ from: 0, to: 3, type: 'group' });
  });

  it('classifies a named capturing group opener as a single token', () => {
    const tokens = tokenizeRegexPattern('(?<year>a)');

    expect(tokens[0]).toEqual({ from: 0, to: 8, type: 'group' });
  });

  it('classifies lookahead and lookbehind openers', () => {
    expect(tokenizeRegexPattern('(?=a)')[0]).toEqual({ from: 0, to: 3, type: 'group' });
    expect(tokenizeRegexPattern('(?!a)')[0]).toEqual({ from: 0, to: 3, type: 'group' });
    expect(tokenizeRegexPattern('(?<=a)')[0]).toEqual({ from: 0, to: 4, type: 'group' });
    expect(tokenizeRegexPattern('(?<!a)')[0]).toEqual({ from: 0, to: 4, type: 'group' });
  });

  it('classifies anchors', () => {
    expect(tokenizeRegexPattern('^a$')).toEqual([
      { from: 0, to: 1, type: 'anchor' },
      { from: 1, to: 2, type: 'literal' },
      { from: 2, to: 3, type: 'anchor' },
    ]);
  });

  it('classifies quantifiers, including lazy and brace forms', () => {
    expect(tokenizeRegexPattern('a*')[1]).toEqual({ from: 1, to: 2, type: 'quantifier' });
    expect(tokenizeRegexPattern('a+?')[1]).toEqual({ from: 1, to: 3, type: 'quantifier' });
    expect(tokenizeRegexPattern('a{2,4}')[1]).toEqual({ from: 1, to: 6, type: 'quantifier' });
    expect(tokenizeRegexPattern('a{2,4}?')[1]).toEqual({ from: 1, to: 7, type: 'quantifier' });
  });

  it('treats a brace that is not a valid quantifier as literal characters', () => {
    expect(tokenizeRegexPattern('a{b}').map((token) => token.type)).toEqual(['literal', 'literal', 'literal', 'literal']);
  });

  it('classifies alternation and the dot metacharacter', () => {
    expect(tokenizeRegexPattern('a|.')).toEqual([
      { from: 0, to: 1, type: 'literal' },
      { from: 1, to: 2, type: 'alternation' },
      { from: 2, to: 3, type: 'dot' },
    ]);
  });
});
