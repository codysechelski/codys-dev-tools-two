export type RegexTokenType = 'group' | 'charClass' | 'anchor' | 'quantifier' | 'escape' | 'alternation' | 'dot' | 'literal';

export interface RegexToken {
  from: number;
  to: number;
  type: RegexTokenType;
}

export const REGEX_TOKEN_CLASS_NAMES: Record<RegexTokenType, string> = {
  group: 'cm-regex-tok-group',
  charClass: 'cm-regex-tok-char-class',
  anchor: 'cm-regex-tok-anchor',
  quantifier: 'cm-regex-tok-quantifier',
  escape: 'cm-regex-tok-escape',
  alternation: 'cm-regex-tok-alternation',
  dot: 'cm-regex-tok-dot',
  literal: '',
};

const QUANTIFIER_BRACE_PATTERN = /^\{\d+(,\d*)?\}\??/;

/**
 * Splits a regex source string into syntax-highlighting tokens. This is a lightweight lexer for
 * display purposes only — it does not validate the pattern (the RegExp constructor does that).
 */
export function tokenizeRegexPattern(pattern: string): RegexToken[] {
  const tokens: RegexToken[] = [];
  const length = pattern.length;
  let i = 0;

  while (i < length) {
    const char = pattern[i];

    if (char === '\\') {
      const start = i;
      i = Math.min(i + 2, length);
      tokens.push({ from: start, to: i, type: 'escape' });
      continue;
    }

    if (char === '[') {
      const start = i;
      i++;
      if (pattern[i] === '^') i++;
      while (i < length && pattern[i] !== ']') {
        i += pattern[i] === '\\' ? 2 : 1;
      }
      if (i < length) i++;
      tokens.push({ from: start, to: i, type: 'charClass' });
      continue;
    }

    if (char === '(') {
      const start = i;
      i++;
      if (pattern[i] === '?') {
        i++;
        if (pattern[i] === '<' && pattern[i + 1] !== '=' && pattern[i + 1] !== '!') {
          i++;
          while (i < length && pattern[i] !== '>') i++;
          if (i < length) i++;
        } else if (pattern[i] === '<') {
          i += 2;
        } else if (pattern[i] === ':' || pattern[i] === '=' || pattern[i] === '!') {
          i++;
        }
      }
      tokens.push({ from: start, to: i, type: 'group' });
      continue;
    }

    if (char === ')') {
      tokens.push({ from: i, to: i + 1, type: 'group' });
      i++;
      continue;
    }

    if (char === '^' || char === '$') {
      tokens.push({ from: i, to: i + 1, type: 'anchor' });
      i++;
      continue;
    }

    if (char === '*' || char === '+' || char === '?') {
      const start = i;
      i++;
      if (pattern[i] === '?') i++;
      tokens.push({ from: start, to: i, type: 'quantifier' });
      continue;
    }

    if (char === '{') {
      const match = QUANTIFIER_BRACE_PATTERN.exec(pattern.slice(i));
      if (match) {
        tokens.push({ from: i, to: i + match[0].length, type: 'quantifier' });
        i += match[0].length;
        continue;
      }
      tokens.push({ from: i, to: i + 1, type: 'literal' });
      i++;
      continue;
    }

    if (char === '|') {
      tokens.push({ from: i, to: i + 1, type: 'alternation' });
      i++;
      continue;
    }

    if (char === '.') {
      tokens.push({ from: i, to: i + 1, type: 'dot' });
      i++;
      continue;
    }

    tokens.push({ from: i, to: i + 1, type: 'literal' });
    i++;
  }

  return tokens;
}
