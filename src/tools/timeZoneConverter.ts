const MINUTE = 60_000;
const DAY = 1440 * MINUTE;
const formatters = new Map<string, Intl.DateTimeFormat>();

export const defaultZones = [
  { zone: 'UTC', label: 'UTC' },
  { zone: 'America/New_York', label: 'Eastern' },
  { zone: 'America/Chicago', label: 'Central' },
  { zone: 'America/Denver', label: 'Mountain' },
  { zone: 'America/Los_Angeles', label: 'Pacific' },
  { zone: 'America/Anchorage', label: 'Alaska' },
  { zone: 'Pacific/Honolulu', label: 'Hawaii' },
];

export function canonicalZone(zone: string): string {
  return new Intl.DateTimeFormat('en', { timeZone: zone }).resolvedOptions().timeZone;
}

export function getZoneOptions(localZone: string): Array<{ label: string; value: string }> {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
  const zones = [localZone, ...defaultZones.map(({ zone }) => zone), ...(intl.supportedValuesOf?.('timeZone') ?? [])];
  return [...new Set(zones.map(canonicalZone))].sort().map((zone) => ({ label: zone.replaceAll('_', ' '), value: zone }));
}

export function composeZones(localZone: string, added: string[] = []) {
  const seen = new Set<string>();
  return [
    { zone: localZone, label: localZone.replaceAll('_', ' '), current: true, removable: false },
    ...defaultZones.map((item) => ({ ...item, current: false, removable: false })),
    ...added.map((zone) => ({ zone, label: zone.replaceAll('_', ' '), current: false, removable: true })),
  ].filter(({ zone }) => {
    const key = canonicalZone(zone);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function parseTime(input: string): number | null {
  const match = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i.exec(input.trim());
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (minute > 59 || (match[3] ? hour < 1 || hour > 12 : hour > 23)) return null;
  if (match[3]) hour = (hour % 12) + (match[3].toLowerCase() === 'pm' ? 12 : 0);
  return hour * 60 + minute;
}

export function formatTime(minutes: number): string {
  return `${Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
}

function parseDate(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number(date.slice(0, 4)) < 100) return null;
  const value = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(value) && new Date(value).toISOString().slice(0, 10) === date ? value : null;
}

export function zonedParts(instant: number, zone: string): { date: string; minutes: number } {
  let formatter = formatters.get(zone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    formatters.set(zone, formatter);
  }
  const parts = Object.fromEntries(formatter.formatToParts(instant).map(({ type, value }) => [type, value]));
  return { date: `${parts.year!.padStart(4, '0')}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

function wallValue(instant: number, zone: string): number {
  const parts = zonedParts(instant, zone);
  return Date.parse(`${parts.date}T00:00:00Z`) + parts.minutes * MINUTE;
}

// Probe both sides of a transition, then round-trip candidates. Gaps are rejected;
// overlaps deliberately choose the earlier occurrence rather than depending on host TZ.
export function resolveWallTime(date: string, input: string, zone: string): { instant: number | null; error: string; ambiguous: boolean } {
  const day = parseDate(date);
  const minutes = parseTime(input);
  if (day === null) return { instant: null, error: 'Enter a valid date as YYYY-MM-DD (year 0100–9999).', ambiguous: false };
  if (minutes === null) return { instant: null, error: 'Enter a time as HH:mm (24-hour) or h:mm AM/PM.', ambiguous: false };
  const wall = day + minutes * MINUTE;
  const offsets = new Set(
    [-2, -1, 0, 1, 2].map((days) => {
      const probe = wall + days * DAY;
      return wallValue(probe, zone) - probe;
    }),
  );
  const matches = [...offsets]
    .map((offset) => wall - offset)
    .filter((candidate) => wallValue(candidate, zone) === wall)
    .sort((a, b) => a - b);
  return {
    instant: matches[0] ?? null,
    error: matches.length ? '' : 'This local time does not exist because the clocks move forward. Choose another time.',
    ambiguous: matches.length > 1,
  };
}

export function stepWallTime(date: string, input: string, direction: -1 | 1): { date: string; time: string } | null {
  const day = parseDate(date);
  const minutes = parseTime(input);
  if (day === null || minutes === null) return null;
  const next = new Date(day + (minutes + direction * 15) * MINUTE);
  const nextDate = next.toISOString().slice(0, 10);
  if (parseDate(nextDate) === null) return null;
  return { date: nextDate, time: formatTime(next.getUTCHours() * 60 + next.getUTCMinutes()) };
}

export function zoneDisplay(instant: number, zone: string, referenceDate: string) {
  const parts = zonedParts(instant, zone);
  const difference = Math.round((Date.parse(`${parts.date}T00:00:00Z`) - Date.parse(`${referenceDate}T00:00:00Z`)) / DAY);
  return {
    ...parts,
    time: formatTime(parts.minutes),
    dayLabel: difference === 0 ? 'Same day' : `${Math.abs(difference)} day${Math.abs(difference) === 1 ? '' : 's'} ${difference > 0 ? 'ahead' : 'behind'}`,
    abbreviation:
      new Intl.DateTimeFormat('en', { timeZone: zone, timeZoneName: 'short' }).formatToParts(instant).find(({ type }) => type === 'timeZoneName')?.value ??
      zone,
  };
}

export function zoneTimeline(instant: number, zone: string) {
  const start = instant - DAY / 2;
  const ticks = Array.from({ length: 8 }, (_, index) => {
    const position = (index + 0.5) / 8;
    return { position, time: formatTime(zonedParts(start + position * DAY, zone).minutes) };
  });
  // Find calendar-day changes, not fixed offsets: DST can even skip midnight.
  // Hourly probes plus a minute-level binary search keep edits responsive.
  const boundaries: Array<{ position: number; date: string }> = [];
  let previousDate = zonedParts(start, zone).date;
  for (let minute = 60; minute <= 1440; minute += 60) {
    const date = zonedParts(start + minute * MINUTE, zone).date;
    if (date !== previousDate) {
      let low = minute - 60;
      let high = minute;
      while (high - low > 1) {
        const middle = Math.floor((low + high) / 2);
        if (zonedParts(start + middle * MINUTE, zone).date === previousDate) low = middle;
        else high = middle;
      }
      boundaries.push({ position: high / 1440, date });
    }
    previousDate = date;
  }
  return { ticks, boundaries };
}
