import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AppToggle from './AppToggle.vue';

describe('AppToggle', () => {
  it('emits boolean changes', async () => {
    const wrapper = mount(AppToggle, {
      props: {
        modelValue: false,
        label: 'Sort keys',
      },
    });

    await wrapper.find('button[role="switch"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
  });

  it('uses switch semantics', () => {
    const wrapper = mount(AppToggle, {
      props: {
        modelValue: true,
        label: 'Sort keys',
      },
    });

    expect(wrapper.find('button[role="switch"]').attributes('aria-checked')).toBe('true');
    expect(wrapper.find('button[role="switch"]').classes()).toContain('form-toggle__control--checked');
  });

  it('renders descriptive text in a help popover instead of inline helper text', () => {
    const wrapper = mount(AppToggle, {
      props: {
        modelValue: false,
        label: 'Sort keys',
        description: 'Alphabetize object keys recursively.',
      },
    });

    expect(wrapper.find('.form-control__label-row').exists()).toBe(true);
    expect(wrapper.find('[role="tooltip"]').text()).toBe('Alphabetize object keys recursively.');
    expect(wrapper.find('small').exists()).toBe(false);
  });
});
