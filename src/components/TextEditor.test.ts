import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import TextEditor from './TextEditor.vue';

describe('TextEditor', () => {
  it('renders a CodeMirror editor with line numbers', () => {
    const wrapper = mount(TextEditor, {
      props: {
        modelValue: 'a\nb',
        label: 'Input',
        language: 'json',
      },
    });

    expect(wrapper.find('.cm-editor').exists()).toBe(true);
    expect(wrapper.find('.cm-gutters').exists()).toBe(true);
  });

  it('renders readonly editors as non-editable', () => {
    const wrapper = mount(TextEditor, {
      props: {
        modelValue: '{"a":1}',
        label: 'Output',
        readonly: true,
      },
    });

    expect(wrapper.classes()).toContain('text-editor--readonly');
    expect(wrapper.find('.cm-content').attributes('contenteditable')).toBe('false');
    expect(wrapper.text()).not.toContain('Clear');
  });

  it('clears editable editor contents from the toolbar', async () => {
    const wrapper = mount(TextEditor, {
      props: {
        modelValue: '{"a":1}',
        label: 'Input',
      },
    });

    await wrapper.findAll('button').find((button) => button.text() === 'Clear')?.trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['']);
  });

  it('copies the editor contents from the toolbar', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const wrapper = mount(TextEditor, {
      props: {
        modelValue: '{"a":1}',
        label: 'Output',
      },
    });

    const copyButton = wrapper.findAll('button').find((button) => button.text() === 'Copy');

    expect(copyButton?.find('.app-icon').exists()).toBe(true);
    await copyButton?.trigger('click');

    expect(writeText).toHaveBeenCalledWith('{"a":1}');
  });

  it('renders optional help text in a popover', () => {
    const wrapper = mount(TextEditor, {
      props: {
        modelValue: '',
        label: 'Format String',
        description: 'Use {0} for the first column.',
      },
    });

    expect(wrapper.find('.help-popover').exists()).toBe(true);
    expect(wrapper.text()).toContain('Use {0} for the first column.');
  });
});
