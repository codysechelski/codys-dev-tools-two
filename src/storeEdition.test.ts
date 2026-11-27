import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '@/settings';

// Every other test runs as the directly distributed consumer edition (no build-time define); this
// file swaps in each store distribution to cover what it removes.
const edition = vi.hoisted(() => ({
  APP_EDITION: 'consumer',
  IS_ENTERPRISE: false,
  APP_DISTRIBUTION: 'mas',
  IS_STORE_BUILD: true,
  CHECKS_FOR_UPDATES: false,
  SHOWS_DONATION_LINK: true,
}));
vi.mock('@/edition', () => edition);

async function mountHomePanel() {
  const { default: HomePanel } = await import('@/components/HomePanel.vue');
  return mount(HomePanel, { props: { theme: 'dark', version: '1.2.3' } });
}

async function mountSettings() {
  const { default: Settings } = await import('@/tools/Settings.vue');
  return mount(Settings, {
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
}

async function openHelpMenu() {
  const { default: CustomTitleBar } = await import('@/components/CustomTitleBar.vue');
  const wrapper = mount(CustomTitleBar, { props: { themeMode: 'dark', theme: 'dark' } });
  await wrapper.findAll('.app-titlebar__menu-button').find((button) => button.text() === 'Help')?.trigger('click');
  return wrapper.find('.app-titlebar__dropdown');
}

describe.each([
  { distribution: 'mas', showsDonationLink: false },
  { distribution: 'msstore', showsDonationLink: true },
])('$distribution store build', ({ distribution, showsDonationLink }) => {
  beforeEach(() => {
    vi.resetModules();
    edition.APP_DISTRIBUTION = distribution;
    edition.SHOWS_DONATION_LINK = showsDonationLink;
  });

  it(`${showsDonationLink ? 'keeps' : 'leaves off'} the Buy Me a Coffee link without an edition label`, async () => {
    const wrapper = await mountHomePanel();

    expect(wrapper.find('a[href*="ko-fi.com"]').exists()).toBe(showsDonationLink);
    expect(wrapper.text()).toContain('View on GitHub');
    expect(wrapper.find('.home-panel__version').text()).toBe('v1.2.3');
  });

  it('hides the Updates section in Settings', async () => {
    const wrapper = await mountSettings();

    expect(wrapper.text()).not.toContain('Automatically check for updates');
    expect(wrapper.text()).toContain('Settings File');
  });

  it('leaves Check for Updates out of the Windows Help menu', async () => {
    const dropdown = await openHelpMenu();

    expect(dropdown.text()).toContain('About');
    expect(dropdown.text()).not.toContain('Check for Updates');
  });
});
