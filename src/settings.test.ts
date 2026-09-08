import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, loadSettingsFromLocalStorage, mergeWithDefaults, saveSettingsToLocalStorage } from './settings';

describe('mergeWithDefaults', () => {
  it('returns the defaults for non-object input', () => {
    expect(mergeWithDefaults(null)).toEqual(DEFAULT_SETTINGS);
    expect(mergeWithDefaults(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(mergeWithDefaults('nonsense')).toEqual(DEFAULT_SETTINGS);
    expect(mergeWithDefaults(42)).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps a valid themeMode', () => {
    expect(mergeWithDefaults({ themeMode: 'dark' })).toEqual({ ...DEFAULT_SETTINGS, themeMode: 'dark' });
    expect(mergeWithDefaults({ themeMode: 'light' })).toEqual({ ...DEFAULT_SETTINGS, themeMode: 'light' });
  });

  it('falls back to the default themeMode for missing or invalid values', () => {
    expect(mergeWithDefaults({})).toEqual(DEFAULT_SETTINGS);
    expect(mergeWithDefaults({ themeMode: 'neon' })).toEqual(DEFAULT_SETTINGS);
    expect(mergeWithDefaults({ themeMode: 123 })).toEqual(DEFAULT_SETTINGS);
  });

  it('ignores unknown extra keys', () => {
    expect(mergeWithDefaults({ themeMode: 'dark', somethingUnrelated: true })).toEqual({ ...DEFAULT_SETTINGS, themeMode: 'dark' });
  });

  it('keeps a valid rememberToolInput', () => {
    expect(mergeWithDefaults({ rememberToolInput: 'session' })).toEqual({ ...DEFAULT_SETTINGS, rememberToolInput: 'session' });
    expect(mergeWithDefaults({ rememberToolInput: 'forever' })).toEqual({ ...DEFAULT_SETTINGS, rememberToolInput: 'forever' });
  });

  it('falls back to the default rememberToolInput for missing or invalid values', () => {
    expect(mergeWithDefaults({ rememberToolInput: 'always' })).toEqual(DEFAULT_SETTINGS);
    expect(mergeWithDefaults({ rememberToolInput: 123 })).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps a valid defaultIndentStyle', () => {
    expect(mergeWithDefaults({ defaultIndentStyle: '4-spaces' })).toEqual({ ...DEFAULT_SETTINGS, defaultIndentStyle: '4-spaces' });
    expect(mergeWithDefaults({ defaultIndentStyle: 'tabs' })).toEqual({ ...DEFAULT_SETTINGS, defaultIndentStyle: 'tabs' });
  });

  it('falls back to the default defaultIndentStyle for missing or invalid values', () => {
    expect(mergeWithDefaults({ defaultIndentStyle: '8-spaces' })).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid boolean formatter defaults', () => {
    expect(mergeWithDefaults({ defaultPreserveComments: false })).toEqual({ ...DEFAULT_SETTINGS, defaultPreserveComments: false });
    expect(mergeWithDefaults({ defaultPreserveBlankLines: true })).toEqual({ ...DEFAULT_SETTINGS, defaultPreserveBlankLines: true });
    expect(mergeWithDefaults({ defaultCaseSensitive: true })).toEqual({ ...DEFAULT_SETTINGS, defaultCaseSensitive: true });
    expect(mergeWithDefaults({ defaultSortKeys: true })).toEqual({ ...DEFAULT_SETTINGS, defaultSortKeys: true });
  });

  it('falls back to defaults for non-boolean formatter default values', () => {
    expect(mergeWithDefaults({ defaultPreserveComments: 'yes' })).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps a valid, deduplicated pinnedToolIds array', () => {
    expect(mergeWithDefaults({ pinnedToolIds: ['json-formatter', 'json-formatter', 'uuid-generator'] })).toEqual({
      ...DEFAULT_SETTINGS,
      pinnedToolIds: ['json-formatter', 'uuid-generator'],
    });
  });

  it('falls back to an empty pinnedToolIds for invalid values', () => {
    expect(mergeWithDefaults({ pinnedToolIds: 'not-an-array' })).toEqual(DEFAULT_SETTINGS);
    expect(mergeWithDefaults({ pinnedToolIds: [1, 2, 3] })).toEqual({ ...DEFAULT_SETTINGS, pinnedToolIds: [] });
  });
});

describe('localStorage persistence', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('returns the defaults when nothing is stored', () => {
    expect(loadSettingsFromLocalStorage()).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips settings through localStorage', () => {
    saveSettingsToLocalStorage({ ...DEFAULT_SETTINGS, themeMode: 'dark', rememberToolInput: 'forever' });

    expect(loadSettingsFromLocalStorage()).toEqual({ ...DEFAULT_SETTINGS, themeMode: 'dark', rememberToolInput: 'forever' });
  });

  it('falls back to defaults for corrupt stored JSON', () => {
    localStorage.setItem('codys-dev-tools:settings', '{not valid json');

    expect(loadSettingsFromLocalStorage()).toEqual(DEFAULT_SETTINGS);
  });
});
