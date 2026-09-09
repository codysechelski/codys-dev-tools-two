export interface RegexFlagsState {
  global: boolean;
  ignoreCase: boolean;
  multiline: boolean;
  dotAll: boolean;
  unicode: boolean;
  sticky: boolean;
}

export interface RegexMatch {
  index: number;
  endIndex: number;
  text: string;
  groups: Array<string | undefined>;
  namedGroups: Record<string, string>;
}

export interface RegexTestResult {
  error: string | null;
  matches: RegexMatch[];
}

// Guards against pathological patterns (e.g. zero-width matches) flooding the results list on large input.
export const MAX_MATCHES = 5000;

export function flagsToString(flags: RegexFlagsState): string {
  return (
    (flags.global ? 'g' : '') +
    (flags.ignoreCase ? 'i' : '') +
    (flags.multiline ? 'm' : '') +
    (flags.dotAll ? 's' : '') +
    (flags.unicode ? 'u' : '') +
    (flags.sticky ? 'y' : '')
  );
}

export function testRegex(pattern: string, flags: RegexFlagsState, testText: string): RegexTestResult {
  if (!pattern) return { error: null, matches: [] };

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flagsToString(flags));
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Invalid regular expression', matches: [] };
  }

  if (!testText) return { error: null, matches: [] };

  const matches: RegexMatch[] = [];
  try {
    if (flags.global) {
      for (const match of testText.matchAll(regex)) {
        matches.push(toRegexMatch(match));
        if (matches.length >= MAX_MATCHES) break;
      }
    } else {
      const match = regex.exec(testText);
      if (match) matches.push(toRegexMatch(match));
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error while matching', matches: [] };
  }

  return { error: null, matches };
}

function toRegexMatch(match: RegExpMatchArray): RegexMatch {
  const index = match.index ?? 0;
  const text = match[0];

  return {
    index,
    endIndex: index + text.length,
    text,
    groups: Array.from(match).slice(1),
    namedGroups: match.groups ? { ...match.groups } : {},
  };
}

export interface RegexPreset {
  id: string;
  label: string;
  pattern: string;
  flags: Partial<RegexFlagsState>;
}

export const commonPatterns: RegexPreset[] = [
  { id: 'email', label: 'Email address', pattern: '\\b[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}\\b', flags: { global: true } },
  { id: 'url', label: 'URL', pattern: 'https?://[\\w-]+(?:\\.[\\w-]+)+(?:/[\\w\\-./?%&=#]*)?', flags: { global: true } },
  {
    id: 'ipv4',
    label: 'IPv4 address',
    pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b',
    flags: { global: true },
  },
  { id: 'hex-color', label: 'Hex color', pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b', flags: { global: true } },
  { id: 'iso-date', label: 'ISO date (YYYY-MM-DD)', pattern: '\\b\\d{4}-\\d{2}-\\d{2}\\b', flags: { global: true } },
  { id: 'us-phone', label: 'US phone number', pattern: '\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}\\b', flags: { global: true } },
  { id: 'integer', label: 'Integer', pattern: '-?\\b\\d+\\b', flags: { global: true } },
  { id: 'decimal', label: 'Decimal number', pattern: '-?\\b\\d+(?:\\.\\d+)?\\b', flags: { global: true } },
];
