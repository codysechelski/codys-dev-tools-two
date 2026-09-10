import { effectScope, nextTick, ref, reactive, type EffectScope } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applySnapshot,
  clearAllToolState,
  hasStoredToolState,
  initToolState,
  isToolStateReady,
  resetToolStateForTests,
  setRememberToolInputMode,
  takeSnapshot,
  toolStateMode,
  usePersistedToolState,
} from './toolState';

function createCodyDevTools(overrides: Partial<NonNullable<Window['codyDevTools']>> = {}): NonNullable<Window['codyDevTools']> {
  return {
    platform: 'darwin',
    isElectron: true,
    loadTextFile: vi.fn(),
    saveTextFile: vi.fn(),
    onSetTheme: vi.fn(),
    notifyThemeChanged: vi.fn(),
    loadSettings: vi.fn(),
    saveSettings: vi.fn(),
    chooseSettingsDirectory: vi.fn(),
    resetSettingsDirectory: vi.fn(),
    loadToolState: vi.fn().mockResolvedValue({}),
    saveToolState: vi.fn().mockResolvedValue(undefined),
    clearToolState: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// usePersistedToolState's watch() needs an active effect scope to be disposable; onBeforeUnmount
// silently no-ops outside a real component, which is fine here since these tests only rely on
// the watch-driven persist/hydrate behavior, not the unmount cleanup itself.
function withScope(fn: () => void): EffectScope {
  const scope = effectScope();
  scope.run(fn);
  return scope;
}

afterEach(() => {
  resetToolStateForTests();
  localStorage.clear();
  delete (window as { codyDevTools?: unknown }).codyDevTools;
});

describe('takeSnapshot / applySnapshot', () => {
  it('unwraps refs and copies reactive objects into a plain JSON-safe object', () => {
    const input = ref('hello');
    const options = reactive({ caseSensitive: true, sortScheme: 'ordinal' });

    const snapshot = takeSnapshot({ input, options });

    expect(snapshot).toEqual({ input: 'hello', options: { caseSensitive: true, sortScheme: 'ordinal' } });
  });

  it('applies a snapshot back into matching refs and reactive objects', () => {
    const input = ref('');
    const options = reactive({ caseSensitive: true, sortScheme: 'ordinal' });

    applySnapshot({ input, options }, { input: 'restored', options: { caseSensitive: false, sortScheme: 'natural' } });

    expect(input.value).toBe('restored');
    expect(options).toEqual({ caseSensitive: false, sortScheme: 'natural' });
  });

  it('ignores snapshot keys that do not exist in the fields map', () => {
    const input = ref('kept');

    applySnapshot({ input }, { input: 'kept', somethingElse: 'ignored' });

    expect(input.value).toBe('kept');
  });
});

describe('usePersistedToolState in session mode', () => {
  it('restores a value saved by a previous mount under the same tool id', async () => {
    toolStateMode.value = 'session';
    isToolStateReady.value = true;

    const firstInput = ref('');
    const firstScope = withScope(() => {
      usePersistedToolState('demo-tool', { input: firstInput });
    });
    firstInput.value = 'typed value';
    await nextTick();
    firstScope.stop();

    const secondInput = ref('');
    withScope(() => {
      usePersistedToolState('demo-tool', { input: secondInput });
    });

    expect(secondInput.value).toBe('typed value');
  });

  it('does not persist anything in never mode', async () => {
    toolStateMode.value = 'never';
    isToolStateReady.value = true;

    const input = ref('');
    withScope(() => {
      usePersistedToolState('demo-tool', { input });
    });
    input.value = 'typed value';
    await nextTick();

    expect(hasStoredToolState()).toBe(false);
  });
});

describe('setRememberToolInputMode', () => {
  it('clears in-memory forever state and calls the clear bridge when leaving forever mode', async () => {
    const clearToolState = vi.fn().mockResolvedValue(undefined);
    window.codyDevTools = createCodyDevTools({ clearToolState, loadToolState: vi.fn().mockResolvedValue({ 'demo-tool': { input: 'saved' } }) });

    await initToolState(true);
    toolStateMode.value = 'forever';
    expect(hasStoredToolState()).toBe(true);

    await setRememberToolInputMode('session', true);

    expect(clearToolState).toHaveBeenCalled();
    expect(hasStoredToolState()).toBe(false);
    expect(toolStateMode.value).toBe('session');
  });

  it('clears session state when moving to never', async () => {
    toolStateMode.value = 'session';
    const input = ref('');
    withScope(() => {
      usePersistedToolState('demo-tool', { input });
    });
    input.value = 'typed value';
    await nextTick();
    expect(hasStoredToolState()).toBe(true);

    await setRememberToolInputMode('never', false);

    expect(hasStoredToolState()).toBe(false);
  });
});

describe('web localStorage round trip for forever mode', () => {
  it('persists a debounced snapshot to localStorage and reloads it on init', async () => {
    vi.useFakeTimers();
    toolStateMode.value = 'forever';
    isToolStateReady.value = true;

    const input = ref('');
    withScope(() => {
      usePersistedToolState('demo-tool', { input });
    });
    input.value = 'typed value';
    await nextTick();
    vi.advanceTimersByTime(500);
    vi.useRealTimers();

    expect(JSON.parse(localStorage.getItem('codys-dev-tools:tool-state') ?? '{}')).toEqual({ 'demo-tool': { input: 'typed value' } });

    resetToolStateForTests();
    await initToolState(false);
    expect(hasStoredToolState()).toBe(true);
  });
});

describe('clearAllToolState', () => {
  it('clears both session and forever state', async () => {
    toolStateMode.value = 'session';
    const input = ref('');
    withScope(() => {
      usePersistedToolState('demo-tool', { input });
    });
    input.value = 'typed value';
    await nextTick();
    expect(hasStoredToolState()).toBe(true);

    await clearAllToolState(false);

    expect(hasStoredToolState()).toBe(false);
  });
});
