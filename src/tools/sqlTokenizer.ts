export type SqlTokenType = 'comment' | 'string' | 'quoted' | 'number' | 'bind' | 'word' | 'punct' | 'op';

export interface SqlToken {
  type: SqlTokenType;
  text: string;
}

const MULTI_CHAR_OPERATORS = ['<=', '>=', '<>', '!=', '||'];

export interface SqlTokenizeError {
  message: string;
}

export interface SqlTokenizeResult {
  tokens: SqlToken[];
  error: string | null;
}

/**
 * A lenient lexer for SQL/SOQL source, used to reformat (not to validate) queries. It recognizes
 * enough structure (strings, comments, dotted identifiers, bind variables) to round-trip real
 * SOQL, but does not build a full grammar/AST.
 */
export function tokenizeSql(input: string): SqlTokenizeResult {
  const tokens: SqlToken[] = [];
  const length = input.length;
  let i = 0;

  while (i < length) {
    const char = input[i];

    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      i += 1;
      continue;
    }

    if (char === '-' && input[i + 1] === '-') {
      const start = i;
      while (i < length && input[i] !== '\n') i += 1;
      tokens.push({ type: 'comment', text: input.slice(start, i) });
      continue;
    }

    if (char === '/' && input[i + 1] === '*') {
      const start = i;
      i += 2;
      while (i < length && !(input[i] === '*' && input[i + 1] === '/')) i += 1;
      if (i >= length) return { tokens, error: 'Unterminated block comment.' };
      i += 2;
      tokens.push({ type: 'comment', text: input.slice(start, i) });
      continue;
    }

    if (char === "'") {
      const start = i;
      i += 1;
      while (i < length) {
        if (input[i] === '\\') {
          i += 2;
          continue;
        }
        if (input[i] === "'") {
          if (input[i + 1] === "'") {
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        i += 1;
      }
      if (i > length || input[start] !== "'" || input[i - 1] !== "'" || i === start + 1) {
        return { tokens, error: 'Unterminated string literal.' };
      }
      tokens.push({ type: 'string', text: input.slice(start, i) });
      continue;
    }

    if (char === '"') {
      const start = i;
      i += 1;
      while (i < length && input[i] !== '"') {
        if (input[i] === '\\') i += 1;
        i += 1;
      }
      if (i >= length) return { tokens, error: 'Unterminated quoted identifier.' };
      i += 1;
      tokens.push({ type: 'quoted', text: input.slice(start, i) });
      continue;
    }

    if (/[0-9]/.test(char)) {
      const start = i;
      while (i < length && /[0-9]/.test(input[i])) i += 1;
      if (input[i] === '.' && /[0-9]/.test(input[i + 1])) {
        i += 1;
        while (i < length && /[0-9]/.test(input[i])) i += 1;
      }
      tokens.push({ type: 'number', text: input.slice(start, i) });
      continue;
    }

    if (char === ':' && /[A-Za-z_]/.test(input[i + 1] ?? '')) {
      const start = i;
      i += 1;
      while (i < length && /[\w]/.test(input[i])) i += 1;
      tokens.push({ type: 'bind', text: input.slice(start, i) });
      continue;
    }

    if (/[A-Za-z_$]/.test(char)) {
      const start = i;
      i += 1;
      while (i < length && /[\w$]/.test(input[i])) i += 1;
      while (input[i] === '.' && /[A-Za-z_$]/.test(input[i + 1] ?? '')) {
        i += 1;
        while (i < length && /[\w$]/.test(input[i])) i += 1;
      }
      tokens.push({ type: 'word', text: input.slice(start, i) });
      continue;
    }

    if ('(),;'.includes(char)) {
      tokens.push({ type: 'punct', text: char });
      i += 1;
      continue;
    }

    const multiChar = MULTI_CHAR_OPERATORS.find((op) => input.startsWith(op, i));
    if (multiChar) {
      tokens.push({ type: 'op', text: multiChar });
      i += multiChar.length;
      continue;
    }

    if ('=<>+-*/.'.includes(char)) {
      tokens.push({ type: 'op', text: char });
      i += 1;
      continue;
    }

    return { tokens, error: `Unexpected character "${char}".` };
  }

  return { tokens, error: null };
}
