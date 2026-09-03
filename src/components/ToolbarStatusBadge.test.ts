import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ToolbarStatusBadge from './ToolbarStatusBadge.vue';

describe('ToolbarStatusBadge', () => {
  it('renders a success badge by default', () => {
    const wrapper = mount(ToolbarStatusBadge, {
      props: {
        label: 'Valid JSON',
      },
    });

    expect(wrapper.element.tagName).toBe('P');
    expect(wrapper.classes()).toContain('formatter-tool__status');
    expect(wrapper.classes()).not.toContain('formatter-tool__status--error');
    expect(wrapper.text()).toBe('Valid JSON');
    expect(wrapper.find('.app-icon').exists()).toBe(true);
  });

  it('can render a clickable error badge', async () => {
    const wrapper = mount(ToolbarStatusBadge, {
      props: {
        variant: 'error',
        label: 'Invalid - Click for details',
        button: true,
      },
    });

    await wrapper.trigger('click');

    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.classes()).toContain('formatter-tool__status--error');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
