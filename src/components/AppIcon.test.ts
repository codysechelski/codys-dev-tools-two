import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AppIcon from './AppIcon.vue';

describe('AppIcon', () => {
  it('renders the requested local icon', () => {
    const wrapper = mount(AppIcon, {
      props: {
        name: 'code',
      },
    });

    expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 640 512');
    expect(wrapper.find('path').attributes('d')).toBeTruthy();
  });
});
