import { describe, expect, it } from 'vitest';
import { tokenizeSql } from './sqlTokenizer';

function types(input: string): string[] {
  return tokenizeSql(input).tokens.map((t) => t.type);
}

function texts(input: string): string[] {
  return tokenizeSql(input).tokens.map((t) => t.text);
}

describe('tokenizeSql', () => {
  it('tokenizes a simple select statement', () => {
    const result = tokenizeSql('SELECT Id, Name FROM Account WHERE Age > 18');

    expect(result.error).toBeNull();
    expect(result.tokens.map((t) => t.text)).toEqual([
      'SELECT',
      'Id',
      ',',
      'Name',
      'FROM',
      'Account',
      'WHERE',
      'Age',
      '>',
      '18',
    ]);
  });

  it('keeps dotted relationship paths as a single word token', () => {
    expect(texts('Account.Owner.Name')).toEqual(['Account.Owner.Name']);
  });

  it('tokenizes single-quoted strings, including escaped quotes', () => {
    expect(texts("WHERE Name = 'O''Brien'")).toEqual(['WHERE', 'Name', '=', "'O''Brien'"]);
    expect(types("'hello'")).toEqual(['string']);
  });

  it('tokenizes double-quoted identifiers', () => {
    expect(types('"my column"')).toEqual(['quoted']);
  });

  it('tokenizes bind variables', () => {
    expect(texts('WHERE Id = :accountId')).toEqual(['WHERE', 'Id', '=', ':accountId']);
    expect(types(':accountId')).toEqual(['bind']);
  });

  it('tokenizes integers and decimals', () => {
    expect(texts('LIMIT 10')).toEqual(['LIMIT', '10']);
    expect(texts('WHERE Amount > 9.5')).toEqual(['WHERE', 'Amount', '>', '9.5']);
  });

  it('tokenizes line comments up to the end of the line', () => {
    const result = tokenizeSql('SELECT Id -- get the id\nFROM Account');

    expect(result.tokens.map((t) => t.text)).toEqual(['SELECT', 'Id', '-- get the id', 'FROM', 'Account']);
  });

  it('tokenizes block comments', () => {
    const result = tokenizeSql('SELECT /* all fields */ Id FROM Account');

    expect(result.tokens.map((t) => t.text)).toEqual(['SELECT', '/* all fields */', 'Id', 'FROM', 'Account']);
  });

  it('tokenizes multi-character operators without splitting them', () => {
    expect(texts('WHERE a <= b')).toEqual(['WHERE', 'a', '<=', 'b']);
    expect(texts('WHERE a <> b')).toEqual(['WHERE', 'a', '<>', 'b']);
    expect(texts('WHERE a != b')).toEqual(['WHERE', 'a', '!=', 'b']);
  });

  it('tokenizes parentheses, commas, and semicolons as punctuation', () => {
    expect(types('(a, b);')).toEqual(['punct', 'word', 'punct', 'word', 'punct', 'punct']);
  });

  it('reports an error for an unterminated string', () => {
    const result = tokenizeSql("SELECT * FROM a WHERE Name = 'oops");

    expect(result.error).toBe('Unterminated string literal.');
  });

  it('reports an error for an unterminated block comment', () => {
    const result = tokenizeSql('SELECT 1 /* oops');

    expect(result.error).toBe('Unterminated block comment.');
  });

  it('reports an error for an unterminated quoted identifier', () => {
    const result = tokenizeSql('SELECT "oops FROM a');

    expect(result.error).toBe('Unterminated quoted identifier.');
  });
});
