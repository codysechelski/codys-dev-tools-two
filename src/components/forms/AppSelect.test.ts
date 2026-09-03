import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AppSelect from './AppSelect.vue';

describe('AppSelect', () => {
  it('emits selected values', async () => {
    const wrapper = mount(AppSelect, {
      props: {
        modelValue: 'formatted',
        label: 'Output',
        description: 'Choose output style.',
        options: [
          { label: 'Format', value: 'formatted' },
          { label: 'Minify', value: 'compact' },
        ],
      },
    });

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="compact"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['compact']);
  });

  it('supports keyboard selection', async () => {
    const wrapper = mount(AppSelect, {
      props: {
        modelValue: 'formatted',
        label: 'Output',
        options: [
          { label: 'Format', value: 'formatted' },
          { label: 'Minify', value: 'compact' },
        ],
      },
    });

    await wrapper.find('[role="combobox"]').trigger('keydown', { key: 'ArrowDown' });
    await wrapper.find('[role="combobox"]').trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['compact']);
  });

  it('filters options when typing with the menu open', async () => {
    const wrapper = mount(AppSelect, {
      props: {
        modelValue: 'formatted',
        label: 'Output',
        options: [
          { label: 'Format', value: 'formatted' },
          { label: 'Minify', value: 'compact' },
          { label: 'Newline JSON', value: 'newline-delimited' },
        ],
      },
    });

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[role="combobox"]').trigger('keydown', { key: 'n' });

    expect(wrapper.find('.form-select__search-hint').text()).toBe('n');
    expect(wrapper.findAll('[role="option"]')).toHaveLength(2);
    expect(wrapper.findAll('[role="option"]')[0].text()).toBe('Minify');
  });

  it('selects the active filtered option with Enter', async () => {
    const wrapper = mount(AppSelect, {
      props: {
        modelValue: 'formatted',
        label: 'Output',
        options: [
          { label: 'Format', value: 'formatted' },
          { label: 'Minify', value: 'compact' },
          { label: 'Newline JSON', value: 'newline-delimited' },
        ],
      },
    });

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[role="combobox"]').trigger('keydown', { key: 'n' });
    await wrapper.find('[role="combobox"]').trigger('keydown', { key: 'e' });
    await wrapper.find('[role="combobox"]').trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['newline-delimited']);
  });

  it('shows an empty state when typed filters have no matches', async () => {
    const wrapper = mount(AppSelect, {
      props: {
        modelValue: 'formatted',
        label: 'Output',
        options: [{ label: 'Format', value: 'formatted' }],
      },
    });

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[role="combobox"]').trigger('keydown', { key: 'z' });

    expect(wrapper.findAll('[role="option"]')).toHaveLength(0);
    expect(wrapper.find('.form-select__empty').text()).toBe('No matching options');
  });

  it('displays unmatched model values', () => {
    const wrapper = mount(AppSelect, {
      props: {
        modelValue: '*/2',
        label: 'Day',
        options: [{ label: 'Every day', value: '*' }],
      },
    });

    expect(wrapper.find('[role="combobox"]').text()).toContain('*/2');
  });

  it('opens above when there is not enough room below', async () => {
    const wrapper = mount(AppSelect, {
      props: {
        modelValue: 'a',
        label: 'Position',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
          { label: 'C', value: 'c' },
          { label: 'D', value: 'd' },
        ],
      },
    });

    Object.defineProperty(wrapper.element, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ top: 500, bottom: 545, left: 0, right: 200, width: 200, height: 45 }),
    });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 560 });

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.classes()).toContain('form-select--above');
  });

  it('renders descriptive text in a help popover', () => {
    const wrapper = mount(AppSelect, {
      props: {
        modelValue: 'formatted',
        label: 'Output',
        description: 'Choose output style.',
        options: [{ label: 'Format', value: 'formatted' }],
      },
    });

    expect(wrapper.find('.form-control__label-row').exists()).toBe(true);
    expect(wrapper.find('[role="tooltip"]').text()).toBe('Choose output style.');
  });
});
