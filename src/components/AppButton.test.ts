import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AppButton from './AppButton.vue';

describe('AppButton', () => {
  it('renders the selected variant and slot content', () => {
    const wrapper = mount(AppButton, {
      props: {
        variant: 'primary',
      },
      slots: {
        default: 'Save',
      },
    });

    expect(wrapper.classes()).toContain('app-button--primary');
    expect(wrapper.text()).toBe('Save');
  });

  it('supports disabled buttons', () => {
    const wrapper = mount(AppButton, {
      props: {
        disabled: true,
      },
    });

    expect(wrapper.attributes('disabled')).toBeDefined();
  });

  it('applies a compact square treatment for icon-only buttons', () => {
    const wrapper = mount(AppButton, {
      props: {
        icon: 'copy',
        iconOnly: true,
      },
    });

    expect(wrapper.classes()).toContain('app-button--icon-only');
  });
});
