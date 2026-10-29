import { describe, expect, it } from 'vitest';
import {
  canonicalZone,
  composeZones,
  formatTime,
  getZoneOptions,
  parseTime,
  resolveWallTime,
  stepWallTime,
  zoneDisplay,
  zoneTimeline,
} from './timeZoneConverter';

describe('time zone converter', () => {
  it.each([
    ['0:00', 0],
    ['23:59', 1439],
    ['9:05 am', 545],
    ['12:00 AM', 0],
    ['12:00 pm', 720],
    ['1:30 PM', 810],
    ['24:00', null],
    ['12:60', null],
    ['0:30 pm', null],
    ['13:00 AM', null],
    ['9:5', null],
    ['', null],
    ['noon', null],
  ])('parses %s strictly', (input, expected) => {
    expect(parseTime(input)).toBe(expected);
  });

  it('formats 24-hour times', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(545)).toBe('09:05');
    expect(formatTime(1439)).toBe('23:59');
  });

  it('steps 15 minutes across date, month, year, and leap-day boundaries', () => {
    expect(stepWallTime('2026-12-31', '23:55', 1)).toEqual({ date: '2027-01-01', time: '00:10' });
    expect(stepWallTime('2024-03-01', '00:00', -1)).toEqual({ date: '2024-02-29', time: '23:45' });
    expect(stepWallTime('2026-01-01', '9:00 AM', 1)).toEqual({ date: '2026-01-01', time: '09:15' });
    expect(stepWallTime('2026-02-30', '12:00', 1)).toBeNull();
    expect(stepWallTime('2026-01-01', 'bad', 1)).toBeNull();
    expect(stepWallTime('9999-12-31', '23:59', 1)).toBeNull();
  });

  it('places the own zone first and deduplicates default, added, and alias zones', () => {
    const rows = composeZones('America/Chicago', ['Asia/Kathmandu', 'US/Central', 'Asia/Katmandu']);
    expect(rows.map(({ label }) => label).slice(0, 8)).toEqual([
      'America/Chicago',
      'UTC',
      'Eastern',
      'Mountain',
      'Pacific',
      'Alaska',
      'Hawaii',
      'Asia/Kathmandu',
    ]);
    expect(rows[0]).toMatchObject({ current: true, removable: false });
    expect(rows.at(-1)).toMatchObject({ current: false, removable: true });
    expect(composeZones('Etc/UTC').filter(({ zone }) => canonicalZone(zone) === 'UTC')).toHaveLength(1);
    expect(getZoneOptions('UTC').some(({ value }) => value === canonicalZone('Asia/Kathmandu'))).toBe(true);
  });

  it('keeps wall time when reinterpreted in a different zone', () => {
    const eastern = resolveWallTime('2026-07-01', '09:00', 'America/New_York');
    const pacific = resolveWallTime('2026-07-01', '09:00', 'America/Los_Angeles');
    expect(pacific.instant! - eastern.instant!).toBe(3 * 3600_000);
    expect(zoneDisplay(pacific.instant!, 'America/Los_Angeles', '2026-07-01').time).toBe('09:00');
  });

  it('honors DST, rejects gaps, and identifies earlier repeated times', () => {
    expect(resolveWallTime('2026-01-01', '09:00', 'America/New_York').instant).toBe(Date.parse('2026-01-01T14:00Z'));
    expect(resolveWallTime('2026-07-01', '09:00', 'America/New_York').instant).toBe(Date.parse('2026-07-01T13:00Z'));
    expect(resolveWallTime('2026-03-08', '02:30', 'America/New_York')).toMatchObject({ instant: null, error: expect.stringContaining('does not exist') });
    expect(resolveWallTime('2026-11-01', '01:30', 'America/New_York')).toMatchObject({ instant: Date.parse('2026-11-01T05:30Z'), ambiguous: true });
    expect(resolveWallTime('2026-02-30', '09:00', 'UTC').instant).toBeNull();
    expect(resolveWallTime('2026-01-01', 'bad', 'UTC').instant).toBeNull();
  });

  it('handles non-DST zones and half/quarter-hour offsets', () => {
    for (const date of ['2026-01-01', '2026-07-01']) {
      expect(resolveWallTime(date, '09:00', 'Pacific/Honolulu').instant).toBe(Date.parse(`${date}T19:00Z`));
      expect(resolveWallTime(date, '09:00', 'Asia/Kathmandu').instant).toBe(Date.parse(`${date}T03:15Z`));
    }
    expect(resolveWallTime('2026-07-01', '09:00', 'Asia/Kolkata').instant).toBe(Date.parse('2026-07-01T03:30Z'));
    expect(resolveWallTime('2026-10-04', '02:15', 'Australia/Lord_Howe').instant).toBeNull();
  });

  it('shows date differences and locates midnight at fractional offsets', () => {
    const instant = Date.parse('2026-07-01T01:00Z');
    expect(zoneDisplay(instant, 'America/Los_Angeles', '2026-07-01')).toMatchObject({ date: '2026-06-30', time: '18:00', dayLabel: '1 day behind' });
    expect(zoneDisplay(instant, 'Asia/Tokyo', '2026-06-30').dayLabel).toBe('1 day ahead');
    const timeline = zoneTimeline(Date.parse('2026-07-01T12:00Z'), 'Asia/Kathmandu');
    expect(timeline.ticks).toHaveLength(8);
    expect(timeline.boundaries).toEqual([{ position: 1095 / 1440, date: '2026-07-02' }]);
  });

  it('positions midnight correctly across short and long DST days', () => {
    const spring = zoneTimeline(Date.parse('2026-03-08T12:00Z'), 'America/New_York');
    expect(spring.boundaries).toContainEqual({ position: 5 / 24, date: '2026-03-08' });
    const fall = zoneTimeline(Date.parse('2026-11-01T12:00Z'), 'America/New_York');
    expect(fall.boundaries).toContainEqual({ position: 4 / 24, date: '2026-11-01' });
  });
});
