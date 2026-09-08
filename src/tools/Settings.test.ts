import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import Settings from './Settings.vue';
import { DEFAULT_SETTINGS } from '@/settings';

const baseProps = {
  themeMode: 'system' as const,
  isElectron: false,
  settingsPath: '',
  isCustomSettingsLocation: false,
  settingsLocationWarning: '',
  rememberToolInput: 'never' as const,
  hasSavedToolData: false,
  settings: { ...DEFAULT_SETTINGS },
};

describe('Settings', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders theme choices and marks the active mode', () => {
    const wrapper = mount(Settings, { props: baseProps });

    expect(wrapper.text()).toContain('Appearance');
    expect(wrapper.text()).toContain('Light');
    expect(wrapper.text()).toContain('Dark');
    expect(wrapper.text()).toContain('System');
    expect(wrapper.find('.settings-theme-card--active').text()).toContain('System');
  });

  it('emits theme changes', async () => {
    const wrapper = mount(Settings, { props: baseProps });

    await wrapper.findAll('.settings-theme-card')[0].trigger('click');

    expect(wrapper.emitted('setTheme')?.[0]).toEqual(['light']);
  });

  it('renders formatting defaults reflecting the current settings', () => {
    const wrapper = mount(Settings, {
      props: { ...baseProps, settings: { ...DEFAULT_SETTINGS, defaultIndentStyle: '4-spaces', defaultCaseSensitive: true } },
    });

    expect(wrapper.text()).toContain('Formatting Defaults');
    expect(wrapper.find('.form-select__trigger').text()).toContain('4 spaces');

    const caseToggle = wrapper.findAll('.form-toggle').find((toggle) => toggle.text().includes('Case-sensitive matching'));
    expect(caseToggle?.find('.form-toggle__control').attributes('aria-checked')).toBe('true');
  });

  it('emits updateSetting when a formatting default changes', async () => {
    const wrapper = mount(Settings, { props: baseProps });

    const preserveCommentsToggle = wrapper.findAll('.form-toggle').find((toggle) => toggle.text().includes('Preserve comments'));
    await preserveCommentsToggle?.find('.form-toggle__control').trigger('click');

    expect(wrapper.emitted('updateSetting')?.[0]).toEqual([{ defaultPreserveComments: false }]);
  });

  it('requires confirmation before emitting resetSettings', async () => {
    const wrapper = mount(Settings, { props: baseProps, attachTo: document.body });

    await wrapper.find('button.app-button--destructive').trigger('click');
    expect(wrapper.emitted('resetSettings')).toBeUndefined();
    expect(document.body.textContent).toContain('Reset all settings?');

    const confirmButton = Array.from(document.body.querySelectorAll<HTMLButtonElement>('.modal__footer button')).find(
      (button) => button.textContent === 'Reset Settings',
    );
    confirmButton?.click();
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('resetSettings')).toHaveLength(1);
  });

  it('cancelling the reset confirmation does not emit resetSettings', async () => {
    const wrapper = mount(Settings, { props: baseProps, attachTo: document.body });

    await wrapper.find('button.app-button--destructive').trigger('click');
    const cancelButton = Array.from(document.body.querySelectorAll<HTMLButtonElement>('.modal__footer button')).find(
      (button) => button.textContent === 'Cancel',
    );
    cancelButton?.click();
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('resetSettings')).toBeUndefined();
    expect(document.body.querySelector('.modal')).toBeNull();
  });
});
