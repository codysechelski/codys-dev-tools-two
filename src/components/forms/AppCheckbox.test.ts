import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AppCheckbox from './AppCheckbox.vue';

describe('AppCheckbox', () => {
  it('emits boolean changes', async () => {
    const wrapper = mount(AppCheckbox, {
      props: {
        modelValue: false,
        label: 'Sort keys',
      },
    });

    await wrapper.find('input').setValue(true);

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
  });

  it('renders descriptive text in a help popover', () => {
    const wrapper = mount(AppCheckbox, {
      props: {
        modelValue: false,
        label: 'Enabled',
        description: 'Turns the option on.',
      },
    });

    expect(wrapper.find('[role="tooltip"]').text()).toBe('Turns the option on.');
  });
});
