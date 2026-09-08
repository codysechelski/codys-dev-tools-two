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

  it('supports the field variant, which matches toolbar select styling', () => {
    const wrapper = mount(AppButton, {
      props: {
        variant: 'field',
      },
      slots: {
        default: 'Now',
      },
    });

    expect(wrapper.classes()).toContain('app-button--field');
  });

  it('does not add a size modifier class for the default normal size', () => {
    const wrapper = mount(AppButton, {
      slots: {
        default: 'Save',
      },
    });

    expect(wrapper.classes().some((className) => className.startsWith('app-button--size-'))).toBe(false);
  });

  it('supports xs, sm, lg, and xl size modifiers', () => {
    for (const size of ['xs', 'sm', 'lg', 'xl'] as const) {
      const wrapper = mount(AppButton, {
        props: { size },
        slots: { default: 'Save' },
      });

      expect(wrapper.classes()).toContain(`app-button--size-${size}`);
    }
  });
});
