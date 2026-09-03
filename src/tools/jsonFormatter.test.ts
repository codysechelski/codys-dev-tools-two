import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import JsonFormatter from './JsonFormatter.vue';

describe('JsonFormatter', () => {
  it('renders two text editors and formatter options', () => {
    const wrapper = mount(JsonFormatter);

    expect(wrapper.findAllComponents({ name: 'TextEditor' })).toHaveLength(2);
    expect(wrapper.text()).toContain('Output');
    expect(wrapper.text()).toContain('Indent');
    expect(wrapper.text()).toContain('Sort keys');
    expect(wrapper.findAll('[role="tooltip"]')).toHaveLength(1);
    expect(wrapper.find('button[role="switch"]').exists()).toBe(true);
    expect(wrapper.find('.formatter-tool__status-slot .formatter-tool__status').text()).toBe('Valid JSON');
    expect(wrapper.find('.formatter-tool__status-slot .app-icon').exists()).toBe(true);
  });

  it('keeps formatter options interactive', async () => {
    const wrapper = mount(JsonFormatter);
    const outputSelect = wrapper.findAll('[role="combobox"]')[0];

    await outputSelect.trigger('click');
    await wrapper.find('[data-value="compact"]').trigger('click');

    expect(wrapper.findAll('[role="combobox"]')[0].text()).toContain('Minify');
  });

  it('sorts output keys when the sort toggle is clicked', async () => {
    const wrapper = mount(JsonFormatter);

    wrapper.findComponent(TextEditor).vm.$emit('update:modelValue', '{"b":1,"a":2}');
    await nextTick();

    expect(wrapper.findAllComponents(TextEditor)[1].props('modelValue')).toContain('"b": 1');

    await wrapper.find('button[role="switch"]').trigger('click');
    await nextTick();

    const output = wrapper.findAllComponents(TextEditor)[1].props('modelValue') as string;

    expect(output.indexOf('"a": 2')).toBeLessThan(output.indexOf('"b": 1'));
  });

  it('opens a modal with parse details for invalid JSON', async () => {
    const wrapper = mount(JsonFormatter, {
      attachTo: document.body,
    });

    wrapper.findComponent(TextEditor).vm.$emit('update:modelValue', '{bad}');
    await nextTick();

    expect(wrapper.find('.formatter-tool__status--error').text()).toBe('Invalid - Click for details');
    expect(wrapper.find('.formatter-tool__status--error .app-icon').exists()).toBe(true);

    await wrapper.find('.formatter-tool__status--error').trigger('click');
    await nextTick();

    expect(document.body.textContent).toContain('Invalid JSON');
    expect(document.body.textContent).toContain('Error Details');

    wrapper.unmount();
  });
});
