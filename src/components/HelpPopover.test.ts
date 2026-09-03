import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import HelpPopover from './HelpPopover.vue';

describe('HelpPopover', () => {
  it('renders an accessible help trigger and tooltip text', () => {
    const wrapper = mount(HelpPopover, {
      props: {
        text: 'Additional context',
        label: 'Output help',
      },
    });

    expect(wrapper.find('button').attributes('aria-label')).toBe('Output help');
    expect(wrapper.find('[role="tooltip"]').text()).toBe('Additional context');
  });
});
