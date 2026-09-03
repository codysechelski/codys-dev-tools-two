import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import JsonYamlConverter from './JsonYamlConverter.vue';

describe('JsonYamlConverter', () => {
  it('renders direction/options and two editors', () => {
    const wrapper = mount(JsonYamlConverter);

    expect(wrapper.text()).toContain('Direction');
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
});
