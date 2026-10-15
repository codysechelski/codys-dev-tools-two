import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import AppSidebar from '@/components/AppSidebar.vue';
import CustomTitleBar from '@/components/CustomTitleBar.vue';
import HomePanel from '@/components/HomePanel.vue';
import { DEFAULT_SETTINGS } from '@/settings';
import Settings from '@/tools/Settings.vue';

// Every other test runs as the consumer edition (no build-time define); this file swaps in the
// enterprise edition to cover what it removes.
vi.mock('@/edition', () => ({ APP_EDITION: 'enterprise', IS_ENTERPRISE: true, resolveEdition: () => 'enterprise' }));

describe('enterprise edition', () => {
  it('leaves the Buy Me a Coffee link off the home panel and labels the version', () => {
    const wrapper = mount(HomePanel, { props: { theme: 'dark', version: '1.2.3' } });

    expect(wrapper.text()).not.toContain('Buy Me a Coffee');
    expect(wrapper.find('a[href*="ko-fi.com"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('View on GitHub');
    expect(wrapper.find('.home-panel__version').text()).toBe('v1.2.3 Enterprise');
  });

  it('labels the version in the sidebar footer', () => {
    const wrapper = mount(AppSidebar, {
      props: { tools: [], selectedToolId: null, version: '1.2.3', attributionsToolId: 'attributions', settingsToolId: 'settings', pinnedToolIds: [] },
    });

    expect(wrapper.find('.sidebar__footer').text()).toContain('v1.2.3 Enterprise');
  });

  it('hides the Updates section in Settings', () => {
    const wrapper = mount(Settings, {
      props: {
        themeMode: 'system',
        isElectron: true,
        settingsPath: '/tmp/settings.json',
        isCustomSettingsLocation: false,
        settingsLocationWarning: '',
        rememberToolInput: 'never',
        hasSavedToolData: false,
        settings: { ...DEFAULT_SETTINGS },
      },
    });

    expect(wrapper.text()).not.toContain('Automatically check for updates');
    expect(wrapper.text()).toContain('Settings File');
  });

  it('leaves Check for Updates out of the Windows Help menu', async () => {
    const wrapper = mount(CustomTitleBar, { props: { themeMode: 'dark', theme: 'dark' } });
    await wrapper.findAll('.app-titlebar__menu-button').find((button) => button.text() === 'Help')?.trigger('click');

    const dropdown = wrapper.find('.app-titlebar__dropdown');
    expect(dropdown.text()).toContain('About');
    expect(dropdown.text()).not.toContain('Check for Updates');
  });
});
