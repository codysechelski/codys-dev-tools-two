import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
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

  it('flips the toolbar badge to a warning and blanks out-of-range placeholders', async () => {
    const wrapper = mount(StringTemplateFormatter, { attachTo: document.body });
    const editors = wrapper.findAllComponents(TextEditor);

    await editors[0].vm.$emit('update:modelValue', "The number {0} is spelled '{1}' ({2})");
    await nextTick();

    const badge = wrapper.find('.formatter-tool__status--warning');
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toBe('Warning - click for details');
    expect(wrapper.findAllComponents(TextEditor)[2].props('modelValue')).toBe("The number 1 is spelled 'one' ()\nThe number 2 is spelled 'two' ()");

    await badge.trigger('click');
    await nextTick();

    expect(document.body.textContent).toContain('Warning Details');
    expect(document.body.textContent).toContain('out of range');

    wrapper.unmount();
  });
});
