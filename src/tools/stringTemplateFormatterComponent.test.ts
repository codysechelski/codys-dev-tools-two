import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import StringTemplateFormatter from './StringTemplateFormatter.vue';

describe('StringTemplateFormatter', () => {
  it('renders controls and editors', () => {
    const wrapper = mount(StringTemplateFormatter);

    expect(wrapper.text()).toContain('Delimiter');
    expect(wrapper.text()).toContain('Line ending');
    expect(wrapper.text()).toContain('Static Text Before');
    expect(wrapper.text()).toContain('Join With');
    expect(wrapper.findAllComponents(TextEditor)).toHaveLength(3);
  });

  it('updates output automatically from input options', async () => {
    const wrapper = mount(StringTemplateFormatter);
    const editors = wrapper.findAllComponents(TextEditor);

    await editors[0].vm.$emit('update:modelValue', '<option value="{1}">{0}</option>');
    await editors[1].vm.$emit('update:modelValue', 'Texas,TX');

    expect(wrapper.findAllComponents(TextEditor)[2].props('modelValue')).toBe('<option value="TX">Texas</option>');
  });

  it('auto-detects clear input delimiters', async () => {
    const wrapper = mount(StringTemplateFormatter);
    const editors = wrapper.findAllComponents(TextEditor);

    await editors[1].vm.$emit('update:modelValue', 'Texas\tTX\nOhio\tOH');

    expect(wrapper.find('[role="combobox"]').text()).toContain('Tab');
    expect(wrapper.text()).toContain('AUTO');
  });
});
