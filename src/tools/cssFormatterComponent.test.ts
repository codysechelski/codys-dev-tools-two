import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import CssFormatter from './CssFormatter.vue';

describe('CssFormatter', () => {
  it('renders two text editors and formatter options', () => {
    const wrapper = mount(CssFormatter);

    expect(wrapper.findAllComponents(TextEditor)).toHaveLength(2);
    expect(wrapper.text()).toContain('Output');
    expect(wrapper.text()).toContain('Expanded');
    expect(wrapper.text()).toContain('Indent');
    expect(wrapper.text()).toContain('Sort declarations');
    expect(wrapper.text()).toContain('Preserve comments');
    expect(wrapper.find('.formatter-tool__status-slot .formatter-tool__status').text()).toBe('Valid CSS');
  });

  it('compresses CSS when selected', async () => {
    const wrapper = mount(CssFormatter);

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="compressed"]').trigger('click');

    expect(wrapper.findAllComponents(TextEditor)[1].props('modelValue')).toContain('.card{display:grid');
  });

  it('sorts declarations when the toggle is clicked', async () => {
    const wrapper = mount(CssFormatter);

    wrapper.findComponent(TextEditor).vm.$emit('update:modelValue', '.card{z-index:1;color:red;background:blue;}');
    await nextTick();
    await wrapper.find('button[role="switch"]').trigger('click');
    await nextTick();

    const output = wrapper.findAllComponents(TextEditor)[1].props('modelValue') as string;
    expect(output.indexOf('background: blue')).toBeLessThan(output.indexOf('color: red'));
  });

  it('opens a modal with parse details for invalid CSS', async () => {
    const wrapper = mount(CssFormatter, { attachTo: document.body });

    wrapper.findComponent(TextEditor).vm.$emit('update:modelValue', '.card { color: red;');
    await nextTick();

    expect(wrapper.find('.formatter-tool__status--error').text()).toBe('Invalid - Click for details');
    await wrapper.find('.formatter-tool__status--error').trigger('click');
    await nextTick();

    expect(document.body.textContent).toContain('Invalid CSS');
    expect(document.body.textContent).toContain('Missing closing brace.');

    wrapper.unmount();
  });
});
