import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ToolToolbar from './ToolToolbar.vue';

describe('ToolToolbar', () => {
  it('renders options in the default slot', () => {
    const wrapper = mount(ToolToolbar, {
      slots: {
        default: '<button>Option</button>',
      },
    });

    expect(wrapper.classes()).toContain('tool-options');
    expect(wrapper.classes()).toContain('tool-toolbar');
    expect(wrapper.find('.tool-toolbar__options').text()).toBe('Option');
    expect(wrapper.find('.tool-toolbar__badge').exists()).toBe(false);
  });

  it('renders an optional badge slot', () => {
    const wrapper = mount(ToolToolbar, {
      slots: {
        default: '<button>Option</button>',
        badge: '<button>Details</button>',
      },
    });

    expect(wrapper.find('.tool-toolbar__options').text()).toBe('Option');
    expect(wrapper.find('.tool-toolbar__badge').text()).toBe('Details');
    expect(wrapper.find('.tool-toolbar__badge').classes()).toContain('formatter-tool__status-slot');
  });
});
