export type JsonOutputMode = 'formatted' | 'compact' | 'newline-delimited';

export interface JsonFormatterOptions {
  mode: JsonOutputMode;
  indentation: '2-spaces' | '4-spaces' | 'tabs';
  sortKeys: boolean;
}

export interface JsonFormatterResult {
  output: string;
  error: string;
}

export function formatJson(input: string, options: JsonFormatterOptions): JsonFormatterResult {
  if (!input.trim()) {
    return { output: '', error: '' };
  }

  try {
    const parsed = JSON.parse(input) as unknown;
    const normalized = options.sortKeys ? sortJsonKeys(parsed) : parsed;

    return {
      output: stringifyJson(normalized, options),
      error: '',
    };
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

export function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonKeys);
  }

  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .reduce<Record<string, unknown>>((sorted, key) => {
        sorted[key] = sortJsonKeys(value[key]);
        return sorted;
      }, {});
  }

  return value;
}

function stringifyJson(value: unknown, options: JsonFormatterOptions): string {
  if (options.mode === 'compact') {
    return JSON.stringify(value);
  }

  if (options.mode === 'newline-delimited' && Array.isArray(value)) {
    return value.map((item) => JSON.stringify(item)).join('\n');
  }

  return JSON.stringify(value, null, getIndentation(options.indentation));
}

function getIndentation(indentation: JsonFormatterOptions['indentation']): number | string {
  if (indentation === '4-spaces') return 4;
  if (indentation === 'tabs') return '\t';
  return 2;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
