import { describe, expect, it } from 'vitest';
import { buildCronExpression, parseCronExpression } from './cronExpression';

describe('cronExpression utilities', () => {
  it('builds standard cron expressions from fields', () => {
    expect(buildCronExpression(['*/15', '9-17', '*', '*', 'mon-fri'])).toBe('*/15 9-17 * * mon-fri');
  });

  it('parses ranges, steps, lists, and names', () => {
    const result = parseCronExpression('*/15 9-17 * jan,mar mon-fri');

    expect(result.error).toBe('');
    expect(result.fields[0].values).toContain(45);
    expect(result.fields[3].values).toEqual([1, 3]);
    expect(result.fields[4].values).toEqual([1, 2, 3, 4, 5]);
  });

  it('reports invalid expressions', () => {
    expect(parseCronExpression('* * *').error).toContain('5 fields');
    expect(parseCronExpression('99 * * * *').error).toContain('Minute');
  });

  it('computes upcoming run times', () => {
    const result = parseCronExpression('0 9 * * mon', new Date('2026-08-31T08:58:00'));

    expect(result.nextRuns[0].getHours()).toBe(9);
    expect(result.nextRuns[0].getMinutes()).toBe(0);
    expect(result.nextRuns[0].getDay()).toBe(1);
  });
});
