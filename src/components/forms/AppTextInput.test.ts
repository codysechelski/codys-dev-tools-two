import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AppTextInput from './AppTextInput.vue';

describe('AppTextInput', () => {
  it('emits input values', async () => {
    const wrapper = mount(AppTextInput, {
      props: {
        modelValue: '5',
        label: 'Count',
        type: 'number',
      },
    });

    await wrapper.find('input').setValue('10');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['10']);
  });

  it('renders optional help text in a popover', () => {
    const wrapper = mount(AppTextInput, {
      props: {
        modelValue: '',
        label: 'Count',
        description: 'Between 1 and 100.',
      },
    });

    expect(wrapper.find('[role="tooltip"]').text()).toBe('Between 1 and 100.');
  });

  it('supports multiline input', async () => {
    const wrapper = mount(AppTextInput, {
      props: {
        modelValue: 'line 1',
        label: 'Address',
        multiline: true,
      },
    });

    await wrapper.find('textarea').setValue('line 1\nline 2');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['line 1\nline 2']);
  });

  it('passes placeholder text to text inputs', () => {
    const wrapper = mount(AppTextInput, {
      props: {
        modelValue: '',
        label: 'Search',
        placeholder: 'Search by name',
      },
    });

    expect(wrapper.find('input').attributes('placeholder')).toBe('Search by name');
  });

  it('shows errors only after blur and clears them on input', async () => {
    const wrapper = mount(AppTextInput, {
      props: {
        modelValue: '',
        label: 'URL',
        error: 'Enter a valid URL.',
      },
    });

    expect(wrapper.text()).not.toContain('Enter a valid URL.');

    await wrapper.find('input').trigger('blur');
    expect(wrapper.text()).toContain('Enter a valid URL.');

    await wrapper.find('input').setValue('https://example.com');
    expect(wrapper.text()).not.toContain('Enter a valid URL.');
  });

  it('renders a leading icon by default', () => {
    const wrapper = mount(AppTextInput, {
      props: {
        modelValue: '',
        label: 'Search',
        icon: 'search',
      },
    });

    expect(wrapper.find('.form-text-input__control--icon-start .form-text-input__icon').exists()).toBe(true);
  });

  it('renders a trailing icon when iconPosition is end', () => {
    const wrapper = mount(AppTextInput, {
      props: {
        modelValue: '',
        label: 'Search',
        icon: 'search',
        iconPosition: 'end',
      },
    });

    expect(wrapper.find('.form-text-input__control--icon-end .form-text-input__icon').exists()).toBe(true);
    expect(wrapper.find('.form-text-input__control--icon-start').exists()).toBe(false);
  });

  it('omits the icon wrapper class when no icon is given', () => {
    const wrapper = mount(AppTextInput, {
      props: {
        modelValue: '',
        label: 'Search',
      },
    });

    expect(wrapper.find('.form-text-input__icon').exists()).toBe(false);
  });

  it('filters and transforms phone input', async () => {
    const wrapper = mount(AppTextInput, {
      props: {
        modelValue: '',
        label: 'Phone',
        type: 'tel',
        filter: 'phone',
        transformInput: (value: string) => value.replace(/\D/g, '').replace(/^(\d{3})(\d{3})(\d+)$/, '$1-$2-$3'),
      },
    });

    await wrapper.find('input').trigger('beforeinput', { data: 'a', inputType: 'insertText' });
    await wrapper.find('input').setValue('555abc5551212');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['555-555-1212']);
  });
});
