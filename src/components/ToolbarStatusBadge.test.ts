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

    expect(wrapper.find('p.formatter-tool__status').exists()).toBe(true);
    expect(wrapper.classes()).not.toContain('formatter-tool__status--error');
    expect(wrapper.text()).toBe('Valid JSON');
    expect(wrapper.find('.app-icon').exists()).toBe(true);
  });

  it('always shows a generic message for an error badge and opens a modal with the detail on click', async () => {
    const wrapper = mount(ToolbarStatusBadge, {
      attachTo: document.body,
      props: {
        variant: 'error',
        label: 'Unexpected token at position 4',
      },
    });
    const badge = wrapper.find('button.formatter-tool__status--error');

    expect(badge.exists()).toBe(true);
    expect(badge.text()).toBe('Error - click for details');
    expect(document.body.textContent).not.toContain('Unexpected token at position 4');

    await badge.trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(document.body.textContent).toContain('Error Details');
    expect(document.body.textContent).toContain('Unexpected token at position 4');

    wrapper.unmount();
  });

  it('becomes a button automatically for an error badge even without the button prop', () => {
    const wrapper = mount(ToolbarStatusBadge, {
      props: {
        variant: 'error',
        label: 'Something went wrong',
      },
    });

    expect(wrapper.find('button.formatter-tool__status--error').exists()).toBe(true);
  });

  it('always shows a generic message for a warning badge and opens a modal with the detail on click', async () => {
    const wrapper = mount(ToolbarStatusBadge, {
      attachTo: document.body,
      props: {
        variant: 'warning',
        label: 'Placeholder {3} is out of range.',
      },
    });
    const badge = wrapper.find('button.formatter-tool__status--warning');

    expect(badge.exists()).toBe(true);
    expect(badge.text()).toBe('Warning - click for details');
    expect(document.body.textContent).not.toContain('Placeholder {3} is out of range.');

    await badge.trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(document.body.textContent).toContain('Warning Details');
    expect(document.body.textContent).toContain('Placeholder {3} is out of range.');

    wrapper.unmount();
  });

  it('becomes a button automatically for a warning badge even without the button prop', () => {
    const wrapper = mount(ToolbarStatusBadge, {
      props: {
        variant: 'warning',
        label: 'Something needs attention',
      },
    });

    expect(wrapper.find('button.formatter-tool__status--warning').exists()).toBe(true);
  });
});
