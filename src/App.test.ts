import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.vue';

describe('App theme <-> Electron menu wiring', () => {
  afterEach(() => {
    delete (window as { codyDevTools?: unknown }).codyDevTools;
  });

  it('applies a theme pushed from the native menu via onSetTheme', async () => {
    let pushTheme: ((mode: 'light' | 'dark' | 'system') => void) | null = null;
    window.codyDevTools = {
      platform: 'darwin',
      isElectron: true,
      loadTextFile: vi.fn(),
      onSetTheme: (callback) => {
        pushTheme = callback;
      },
      notifyThemeChanged: vi.fn(),
    };

    const wrapper = mount(App);

    expect(pushTheme).not.toBeNull();
    pushTheme?.('dark');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.app-shell').attributes('data-theme')).toBe('dark');
  });

  it('notifies the main process when the theme changes from the Settings page', async () => {
    const notifyThemeChanged = vi.fn();
    window.codyDevTools = {
      platform: 'darwin',
      isElectron: true,
      loadTextFile: vi.fn(),
      onSetTheme: vi.fn(),
      notifyThemeChanged,
    };

    const wrapper = mount(App);

    await wrapper.find('.sidebar__settings-button').trigger('click');
    await wrapper.findAll('.settings-theme-card')[1].trigger('click');

    expect(notifyThemeChanged).toHaveBeenCalledWith('dark');
  });
});
