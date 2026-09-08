import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Attributions from './Attributions.vue';

describe('Attributions', () => {
  it('renders a card for every attributed package', () => {
    const wrapper = mount(Attributions);
    const names = wrapper.findAll('.app-card__heading').map((node) => node.text());

    expect(names).toContain('Vue');
    expect(names).toContain('Electron');
    expect(names).toContain('CodeMirror');
    expect(names).toContain('Font Awesome Free');
    expect(names).toContain('Ubuntu Font Family');
  });

  it('sorts the cards alphabetically, case-insensitively', () => {
    const wrapper = mount(Attributions);
    const names = wrapper.findAll('.app-card__heading').map((node) => node.text());
    const sorted = [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    expect(names).toEqual(sorted);
  });

  it('links each card to its source, using the matching host icon', () => {
    const wrapper = mount(Attributions);
    const links = wrapper.findAll('.attribution-list__link');

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.attributes('href')).toMatch(/^https:\/\//);
      expect(link.attributes('target')).toBe('_blank');
      expect(link.attributes('rel')).toContain('noopener');
      expect(link.find('svg').exists()).toBe(true);
    }
  });
});
