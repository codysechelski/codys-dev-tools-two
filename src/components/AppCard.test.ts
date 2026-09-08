import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AppCard from './AppCard.vue';

describe('AppCard', () => {
  it('renders the heading, subheading, and body slot content', () => {
    const wrapper = mount(AppCard, {
      props: { heading: 'CodeMirror', subheading: 'MIT License' },
      slots: { default: '<p>Powers the editor.</p>' },
    });

    expect(wrapper.find('.app-card__heading').text()).toBe('CodeMirror');
    expect(wrapper.find('.app-card__subheading').text()).toBe('MIT License');
    expect(wrapper.find('.app-card__body').text()).toBe('Powers the editor.');
  });

  it('omits the subheading and footer when not provided', () => {
    const wrapper = mount(AppCard, { props: { heading: 'CodeMirror' } });

    expect(wrapper.find('.app-card__subheading').exists()).toBe(false);
    expect(wrapper.find('.app-card__footer').exists()).toBe(false);
  });

  it('renders the footer slot when provided', () => {
    const wrapper = mount(AppCard, {
      props: { heading: 'CodeMirror' },
      slots: { footer: '<a href="https://example.com">View Repository</a>' },
    });

    expect(wrapper.find('.app-card__footer a').exists()).toBe(true);
  });
});
