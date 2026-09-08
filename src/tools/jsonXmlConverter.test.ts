import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import JsonXmlConverter from './JsonXmlConverter.vue';

describe('JsonXmlConverter', () => {
  it('renders mode/options and two editors', () => {
    const wrapper = mount(JsonXmlConverter);

    expect(wrapper.text()).toContain('Mode');
    expect(wrapper.text()).toContain('Root element');
    expect(wrapper.text()).toContain('Include attributes');
    expect(wrapper.text()).toContain('Sort keys');
    expect(wrapper.findAllComponents(TextEditor)).toHaveLength(2);
  });

  it('hides the root element field for XML to JSON', async () => {
    const wrapper = mount(JsonXmlConverter);

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="xml-to-json"]').trigger('click');

    expect(wrapper.text()).not.toContain('Root element');
  });

  it('flips the mode and swaps the output into the input when the swap button is clicked', async () => {
    const wrapper = mount(JsonXmlConverter);
    const editors = wrapper.findAllComponents(TextEditor);

    await editors[0].vm.$emit('update:modelValue', '{"a":1}');
    await nextTick();
    const convertedXml = wrapper.findAllComponents(TextEditor)[1].props('modelValue') as string;

    await wrapper.find('[aria-label="Swap input and output"]').trigger('click');
    await nextTick();

    expect(wrapper.find('[role="combobox"]').text()).toContain('XML to JSON');
    expect(wrapper.findAllComponents(TextEditor)[0].props('modelValue')).toBe(convertedXml);
  });

  it('only flips the mode when there is no output to swap in', async () => {
    const wrapper = mount(JsonXmlConverter);
    const editors = wrapper.findAllComponents(TextEditor);

    await editors[0].vm.$emit('update:modelValue', '');
    await nextTick();

    await wrapper.find('[aria-label="Swap input and output"]').trigger('click');
    await nextTick();

    expect(wrapper.find('[role="combobox"]').text()).toContain('XML to JSON');
    expect(wrapper.findAllComponents(TextEditor)[0].props('modelValue')).toBe('');
  });
});
