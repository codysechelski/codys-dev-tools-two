import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import HomePanel from './HomePanel.vue';

describe('HomePanel', () => {
  it('shows the dark-background logo in dark mode', () => {
    const wrapper = mount(HomePanel, { props: { theme: 'dark', version: '0.20.3' } });

    expect(wrapper.find('img').attributes('src')).toContain('logo-dark-bg');
  });

  it('shows the light-background logo in light mode', () => {
    const wrapper = mount(HomePanel, { props: { theme: 'light', version: '0.20.3' } });

    expect(wrapper.find('img').attributes('src')).toContain('logo-light-bg');
  });

  it('shows the version and getting-started hint', () => {
    const wrapper = mount(HomePanel, { props: { theme: 'dark', version: '0.20.3' } });

    expect(wrapper.text()).toContain('v0.20.3');
    expect(wrapper.text()).toContain('Select a tool from the sidebar to get started.');
  });

  it('links to the GitHub repo in a new tab', () => {
    const wrapper = mount(HomePanel, { props: { theme: 'dark', version: '0.20.3' } });
    const link = wrapper.find('a');

    expect(link.attributes('href')).toBe('https://github.com/codysechelski/codys-dev-tools-two');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toContain('noopener');
    expect(link.text()).toContain('View on GitHub');
  });
});
