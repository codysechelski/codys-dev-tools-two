import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.vue';
import { DEFAULT_SETTINGS } from '@/settings';
import { resetToolStateForTests } from '@/toolState';

function createCodyDevTools(overrides: Partial<NonNullable<Window['codyDevTools']>> = {}): NonNullable<Window['codyDevTools']> {
  return {
    platform: 'darwin',
    isElectron: true,
    loadTextFile: vi.fn(),
    onSetTheme: vi.fn(),
    notifyThemeChanged: vi.fn(),
    loadSettings: vi.fn().mockResolvedValue({ settings: { ...DEFAULT_SETTINGS }, settingsPath: '/settings.json', isCustomLocation: false }),
    saveSettings: vi.fn().mockResolvedValue({ settingsPath: '/settings.json' }),
    chooseSettingsDirectory: vi.fn(),
    resetSettingsDirectory: vi.fn(),
    loadToolState: vi.fn().mockResolvedValue({}),
    saveToolState: vi.fn().mockResolvedValue(undefined),
    clearToolState: vi.fn().mockResolvedValue(undefined),
    onUpdateNotice: vi.fn(),
    quitAndInstallUpdate: vi.fn(),
    triggerMenuAction: vi.fn(),
    ...overrides,
  };
}

describe('App theme <-> Electron menu wiring', () => {
  afterEach(() => {
    delete (window as { codyDevTools?: unknown }).codyDevTools;
    resetToolStateForTests();
  });

  it('applies a theme pushed from the native menu via onSetTheme', async () => {
    let pushTheme: ((mode: 'light' | 'dark' | 'system') => void) | null = null;
    window.codyDevTools = createCodyDevTools({
      onSetTheme: (callback) => {
        pushTheme = callback;
      },
    });

    const wrapper = mount(App);

    expect(pushTheme).not.toBeNull();
    pushTheme?.('dark');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.app-shell').attributes('data-theme')).toBe('dark');
  });

  it('notifies the main process when the theme changes from the Settings page', async () => {
    const notifyThemeChanged = vi.fn();
    window.codyDevTools = createCodyDevTools({ notifyThemeChanged });

    const wrapper = mount(App);

    await wrapper.find('.sidebar__settings-button').trigger('click');
    await wrapper.findAll('.settings-theme-card')[1].trigger('click');

    expect(notifyThemeChanged).toHaveBeenCalledWith('dark');
  });
});

describe('App settings persistence', () => {
  afterEach(() => {
    delete (window as { codyDevTools?: unknown }).codyDevTools;
    resetToolStateForTests();
  });

  it('loads the theme from the saved settings file on startup', async () => {
    window.codyDevTools = createCodyDevTools({
      loadSettings: vi.fn().mockResolvedValue({ settings: { ...DEFAULT_SETTINGS, themeMode: 'dark' }, settingsPath: '/settings.json', isCustomLocation: false }),
    });

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.find('.app-shell').attributes('data-theme')).toBe('dark');
  });

  it('saves settings to disk when the theme changes from the Settings page', async () => {
    const saveSettings = vi.fn().mockResolvedValue({ settingsPath: '/settings.json' });
    window.codyDevTools = createCodyDevTools({ saveSettings });

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.find('.sidebar__settings-button').trigger('click');
    await wrapper.findAll('.settings-theme-card')[1].trigger('click');
    await flushPromises();

    expect(saveSettings).toHaveBeenCalledWith({ ...DEFAULT_SETTINGS, themeMode: 'dark' });
  });

  it('sends a structured-cloneable plain object to saveSettings, not a reactive proxy', async () => {
    // Regression test: settings used to be a deep `ref`, which wraps nested properties like
    // pinnedToolIds in a reactive Proxy. `{ ...settings.value }` only unwraps the top-level
    // proxy, so the nested array stayed a Proxy — Electron's ipcRenderer.invoke (real structured
    // clone, reproduced here with the same global) rejected with "could not be cloned" on every
    // save, silently, since persistSettings() is called via `void` from a watcher. A plain
    // `toHaveBeenCalledWith` deep-equality check doesn't catch this (Proxies read the same),
    // so this test clones the argument for real instead.
    let cloneError: unknown = null;
    const saveSettings = vi.fn(async (settings: unknown) => {
      try {
        structuredClone(settings);
      } catch (error) {
        cloneError = error;
      }
      return { settingsPath: '/settings.json' };
    });
    window.codyDevTools = createCodyDevTools({ saveSettings });

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.find('.sidebar__settings-button').trigger('click');
    await wrapper.findAll('.settings-theme-card')[1].trigger('click');
    await flushPromises();

    expect(saveSettings).toHaveBeenCalled();
    expect(cloneError).toBeNull();
  });

  it('shows the settings file path and a location warning when the custom directory is unavailable', async () => {
    window.codyDevTools = createCodyDevTools({
      loadSettings: vi.fn().mockResolvedValue({
        settings: { ...DEFAULT_SETTINGS },
        settingsPath: '/default/settings.json',
        isCustomLocation: false,
        warning: 'Custom settings location "/missing" is unavailable; using the default location instead.',
      }),
    });

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.find('.sidebar__settings-button').trigger('click');

    expect(wrapper.text()).toContain('/default/settings.json');
    expect(wrapper.text()).toContain('unavailable');
  });

  it('lets the user choose a custom settings directory and saves settings there', async () => {
    const saveSettings = vi.fn().mockResolvedValue({ settingsPath: '/custom/settings.json' });
    const chooseSettingsDirectory = vi.fn().mockResolvedValue({ settingsPath: '/custom/settings.json', isCustomLocation: true });
    window.codyDevTools = createCodyDevTools({ saveSettings, chooseSettingsDirectory });

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.find('.sidebar__settings-button').trigger('click');
    await wrapper.findAll('button').find((button) => button.text() === 'Choose Custom Location…')?.trigger('click');
    await flushPromises();

    expect(chooseSettingsDirectory).toHaveBeenCalled();
    expect(saveSettings).toHaveBeenCalled();
    expect(wrapper.text()).toContain('/custom/settings.json');
    expect(wrapper.text()).toContain('Reset to Default');
  });

  it('resets to the default settings directory', async () => {
    const saveSettings = vi.fn().mockResolvedValue({ settingsPath: '/default/settings.json' });
    const resetSettingsDirectory = vi.fn().mockResolvedValue({ settingsPath: '/default/settings.json', isCustomLocation: false });
    window.codyDevTools = createCodyDevTools({
      loadSettings: vi.fn().mockResolvedValue({ settings: { ...DEFAULT_SETTINGS }, settingsPath: '/custom/settings.json', isCustomLocation: true }),
      saveSettings,
      resetSettingsDirectory,
    });

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.find('.sidebar__settings-button').trigger('click');
    await wrapper.findAll('button').find((button) => button.text() === 'Reset to Default')?.trigger('click');
    await flushPromises();

    expect(resetSettingsDirectory).toHaveBeenCalled();
    expect(saveSettings).toHaveBeenCalled();
    expect(wrapper.text()).toContain('/default/settings.json');
  });
});

describe('App remember-tool-input persistence', () => {
  afterEach(() => {
    delete (window as { codyDevTools?: unknown }).codyDevTools;
    resetToolStateForTests();
  });

  it('saves settings when the remember-tool-input mode changes from the Settings page', async () => {
    const saveSettings = vi.fn().mockResolvedValue({ settingsPath: '/settings.json' });
    window.codyDevTools = createCodyDevTools({ saveSettings });

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.find('.sidebar__settings-button').trigger('click');
    const foreverCard = wrapper.findAll('.settings-theme-card').find((card) => card.text().includes('Forever'));
    await foreverCard?.trigger('click');
    await flushPromises();

    expect(saveSettings).toHaveBeenCalledWith({ ...DEFAULT_SETTINGS, rememberToolInput: 'forever' });
  });

  it('clears saved tool data via the bridge when leaving Forever mode', async () => {
    const clearToolState = vi.fn().mockResolvedValue(undefined);
    window.codyDevTools = createCodyDevTools({
      loadSettings: vi
        .fn()
        .mockResolvedValue({ settings: { ...DEFAULT_SETTINGS, rememberToolInput: 'forever' }, settingsPath: '/settings.json', isCustomLocation: false }),
      loadToolState: vi.fn().mockResolvedValue({ 'json-formatter': { input: 'hello' } }),
      clearToolState,
    });

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.find('.sidebar__settings-button').trigger('click');
    const neverCard = wrapper.findAll('.settings-theme-card').find((card) => card.text().includes('Never'));
    await neverCard?.trigger('click');
    await flushPromises();

    expect(clearToolState).toHaveBeenCalled();
  });
});

describe('App update banner', () => {
  afterEach(() => {
    delete (window as { codyDevTools?: unknown }).codyDevTools;
    resetToolStateForTests();
  });

  it('shows the "install" banner once a downloaded update is pushed from the main process', async () => {
    let pushNotice: ((notice: UpdateNotice) => void) | null = null;
    window.codyDevTools = createCodyDevTools({
      onUpdateNotice: (callback) => {
        pushNotice = callback;
      },
    });

    const wrapper = mount(App);

    expect(wrapper.find('.update-banner').exists()).toBe(false);
    expect(pushNotice).not.toBeNull();

    pushNotice?.({ version: '1.2.3', action: 'install', releasesUrl: 'https://example.com/releases' });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.update-banner').exists()).toBe(true);
    expect(wrapper.text()).toContain('1.2.3');
    expect(wrapper.text()).toContain('Restart & Update');
  });

  it('quits and installs via the bridge when "Restart & Update" is clicked', async () => {
    let pushNotice: ((notice: UpdateNotice) => void) | null = null;
    const quitAndInstallUpdate = vi.fn();
    window.codyDevTools = createCodyDevTools({
      onUpdateNotice: (callback) => {
        pushNotice = callback;
      },
      quitAndInstallUpdate,
    });

    const wrapper = mount(App);
    pushNotice?.({ version: '1.2.3', action: 'install', releasesUrl: 'https://example.com/releases' });
    await wrapper.vm.$nextTick();

    await wrapper.findAll('button').find((button) => button.text().includes('Restart'))?.trigger('click');

    expect(quitAndInstallUpdate).toHaveBeenCalled();
  });

  it('shows a "View Release" link to the releases page for a manual (e.g. unsigned macOS) notice', async () => {
    let pushNotice: ((notice: UpdateNotice) => void) | null = null;
    window.codyDevTools = createCodyDevTools({
      onUpdateNotice: (callback) => {
        pushNotice = callback;
      },
    });

    const wrapper = mount(App);
    pushNotice?.({ version: '1.2.3', action: 'manual', releasesUrl: 'https://example.com/releases' });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Update available');
    expect(wrapper.text()).toContain('View Release');
    const link = wrapper.find('.update-banner a');
    expect(link.attributes('href')).toBe('https://example.com/releases');
    expect(link.attributes('target')).toBe('_blank');
  });

  it('dismisses the update banner without installing', async () => {
    let pushNotice: ((notice: UpdateNotice) => void) | null = null;
    window.codyDevTools = createCodyDevTools({
      onUpdateNotice: (callback) => {
        pushNotice = callback;
      },
    });

    const wrapper = mount(App);
    pushNotice?.({ version: '1.2.3', action: 'install', releasesUrl: 'https://example.com/releases' });
    await wrapper.vm.$nextTick();

    await wrapper.find('[aria-label="Dismiss update notification"]').trigger('click');

    expect(wrapper.find('.update-banner').exists()).toBe(false);
  });
});

async function flushPromises(): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve));
}
