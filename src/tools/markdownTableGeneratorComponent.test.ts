import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import MarkdownTableGenerator from './MarkdownTableGenerator.vue';

describe('MarkdownTableGenerator', () => {
  it('renders options and two editors, converting the default sample input', () => {
    const wrapper = mount(MarkdownTableGenerator);
    const editors = wrapper.findAllComponents(TextEditor);

    expect(wrapper.text()).toContain('Delimiter');
    expect(wrapper.text()).toContain('Alignment');
    expect(wrapper.text()).toContain('First row is header');
    expect(editors).toHaveLength(2);
    expect(editors[1].props('modelValue')).toContain('| Tool');
    expect(editors[1].props('modelValue')).toContain('Markdown Table Generator');
    expect((editors[1].props('modelValue') as string).split('\n')[1]).toMatch(/^\| -+ \| -+ \| -+ \|$/);
  });

  it('reformats pasted tab-separated data as a markdown table', async () => {
    const wrapper = mount(MarkdownTableGenerator);
    const inputEditor = wrapper.findAllComponents(TextEditor)[0];

    await inputEditor.vm.$emit('update:modelValue', 'Name\tAge\nAda\t36');
    await nextTick();

    const outputEditor = wrapper.findAllComponents(TextEditor)[1];
    expect(outputEditor.props('modelValue')).toBe('| Name | Age |\n| ---- | --- |\n| Ada  | 36  |');
    expect(wrapper.text()).toContain('detected tab');
  });

  it('shows a custom delimiter field only when Custom is selected', async () => {
    const wrapper = mount(MarkdownTableGenerator);

    expect(wrapper.text()).not.toContain('Custom delimiter');

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="custom"]').trigger('click');

    expect(wrapper.text()).toContain('Custom delimiter');
  });
});
