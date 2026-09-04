import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import JsonYamlConverter from './JsonYamlConverter.vue';

describe('JsonYamlConverter', () => {
  it('renders mode/options and two editors', () => {
    const wrapper = mount(JsonYamlConverter);

    expect(wrapper.text()).toContain('Mode');
    expect(wrapper.text()).toContain('YAML width');
    expect(wrapper.text()).toContain('Sort keys');
    expect(wrapper.findAllComponents(TextEditor)).toHaveLength(2);
  });

  it('switches to JSON indentation options for YAML to JSON', async () => {
    const wrapper = mount(JsonYamlConverter);

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="yaml-to-json"]').trigger('click');

    expect(wrapper.text()).toContain('JSON indent');
    expect(wrapper.text()).not.toContain('YAML width');
  });

  it('flips the mode and swaps the output into the input when the swap button is clicked', async () => {
    const wrapper = mount(JsonYamlConverter);
    const editors = wrapper.findAllComponents(TextEditor);

    await editors[0].vm.$emit('update:modelValue', '{"a":1}');
    await nextTick();
    const convertedYaml = wrapper.findAllComponents(TextEditor)[1].props('modelValue') as string;

    await wrapper.find('[aria-label="Swap input and output"]').trigger('click');
    await nextTick();

    expect(wrapper.find('[role="combobox"]').text()).toContain('YAML to JSON');
    expect(wrapper.findAllComponents(TextEditor)[0].props('modelValue')).toBe(convertedYaml);
  });

  it('only flips the mode when there is no output to swap in', async () => {
    const wrapper = mount(JsonYamlConverter);
    const editors = wrapper.findAllComponents(TextEditor);

    await editors[0].vm.$emit('update:modelValue', '');
    await nextTick();

    await wrapper.find('[aria-label="Swap input and output"]').trigger('click');
    await nextTick();

    expect(wrapper.find('[role="combobox"]').text()).toContain('YAML to JSON');
    expect(wrapper.findAllComponents(TextEditor)[0].props('modelValue')).toBe('');
  });
});
