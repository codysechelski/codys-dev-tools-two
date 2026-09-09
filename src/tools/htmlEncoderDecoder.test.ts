import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import HtmlEncoderDecoder from './HtmlEncoderDecoder.vue';

describe('HtmlEncoderDecoder', () => {
  it('renders options and editors', () => {
    const wrapper = mount(HtmlEncoderDecoder);

    expect(wrapper.text()).toContain('Mode');
    expect(wrapper.text()).toContain('Encode all characters');
    expect(wrapper.findAllComponents(TextEditor)).toHaveLength(2);
    expect(wrapper.findAllComponents(TextEditor)[0].props('language')).toBe('html');
    expect(wrapper.findAllComponents(TextEditor)[1].props('language')).toBe('text');
  });

  it('switches to decode mode', async () => {
    const wrapper = mount(HtmlEncoderDecoder);

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="decode"]').trigger('click');

    expect(wrapper.text()).not.toContain('Encode all characters');
    expect(wrapper.findAllComponents(TextEditor)[1].props('modelValue')).toContain('<p');
    expect(wrapper.findAllComponents(TextEditor)[0].props('language')).toBe('text');
    expect(wrapper.findAllComponents(TextEditor)[1].props('language')).toBe('html');
  });

  it('flips the mode and swaps the output into the input when the swap button is clicked', async () => {
    const wrapper = mount(HtmlEncoderDecoder);
    const editors = wrapper.findAllComponents(TextEditor);

    await editors[0].vm.$emit('update:modelValue', '<p>a & b</p>');
    await nextTick();
    const encoded = wrapper.findAllComponents(TextEditor)[1].props('modelValue') as string;

    await wrapper.find('[aria-label="Swap input and output"]').trigger('click');
    await nextTick();

    expect(wrapper.find('[role="combobox"]').text()).toContain('Decode');
    expect(wrapper.findAllComponents(TextEditor)[0].props('modelValue')).toBe(encoded);
  });

  it('only flips the mode when there is no output to swap in', async () => {
    const wrapper = mount(HtmlEncoderDecoder);
    const editors = wrapper.findAllComponents(TextEditor);

    await editors[0].vm.$emit('update:modelValue', '');
    await nextTick();

    await wrapper.find('[aria-label="Swap input and output"]').trigger('click');
    await nextTick();

    expect(wrapper.find('[role="combobox"]').text()).toContain('Decode');
    expect(wrapper.findAllComponents(TextEditor)[0].props('modelValue')).toBe('');
  });
});
