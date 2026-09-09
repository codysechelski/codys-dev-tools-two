import { describe, expect, it } from 'vitest';
import { formatSql, type SqlFormatterOptions } from './sqlFormatter';

const expanded: SqlFormatterOptions = { mode: 'expanded', indentation: '2-spaces', keywordCase: 'upper', preserveComments: true };
const compact: SqlFormatterOptions = { ...expanded, mode: 'compact' };
const minified: SqlFormatterOptions = { ...expanded, mode: 'minified' };

describe('formatSql', () => {
  it('returns an empty result for empty input', () => {
    expect(formatSql('', expanded)).toEqual({ output: '', error: '' });
    expect(formatSql('   ', expanded)).toEqual({ output: '', error: '' });
  });

  it('formats a simple select in expanded mode, exploding SELECT columns but keeping FROM/WHERE bodies inline', () => {
    const result = formatSql('select id, name from account where age > 18', expanded);

    expect(result.error).toBe('');
    expect(result.output).toBe('SELECT\n  id,\n  name\nFROM account\nWHERE\n  age > 18');
  });

  it('does not add a trailing semicolon when the input has none', () => {
    const result = formatSql('select id from account', expanded);

    expect(result.output.endsWith(';')).toBe(false);
  });

  it('preserves a trailing semicolon when the input has one', () => {
    const result = formatSql('select id from account;', expanded);

    expect(result.output.endsWith(';')).toBe(true);
    expect(result.output.endsWith(';;')).toBe(false);
  });

  it('formats multiple semicolon-separated statements as separate blocks', () => {
    const result = formatSql('select id from a; select id from b', expanded);

    expect(result.output).toBe('SELECT\n  id\nFROM a;\n\nSELECT\n  id\nFROM b');
  });

  it('explodes WHERE conditions on top-level AND/OR with leading operators', () => {
    const result = formatSql("select id from account where age > 18 and status = 'Active' or vip = true", expanded);

    expect(result.output).toBe(
      "SELECT\n  id\nFROM account\nWHERE\n  age > 18\n  AND status = 'Active'\n  OR vip = TRUE",
    );
  });

  it('does not split AND/OR that are nested inside parentheses', () => {
    const result = formatSql('select id from a where (x = 1 and y = 2) or z = 3', expanded);

    expect(result.output).toBe('SELECT\n  id\nFROM a\nWHERE\n  (x = 1 AND y = 2)\n  OR z = 3');
  });

  it('keeps FROM, JOIN, GROUP BY, and ORDER BY clause bodies inline even in expanded mode', () => {
    const result = formatSql(
      'select a.id, count(b.id) from a inner join b on a.id = b.aid group by a.id order by a.id desc limit 10',
      expanded,
    );

    expect(result.output).toBe(
      'SELECT\n  a.id,\n  COUNT(b.id)\nFROM a\nINNER JOIN b ON a.id = b.aid\nGROUP BY a.id\nORDER BY a.id DESC\nLIMIT 10',
    );
  });

  it('renders a bare parenthesized SELECT column as a nested, re-indented subquery (SOQL child relationship)', () => {
    const result = formatSql('select id, name, (select id, lastname from contacts) from account', expanded);

    expect(result.output).toBe(
      'SELECT\n  id,\n  name,\n  (\n    SELECT\n      id,\n      lastname\n    FROM contacts\n  )\nFROM account',
    );
  });

  it('keeps subqueries inline in compact mode', () => {
    const result = formatSql('select id, (select id from contacts) from account', compact);

    expect(result.output).toBe('SELECT id, (SELECT id FROM contacts)\nFROM account');
  });

  it('renders compact mode as one line per clause with inline bodies', () => {
    const result = formatSql("select id, name from account where age > 18 and status = 'Active'", compact);

    expect(result.output).toBe("SELECT id, name\nFROM account\nWHERE age > 18 AND status = 'Active'");
  });

  it('renders minified mode as a single line', () => {
    const result = formatSql("select id, name from account where age > 18 and status = 'Active'", minified);

    expect(result.output).toBe("SELECT id, name FROM account WHERE age > 18 AND status = 'Active'");
  });

  it('does not put a space before a function call paren, but does before a keyword paren', () => {
    const result = formatSql('select count(id) from a where id in (1, 2, 3)', minified);

    expect(result.output).toBe('SELECT COUNT(id) FROM a WHERE id IN (1, 2, 3)');
  });

  it('renders unary minus tightly but binary minus with spaces', () => {
    const result = formatSql('select -amount from a where balance = price - discount', minified);

    expect(result.output).toBe('SELECT -amount FROM a WHERE balance = price - discount');
  });

  it('applies uppercase keyword case only to recognized keywords, never to identifiers', () => {
    const result = formatSql('select Id, accountName from Account', { ...minified, keywordCase: 'upper' });

    expect(result.output).toBe('SELECT Id, accountName FROM Account');
  });

  it('applies lowercase keyword case', () => {
    const result = formatSql('SELECT Id FROM Account WHERE Id = :accId', { ...minified, keywordCase: 'lower' });

    expect(result.output).toBe('select Id FROM Account'.replace('FROM Account', 'from Account') + ' where Id = :accId');
  });

  it('preserves keyword case as-is when set to preserve', () => {
    const result = formatSql('Select Id from Account', { ...minified, keywordCase: 'preserve' });

    expect(result.output).toBe('Select Id from Account');
  });

  it('never case-transforms dotted relationship paths', () => {
    const result = formatSql('select Account.Owner.Name from Contact', { ...minified, keywordCase: 'lower' });

    expect(result.output).toBe('select Account.Owner.Name from Contact');
  });

  it('leaves single- and double-quoted content untouched by keyword casing', () => {
    const result = formatSql('select Id from Account where Name = \'select from where\'', { ...minified, keywordCase: 'upper' });

    expect(result.output).toBe("SELECT Id FROM Account WHERE Name = 'select from where'");
  });

  it('preserves bind variables verbatim', () => {
    const result = formatSql('select id from account where id = :accountId', minified);

    expect(result.output).toBe('SELECT id FROM account WHERE id = :accountId');
  });

  it('strips comments when preserveComments is false', () => {
    const result = formatSql('select id -- the id\nfrom account', { ...minified, preserveComments: false });

    expect(result.output).toBe('SELECT id FROM account');
  });

  it('converts line comments to block comments so they cannot swallow the rest of the line when reflowed', () => {
    const result = formatSql('select id -- the id\nfrom account', { ...minified, preserveComments: true });

    expect(result.output).toBe('SELECT id /* the id */ FROM account');
  });

  it('keeps block comments as-is', () => {
    const result = formatSql('select /* all */ id from account', { ...minified, preserveComments: true });

    expect(result.output).toBe('SELECT /* all */ id FROM account');
  });

  it('formats an UPDATE statement', () => {
    const result = formatSql("update account set name = 'Acme', active = true where id = 1", minified);

    expect(result.output).toBe("UPDATE account SET name = 'Acme', active = TRUE WHERE id = 1");
  });

  it('formats an INSERT INTO ... VALUES statement, keeping a space before the column-list paren', () => {
    const result = formatSql("insert into account (name, active) values ('Acme', true)", minified);

    expect(result.output).toBe("INSERT INTO account (name, active) VALUES ('Acme', TRUE)");
  });

  it('formats a DELETE FROM statement', () => {
    const result = formatSql('delete from account where id = 1', minified);

    expect(result.output).toBe('DELETE FROM account WHERE id = 1');
  });

  it('formats SOQL-specific clauses: WITH SECURITY_ENFORCED and FOR VIEW', () => {
    const result = formatSql('select id from account with security_enforced for view', minified);

    expect(result.output).toBe('SELECT id FROM account WITH SECURITY_ENFORCED FOR VIEW');
  });

  it('reports an error for unbalanced parentheses', () => {
    const result = formatSql('select id from account where (id = 1', expanded);

    expect(result.error).toBe('Missing closing parenthesis.');
    expect(result.output).toBe('');
  });

  it('reports an error for an unexpected closing parenthesis', () => {
    const result = formatSql('select id from account)', expanded);

    expect(result.error).toBe('Unexpected closing parenthesis.');
  });

  it('reports an error for an unterminated string literal', () => {
    const result = formatSql("select id from account where name = 'oops", expanded);

    expect(result.error).toBe('Unterminated string literal.');
  });

  it('formats a WHERE clause with an IN subquery inline (not exploded as a SELECT-column subquery)', () => {
    const result = formatSql('select id from account where id in (select accountid from contact where active = true)', expanded);

    expect(result.output).toBe(
      'SELECT\n  id\nFROM account\nWHERE\n  id IN (SELECT accountid FROM contact WHERE active = TRUE)',
    );
  });

  it('handles a nested (grandchild) subquery inside a SOQL child relationship subquery', () => {
    const result = formatSql(
      'select id, (select id, (select id from OpportunityLineItems) from Opportunities) from Account',
      expanded,
    );

    expect(result.output).toBe(
      [
        'SELECT',
        '  id,',
        '  (',
        '    SELECT',
        '      id,',
        '      (',
        '        SELECT',
        '          id',
        '        FROM OpportunityLineItems',
        '      )',
        '    FROM Opportunities',
        '  )',
        'FROM Account',
      ].join('\n'),
    );
  });

  it('round-trips a realistic SOQL query with relationship fields and security enforcement', () => {
    const input = "SELECT Id, Account.Name, (SELECT Id, LastName FROM Contacts) FROM Opportunity WHERE StageName = 'Closed Won' AND Amount > 1000 WITH SECURITY_ENFORCED ORDER BY CloseDate DESC LIMIT 50";
    const result = formatSql(input, expanded);

    expect(result.error).toBe('');
    expect(result.output).toBe(
      [
        'SELECT',
        '  Id,',
        '  Account.Name,',
        '  (',
        '    SELECT',
        '      Id,',
        '      LastName',
        '    FROM Contacts',
        '  )',
        'FROM Opportunity',
        'WHERE',
        "  StageName = 'Closed Won'",
        '  AND Amount > 1000',
        'WITH SECURITY_ENFORCED',
        'ORDER BY CloseDate DESC',
        'LIMIT 50',
      ].join('\n'),
    );
  });

  it('is idempotent: formatting already-formatted output again produces the same result', () => {
    const input = "SELECT Id, Name, (SELECT Id FROM Contacts) FROM Account WHERE Age > 18 AND Active = TRUE ORDER BY Name LIMIT 5";
    const first = formatSql(input, expanded);
    const second = formatSql(first.output, expanded);

    expect(second.output).toBe(first.output);
  });

  it('respects the chosen indentation style', () => {
    const fourSpace = formatSql('select id from account', { ...expanded, indentation: '4-spaces' });
    const tabs = formatSql('select id from account', { ...expanded, indentation: 'tabs' });

    expect(fourSpace.output).toBe('SELECT\n    id\nFROM account');
    expect(tabs.output).toBe('SELECT\n\tid\nFROM account');
  });
});
