export interface CronFieldParseResult {
  label: string;
  value: string;
  description: string;
  values: number[];
  error: string;
}

export interface CronParseResult {
  expression: string;
  fields: CronFieldParseResult[];
  summary: string;
  nextRuns: Date[];
  error: string;
}

interface CronFieldConfig {
  label: string;
  min: number;
  max: number;
  names?: Record<string, number>;
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const WEEKDAY_NAMES: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const FIELD_CONFIGS: CronFieldConfig[] = [
  { label: 'Minute', min: 0, max: 59 },
  { label: 'Hour', min: 0, max: 23 },
  { label: 'Day of month', min: 1, max: 31 },
  { label: 'Month', min: 1, max: 12, names: MONTH_NAMES },
  { label: 'Day of week', min: 0, max: 7, names: WEEKDAY_NAMES },
];

export function buildCronExpression(fields: string[]): string {
  return fields.map((field) => field.trim() || '*').join(' ');
}

export function parseCronExpression(expression: string, from = new Date()): CronParseResult {
  const normalized = expression.trim().replace(/\s+/g, ' ');
  const parts = normalized ? normalized.split(' ') : [];

  if (parts.length !== 5) {
    return {
      expression: normalized,
      fields: [],
      summary: 'Enter a standard 5-field cron expression.',
      nextRuns: [],
      error: 'Cron expressions must have 5 fields: minute hour day month weekday.',
    };
  }

  const fields = parts.map((part, index) => parseCronField(part, FIELD_CONFIGS[index]));
  const fieldError = fields.find((field) => field.error)?.error ?? '';
  const nextRuns = fieldError ? [] : getNextRuns(fields, from);

  return {
    expression: normalized,
    fields,
    summary: fieldError ? 'Fix invalid fields to parse this schedule.' : describeSchedule(fields),
    nextRuns,
    error: fieldError,
  };
}

export function parseCronField(value: string, config: CronFieldConfig): CronFieldParseResult {
  const normalized = value.trim().toLowerCase();
  const values = new Set<number>();
  if (!normalized) return createFieldResult(config, value, [], 'Field cannot be empty.');

  for (const part of normalized.split(',')) {
    const error = addCronPartValues(part, config, values);
    if (error) return createFieldResult(config, value, [], `${config.label}: ${error}`);
  }

  const sorted = [...values].sort((a, b) => a - b);
  return createFieldResult(config, value, sorted, '');
}

function addCronPartValues(part: string, config: CronFieldConfig, values: Set<number>): string {
  const [rangePart, stepPart] = part.split('/');
  if (!rangePart || part.split('/').length > 2) return `Invalid segment "${part}".`;

  const step = stepPart ? Number(stepPart) : 1;
  if (!Number.isInteger(step) || step < 1) return `Step must be a positive integer.`;

  const range = getCronRange(rangePart, config);
  if (range.error) return range.error;

  for (let value = range.start; value <= range.end; value += step) {
    values.add(config.label === 'Day of week' && value === 7 ? 0 : value);
  }

  return '';
}

function getCronRange(value: string, config: CronFieldConfig): { start: number; end: number; error: string } {
  if (value === '*') return { start: config.min, end: config.max, error: '' };

  if (value.includes('-')) {
    const [startValue, endValue] = value.split('-');
    const start = parseCronNumber(startValue, config);
    const end = parseCronNumber(endValue, config);
    if (!start.valid || !end.valid) return { start: 0, end: 0, error: `Range contains an invalid value.` };
    if (start.value > end.value) return { start: 0, end: 0, error: `Range start must be before range end.` };

    return { start: start.value, end: end.value, error: '' };
  }

  const parsed = parseCronNumber(value, config);
  if (!parsed.valid) return { start: 0, end: 0, error: `Invalid value "${value}".` };
  return { start: parsed.value, end: parsed.value, error: '' };
}

function parseCronNumber(value: string, config: CronFieldConfig): { value: number; valid: boolean } {
  const namedValue = config.names?.[value];
  const number = namedValue ?? Number(value);
  const max = config.label === 'Day of week' ? 7 : config.max;

  return { value: number, valid: Number.isInteger(number) && number >= config.min && number <= max };
}

function createFieldResult(config: CronFieldConfig, value: string, values: number[], error: string): CronFieldParseResult {
  return {
    label: config.label,
    value,
    description: error ? 'Invalid field.' : describeField(value, config),
    values,
    error,
  };
}

function describeSchedule(fields: CronFieldParseResult[]): string {
  return `${fields[0].description}, ${fields[1].description.toLocaleLowerCase()}, ${fields[2].description.toLocaleLowerCase()}, ${fields[3].description.toLocaleLowerCase()}, ${fields[4].description.toLocaleLowerCase()}.`;
}

function describeField(value: string, config: CronFieldConfig): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === '*') return `Every ${config.label.toLocaleLowerCase()}`;
  if (normalized.startsWith('*/')) return `Every ${normalized.slice(2)} ${config.label.toLocaleLowerCase()}s`;
  if (normalized.includes(',')) return `${config.label}s ${normalized}`;
  if (normalized.includes('-')) return `${config.label}s ${normalized}`;
  return `${config.label} ${normalized}`;
}

function getNextRuns(fields: CronFieldParseResult[], from: Date): Date[] {
  const runs: Date[] = [];
  const candidate = new Date(from);
  candidate.setSeconds(0, 0);
  candidate.setMinutes(candidate.getMinutes() + 1);
  const maxChecks = 525_600;

  for (let checked = 0; checked < maxChecks && runs.length < 5; checked += 1) {
    if (matchesCron(candidate, fields)) runs.push(new Date(candidate));
    candidate.setMinutes(candidate.getMinutes() + 1);
  }

  return runs;
}

function matchesCron(date: Date, fields: CronFieldParseResult[]): boolean {
  const minute = fields[0].values.includes(date.getMinutes());
  const hour = fields[1].values.includes(date.getHours());
  const dayOfMonthAny = fields[2].value.trim() === '*';
  const dayOfWeekAny = fields[4].value.trim() === '*';
  const dayOfMonth = fields[2].values.includes(date.getDate());
  const month = fields[3].values.includes(date.getMonth() + 1);
  const dayOfWeek = fields[4].values.includes(date.getDay());
  const day = dayOfMonthAny || dayOfWeekAny ? dayOfMonth && dayOfWeek : dayOfMonth || dayOfWeek;

  return minute && hour && day && month;
}
