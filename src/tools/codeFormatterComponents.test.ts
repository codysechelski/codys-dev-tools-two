import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import HtmlFormatter from './HtmlFormatter.vue';
import JavaScriptFormatter from './JavaScriptFormatter.vue';
import LuaFormatter from './LuaFormatter.vue';
import PythonFormatter from './PythonFormatter.vue';

describe('code formatter tools', () => {
  it('renders JavaScript editors with JavaScript syntax mode', () => {
    const wrapper = mount(JavaScriptFormatter);
    const editors = wrapper.findAllComponents(TextEditor);

    expect(wrapper.text()).toContain('Valid JavaScript');
    expect(wrapper.text()).toContain('Semicolons');
    expect(wrapper.text()).toContain('Quote style');
    expect(wrapper.text()).toContain('Trailing commas');
    expect(editors).toHaveLength(2);
    expect(editors[0].props('language')).toBe('javascript');
    expect(editors[1].props('language')).toBe('javascript');
  });

  it('renders HTML editors with HTML syntax mode', () => {
    const wrapper = mount(HtmlFormatter);
    const editors = wrapper.findAllComponents(TextEditor);

    expect(wrapper.text()).toContain('Valid HTML');
    expect(wrapper.text()).toContain('Void tags');
    expect(wrapper.text()).toContain('Wrap text nodes');
    expect(wrapper.text()).toContain('Collapse whitespace');
    expect(editors[0].props('language')).toBe('html');
    expect(editors[1].props('language')).toBe('html');
  });

  it('renders Python editors with Python syntax mode', () => {
    const wrapper = mount(PythonFormatter);
    const editors = wrapper.findAllComponents(TextEditor);
    const selects = wrapper.findAll('[role="combobox"]');

    expect(wrapper.text()).toContain('Valid Python');
    expect(selects).toHaveLength(1);
    expect(selects[0].attributes('aria-label')).toBe('Indent');
    expect(wrapper.text()).toContain('Preserve blank lines');
    expect(wrapper.text()).toContain('Normalize indentation');
    expect(editors[0].props('language')).toBe('python');
    expect(editors[1].props('language')).toBe('python');
  });

  it('renders Lua editors with Lua syntax mode', () => {
    const wrapper = mount(LuaFormatter);
    const editors = wrapper.findAllComponents(TextEditor);
    const selects = wrapper.findAll('[role="combobox"]');

    expect(wrapper.text()).toContain('Valid Lua');
    expect(selects).toHaveLength(1);
    expect(selects[0].attributes('aria-label')).toBe('Indent');
    expect(wrapper.text()).toContain('Preserve blank lines');
    expect(wrapper.text()).toContain('Normalize indentation');
    expect(editors[0].props('language')).toBe('lua');
    expect(editors[1].props('language')).toBe('lua');
  });
});
