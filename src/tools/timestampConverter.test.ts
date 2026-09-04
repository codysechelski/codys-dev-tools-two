import { describe, expect, it } from 'vitest';
import {
  createDateFromParts,
  detectTimestampFormat,
  formatIcalendarDateTime,
  getDateParts,
  getParseFormatLabel,
  getTimestampOutputs,
  parseTimestamp,
} from './timestampConverter';

describe('timestampConverter utilities', () => {
  it('detects common timestamp formats', () => {
    expect(detectTimestampFormat('1788192919')).toBe('unix-seconds');
    expect(detectTimestampFormat('1788192919140')).toBe('unix-milliseconds');
    expect(detectTimestampFormat('2026-08-31T18:47:59.140Z')).toBe('iso-8601');
    expect(detectTimestampFormat('20260831T184759')).toBe('rfc-5545');
    expect(detectTimestampFormat('20260831T184759Z')).toBe('rfc-5545');
  });

  it('parses unix seconds, milliseconds, ISO, and RFC 5545 dates', () => {
    expect(parseTimestamp('0', 'unix-seconds').date?.toISOString()).toBe('1970-01-01T00:00:00.000Z');
    expect(parseTimestamp('1000', 'unix-milliseconds').date?.toISOString()).toBe('1970-01-01T00:00:01.000Z');
    expect(parseTimestamp('1970-01-01T00:00:00.000Z', 'iso-8601').date?.getTime()).toBe(0);
    expect(parseTimestamp('19700101T000000Z', 'rfc-5545').date?.getTime()).toBe(0);
    expect(parseTimestamp('20260831T184759Z', 'rfc-5545').date?.toISOString()).toBe('2026-08-31T18:47:59.000Z');
  });

  it('rejects values that do not match the selected parse format', () => {
    expect(parseTimestamp('2026-09-04T16:30:45.123Z', 'unix-seconds').error).toBe('Invalid Unix seconds value.');
    expect(parseTimestamp('1757003445123', 'iso-8601').error).toBe('Invalid ISO 8601 value.');
    expect(parseTimestamp('Friday afternoon', 'iso-8601').error).toBe('Invalid ISO 8601 value.');
    expect(parseTimestamp('not-rfc-5545', 'rfc-5545').error).toBe('Invalid RFC 5545 (iCalendar) value.');
    expect(parseTimestamp('20261332T184759Z', 'rfc-5545').error).toBe('Invalid RFC 5545 (iCalendar) value.');
  });

  it('formats RFC 5545 (iCalendar) date-times for local and UTC zones', () => {
    const date = new Date('2026-08-31T18:47:59.000Z');

    expect(formatIcalendarDateTime(date, 'utc')).toBe('20260831T184759Z');
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
    expect(outputs.find((item) => item.label === 'RFC 5545 (iCalendar)')?.value).toBe('20241231T000000Z');
    expect(outputs.findIndex((item) => item.label === 'RFC 5545 (iCalendar)')).toBe(outputs.findIndex((item) => item.label === 'ISO 8601') + 1);
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
    expect(getParseFormatLabel('rfc-5545')).toBe('RFC 5545 (iCalendar)');
  });
});
