import { describe, expect, it } from 'vitest';
import { createDateFromParts, detectTimestampFormat, getDateParts, getParseFormatLabel, getTimestampOutputs, parseTimestamp } from './timestampConverter';

describe('timestampConverter utilities', () => {
  it('detects common timestamp formats', () => {
    expect(detectTimestampFormat('1788192919')).toBe('unix-seconds');
    expect(detectTimestampFormat('1788192919140')).toBe('unix-milliseconds');
    expect(detectTimestampFormat('2026-08-31T18:47:59.140Z')).toBe('iso-8601');
  });

  it('parses unix seconds, milliseconds, and ISO dates', () => {
    expect(parseTimestamp('0', 'unix-seconds').date?.toISOString()).toBe('1970-01-01T00:00:00.000Z');
    expect(parseTimestamp('1000', 'unix-milliseconds').date?.toISOString()).toBe('1970-01-01T00:00:01.000Z');
    expect(parseTimestamp('1970-01-01T00:00:00.000Z', 'iso-8601').date?.getTime()).toBe(0);
  });

  it('builds UTC dates from date parts', () => {
    const date = createDateFromParts({ year: 2026, month: 8, day: 31, hour: 18, minute: 47, second: 59, millisecond: 140 }, 'utc');

    expect(date.toISOString()).toBe('2026-08-31T18:47:59.140Z');
  });

  it('rolls invalid calendar parts so callers can validate normalized fields', () => {
    const date = createDateFromParts({ year: 2025, month: 2, day: 31, hour: 0, minute: 0, second: 0, millisecond: 0 }, 'utc');

    expect(getDateParts(date, 'utc').month).toBe(3);
  });

  it('returns copyable timestamp outputs and calendar facts', () => {
    const date = new Date('2024-12-31T00:00:00.000Z');
    const outputs = getTimestampOutputs(date, 'utc', new Date('2025-01-01T00:00:00.000Z'));

    expect(outputs.find((item) => item.label === 'Unix time')?.value).toBe('1735603200');
    expect(outputs.find((item) => item.label === 'Day of week')?.value).toBe('Tuesday');
    expect(outputs.find((item) => item.label === 'Day of year')?.value).toBe('366');
    expect(outputs.find((item) => item.label === 'Leap year')?.value).toBe('true');
    expect(outputs.find((item) => item.label === 'Calendar quarter')?.value).toBe('Q4');
  });

  it('gets date parts in UTC', () => {
    expect(getDateParts(new Date('2026-08-31T18:47:59.140Z'), 'utc')).toEqual({
      year: 2026,
      month: 8,
      day: 31,
      hour: 18,
      minute: 47,
      second: 59,
      millisecond: 140,
    });
  });

  it('formats parse labels', () => {
    expect(getParseFormatLabel('unix-milliseconds')).toBe('Unix milliseconds');
  });
});
