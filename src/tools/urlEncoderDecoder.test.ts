import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import UrlEncoderDecoder from './UrlEncoderDecoder.vue';

describe('UrlEncoderDecoder', () => {
  it('renders options and editors', () => {
    const wrapper = mount(UrlEncoderDecoder);

    expect(wrapper.text()).toContain('Mode');
    expect(wrapper.text()).toContain('URL component');
    expect(wrapper.text()).toContain('Form spaces (+)');
    expect(wrapper.text()).toContain('RFC 3986');
    expect(wrapper.findAllComponents(TextEditor)).toHaveLength(2);
  });

  it('hides RFC 3986 for decode mode', async () => {
    const wrapper = mount(UrlEncoderDecoder);

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="decode"]').trigger('click');

    expect(wrapper.text()).not.toContain('RFC 3986');
  });

  it('flips the mode and swaps the output into the input when the swap button is clicked', async () => {
    const wrapper = mount(UrlEncoderDecoder);
    const editors = wrapper.findAllComponents(TextEditor);

    await editors[0].vm.$emit('update:modelValue', 'a b');
    await nextTick();
    const encoded = wrapper.findAllComponents(TextEditor)[1].props('modelValue') as string;

    await wrapper.find('[aria-label="Swap input and output"]').trigger('click');
    await nextTick();

    expect(wrapper.find('[role="combobox"]').text()).toContain('Decode');
    expect(wrapper.findAllComponents(TextEditor)[0].props('modelValue')).toBe(encoded);
  });

  it('only flips the mode when there is no output to swap in', async () => {
    const wrapper = mount(UrlEncoderDecoder);
    const editors = wrapper.findAllComponents(TextEditor);

    await editors[0].vm.$emit('update:modelValue', '');
    await nextTick();

    await wrapper.find('[aria-label="Swap input and output"]').trigger('click');
    await nextTick();

    expect(wrapper.find('[role="combobox"]').text()).toContain('Decode');
    expect(wrapper.findAllComponents(TextEditor)[0].props('modelValue')).toBe('');
  });
});
