import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import SqlFormatter from './SqlFormatter.vue';

describe('SqlFormatter', () => {
  it('renders the default example as valid and formats a nested SOQL subquery', () => {
    const wrapper = mount(SqlFormatter);

    expect(wrapper.text()).toContain('Valid SQL/SOQL');
    const editors = wrapper.findAllComponents(TextEditor);
    expect(editors[1].props('modelValue')).toContain('SELECT');
    expect(editors[1].props('modelValue')).toContain('(\n    SELECT');
  });

  it('shows an error badge for an unbalanced query', async () => {
    const wrapper = mount(SqlFormatter);

    await wrapper.findComponent(TextEditor).vm.$emit('update:modelValue', 'select id from account where (id = 1');

    expect(wrapper.text()).toContain('Error - click for details');
  });

  it('switches to minified output on a single line', async () => {
    const wrapper = mount(SqlFormatter);

    await wrapper.findComponent(TextEditor).vm.$emit('update:modelValue', 'select id, name from account');
    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="minified"]').trigger('click');

    const editors = wrapper.findAllComponents(TextEditor);
    expect(editors[1].props('modelValue')).toBe('SELECT id, name FROM account');
  });

  it('changes keyword case without touching identifiers', async () => {
    const wrapper = mount(SqlFormatter);

    await wrapper.findComponent(TextEditor).vm.$emit('update:modelValue', 'select AccountId from Contact');
    const selects = wrapper.findAll('[role="combobox"]');
    await selects[2].trigger('click');
    await wrapper.find('[data-value="lower"]').trigger('click');

    const editors = wrapper.findAllComponents(TextEditor);
    const output = editors[1].props('modelValue') as string;
    expect(output).toContain('select');
    expect(output).toContain('from');
    expect(output).toContain('AccountId');
    expect(output).toContain('Contact');
  });
});
