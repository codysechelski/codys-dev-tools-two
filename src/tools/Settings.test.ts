import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Settings from './Settings.vue';

describe('Settings', () => {
  it('renders theme choices and marks the active mode', () => {
    const wrapper = mount(Settings, {
      props: {
        themeMode: 'system',
      },
    });

    expect(wrapper.text()).toContain('Appearance');
    expect(wrapper.text()).toContain('Light');
    expect(wrapper.text()).toContain('Dark');
    expect(wrapper.text()).toContain('System');
    expect(wrapper.find('.settings-theme-card--active').text()).toContain('System');
  });

  it('emits theme changes', async () => {
    const wrapper = mount(Settings, {
      props: {
        themeMode: 'system',
      },
    });

    await wrapper.findAll('.settings-theme-card')[0].trigger('click');

    expect(wrapper.emitted('setTheme')?.[0]).toEqual(['light']);
  });
});
