export type TimestampMode = 'build' | 'picker' | 'parse';
export type TimestampDisplayZone = 'local' | 'utc';
export type TimestampParseFormat = 'auto' | 'unix-seconds' | 'unix-milliseconds' | 'iso-8601';

export interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

export interface TimestampParseResult {
  date: Date | null;
  detectedFormat: TimestampParseFormat;
  error: string;
}

export interface TimestampOutput {
  label: string;
  value: string;
}

export function createDateFromParts(parts: DateParts, zone: TimestampDisplayZone): Date {
  if (zone === 'utc') {
    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, parts.millisecond));
  }

  return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, parts.millisecond);
}

export function parseTimestamp(input: string, format: TimestampParseFormat): TimestampParseResult {
  const value = input.trim();
  if (!value) return { date: null, detectedFormat: 'auto', error: 'Enter a timestamp or ISO 8601 date.' };

  const detectedFormat = format === 'auto' ? detectTimestampFormat(value) : format;
  if (!detectedFormat || detectedFormat === 'auto') {
    return { date: null, detectedFormat: 'auto', error: 'Unable to detect timestamp format.' };
  }

  const date = parseWithFormat(value, detectedFormat);
  if (!date || Number.isNaN(date.getTime())) {
    return { date: null, detectedFormat, error: `Invalid ${getParseFormatLabel(detectedFormat)} value.` };
  }

  return { date, detectedFormat, error: '' };
}

export function detectTimestampFormat(value: string): TimestampParseFormat | undefined {
  if (/^-?\d{13}$/.test(value)) return 'unix-milliseconds';
  if (/^-?\d{10}$/.test(value)) return 'unix-seconds';
  if (/^-?\d{1,9}$/.test(value)) return 'unix-seconds';
  if (/^-?\d{11,}$/.test(value)) return 'unix-milliseconds';
  if (!Number.isNaN(Date.parse(value))) return 'iso-8601';

  return undefined;
}

export function getTimestampOutputs(date: Date, zone: TimestampDisplayZone, now = new Date()): TimestampOutput[] {
  const milliseconds = date.getTime();
  const seconds = Math.floor(milliseconds / 1000);

  return [
    { label: 'Unix time', value: seconds.toString() },
    { label: 'Milliseconds since epoch', value: milliseconds.toString() },
    { label: 'ISO 8601', value: date.toISOString() },
    { label: 'RFC 2822 / HTTP date', value: date.toUTCString() },
    { label: `${zone === 'utc' ? 'UTC' : 'Local'} date & time`, value: formatDateTime(date, zone, { dateStyle: 'full', timeStyle: 'long' }) },
    { label: 'Date only', value: formatDateTime(date, zone, { dateStyle: 'medium' }) },
    { label: 'Time only', value: formatDateTime(date, zone, { timeStyle: 'medium' }) },
    { label: 'Relative', value: formatRelative(date, now) },
    { label: 'Day of week', value: formatDateTime(date, zone, { weekday: 'long' }) },
    { label: 'Day of year', value: getDayOfYear(date, zone).toString() },
    { label: 'Week of year', value: getIsoWeek(date, zone).toString() },
    { label: 'Calendar quarter', value: getCalendarQuarter(date, zone) },
    { label: 'Leap year', value: String(isLeapYear(getYear(date, zone))) },
    { label: 'Timezone offset', value: zone === 'utc' ? '+00:00' : formatTimezoneOffset(date) },
  ];
}

export function getParseFormatLabel(format: TimestampParseFormat): string {
  if (format === 'unix-seconds') return 'Unix seconds';
  if (format === 'unix-milliseconds') return 'Unix milliseconds';
  if (format === 'iso-8601') return 'ISO 8601';
  return 'Auto';
}

export function getDateParts(date: Date, zone: TimestampDisplayZone): DateParts {
  return {
    year: zone === 'utc' ? date.getUTCFullYear() : date.getFullYear(),
    month: (zone === 'utc' ? date.getUTCMonth() : date.getMonth()) + 1,
    day: zone === 'utc' ? date.getUTCDate() : date.getDate(),
    hour: zone === 'utc' ? date.getUTCHours() : date.getHours(),
    minute: zone === 'utc' ? date.getUTCMinutes() : date.getMinutes(),
    second: zone === 'utc' ? date.getUTCSeconds() : date.getSeconds(),
    millisecond: zone === 'utc' ? date.getUTCMilliseconds() : date.getMilliseconds(),
  };
}

function parseWithFormat(value: string, format: Exclude<TimestampParseFormat, 'auto'>): Date | null {
  if (format === 'unix-seconds') return new Date(Number(value) * 1000);
  if (format === 'unix-milliseconds') return new Date(Number(value));

  return new Date(value);
}

function formatDateTime(date: Date, zone: TimestampDisplayZone, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(undefined, {
    ...options,
    timeZone: zone === 'utc' ? 'UTC' : undefined,
  }).format(date);
}

function formatRelative(date: Date, now: Date): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const absoluteSeconds = Math.abs(seconds);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
    ['second', 1],
  ];
  const [unit, divisor] = units.find(([, unitSeconds]) => absoluteSeconds >= unitSeconds) ?? ['second', 1];

  return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(Math.round(seconds / divisor), unit);
}

function getDayOfYear(date: Date, zone: TimestampDisplayZone): number {
  const year = getYear(date, zone);
  const start = zone === 'utc' ? Date.UTC(year, 0, 1) : new Date(year, 0, 1).getTime();
  const current = zone === 'utc' ? Date.UTC(year, date.getUTCMonth(), date.getUTCDate()) : new Date(year, date.getMonth(), date.getDate()).getTime();

  return Math.floor((current - start) / 86_400_000) + 1;
}

function getIsoWeek(date: Date, zone: TimestampDisplayZone): number {
  const parts = getDateParts(date, zone);
  const normalized = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const day = normalized.getUTCDay() || 7;
  normalized.setUTCDate(normalized.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(normalized.getUTCFullYear(), 0, 1));

  return Math.ceil(((normalized.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

function getCalendarQuarter(date: Date, zone: TimestampDisplayZone): string {
  const month = getDateParts(date, zone).month;
  return `Q${Math.ceil(month / 3)}`;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function getYear(date: Date, zone: TimestampDisplayZone): number {
  return zone === 'utc' ? date.getUTCFullYear() : date.getFullYear();
}

function formatTimezoneOffset(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = Math.floor(Math.abs(offset) / 60).toString().padStart(2, '0');
  const minutes = (Math.abs(offset) % 60).toString().padStart(2, '0');

  return `${sign}${hours}:${minutes}`;
}
