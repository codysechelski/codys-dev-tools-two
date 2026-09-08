import type { ThemeMode } from '@/theme';

export type RememberToolInput = 'never' | 'session' | 'forever';
export type IndentStyle = '2-spaces' | '4-spaces' | 'tabs';

export interface AppSettings {
  themeMode: ThemeMode;
  rememberToolInput: RememberToolInput;
  defaultIndentStyle: IndentStyle;
  defaultPreserveComments: boolean;
  defaultPreserveBlankLines: boolean;
  defaultCaseSensitive: boolean;
  defaultSortKeys: boolean;
  pinnedToolIds: string[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  rememberToolInput: 'never',
  defaultIndentStyle: '2-spaces',
  defaultPreserveComments: true,
  defaultPreserveBlankLines: false,
  defaultCaseSensitive: false,
  defaultSortKeys: false,
  pinnedToolIds: [],
};

const LOCAL_STORAGE_KEY = 'codys-dev-tools:settings';
const THEME_MODES: ThemeMode[] = ['light', 'dark', 'system'];
const REMEMBER_TOOL_INPUT_MODES: RememberToolInput[] = ['never', 'session', 'forever'];
const INDENT_STYLES: IndentStyle[] = ['2-spaces', '4-spaces', 'tabs'];

export function mergeWithDefaults(raw: unknown): AppSettings {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_SETTINGS };

  const candidate = raw as Partial<Record<keyof AppSettings, unknown>>;
  const themeMode = THEME_MODES.includes(candidate.themeMode as ThemeMode) ? (candidate.themeMode as ThemeMode) : DEFAULT_SETTINGS.themeMode;
  const rememberToolInput = REMEMBER_TOOL_INPUT_MODES.includes(candidate.rememberToolInput as RememberToolInput)
    ? (candidate.rememberToolInput as RememberToolInput)
    : DEFAULT_SETTINGS.rememberToolInput;
  const defaultIndentStyle = INDENT_STYLES.includes(candidate.defaultIndentStyle as IndentStyle)
    ? (candidate.defaultIndentStyle as IndentStyle)
    : DEFAULT_SETTINGS.defaultIndentStyle;
  const defaultPreserveComments = typeof candidate.defaultPreserveComments === 'boolean' ? candidate.defaultPreserveComments : DEFAULT_SETTINGS.defaultPreserveComments;
  const defaultPreserveBlankLines =
    typeof candidate.defaultPreserveBlankLines === 'boolean' ? candidate.defaultPreserveBlankLines : DEFAULT_SETTINGS.defaultPreserveBlankLines;
  const defaultCaseSensitive = typeof candidate.defaultCaseSensitive === 'boolean' ? candidate.defaultCaseSensitive : DEFAULT_SETTINGS.defaultCaseSensitive;
  const defaultSortKeys = typeof candidate.defaultSortKeys === 'boolean' ? candidate.defaultSortKeys : DEFAULT_SETTINGS.defaultSortKeys;
  const pinnedToolIds = Array.isArray(candidate.pinnedToolIds)
    ? [...new Set(candidate.pinnedToolIds.filter((id): id is string => typeof id === 'string'))]
    : DEFAULT_SETTINGS.pinnedToolIds;

  return {
    themeMode,
    rememberToolInput,
    defaultIndentStyle,
    defaultPreserveComments,
    defaultPreserveBlankLines,
    defaultCaseSensitive,
    defaultSortKeys,
    pinnedToolIds,
  };
}

export function loadSettingsFromLocalStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };

    return mergeWithDefaults(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettingsToLocalStorage(settings: AppSettings): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable (private browsing, disabled, quota) — settings just won't persist.
  }
}
