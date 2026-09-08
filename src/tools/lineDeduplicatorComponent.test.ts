import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import { isToolStateReady, resetToolStateForTests, toolStateMode } from '@/toolState';
import LineDeduplicator from './LineDeduplicator.vue';

describe('LineDeduplicator', () => {
  it('renders the input editor and lists duplicate lines', () => {
    const wrapper = mount(LineDeduplicator);
    const editor = wrapper.findComponent(TextEditor);
    editor.vm.$emit('update:modelValue', 'apple\nbanana\napple');

    return wrapper.vm.$nextTick().then(() => {
      expect(editor.exists()).toBe(true);
      expect(wrapper.text()).toContain('Duplicate Lines');
      expect(wrapper.text()).toContain('apple');

      const lineLinks = wrapper.findAll('.line-tool-duplicate__line-link').map((link) => link.text());
      expect(lineLinks).toEqual(['1', '3']);
    });
  });

  it('jumps the editor cursor to a line when its line-number link is clicked', async () => {
    const wrapper = mount(LineDeduplicator, { attachTo: document.body });
    const editor = wrapper.findComponent(TextEditor);
    editor.vm.$emit('update:modelValue', 'apple\nbanana\napple');
    await wrapper.vm.$nextTick();

    const lineLink = wrapper.findAll('.line-tool-duplicate__line-link').find((link) => link.text() === '3');
    await lineLink?.trigger('click');

    expect(document.activeElement).toBe(wrapper.find('.cm-content').element);
    wrapper.unmount();
  });

  it('removes all duplicate lines when the header button is clicked', async () => {
    const wrapper = mount(LineDeduplicator);
    const editor = wrapper.findComponent(TextEditor);
    editor.vm.$emit('update:modelValue', 'apple\nbanana\napple');
    await wrapper.vm.$nextTick();

    const removeButton = wrapper.findAll('button').find((button) => button.text() === 'Remove All Duplicates');
    await removeButton?.trigger('click');

    expect(wrapper.findComponent(TextEditor).props('modelValue')).toBe('apple\nbanana');
  });

  it('removes duplicates for a single line via its row button', async () => {
    const wrapper = mount(LineDeduplicator);
    const editor = wrapper.findComponent(TextEditor);
    editor.vm.$emit('update:modelValue', 'apple\nbanana\napple\nbanana');
    await wrapper.vm.$nextTick();

    const rowRemoveButton = wrapper.findAll('button').find((button) => button.attributes('aria-label') === 'Remove duplicates of apple');
    await rowRemoveButton?.trigger('click');

    expect(wrapper.findComponent(TextEditor).props('modelValue')).toBe('apple\nbanana\nbanana');
  });

  it('sorts lines when the sort button is clicked', async () => {
    const wrapper = mount(LineDeduplicator);
    const editor = wrapper.findComponent(TextEditor);
    editor.vm.$emit('update:modelValue', 'banana\napple\ncherry');
    await wrapper.vm.$nextTick();

    const sortButton = wrapper.findAll('button').find((button) => button.text() === 'Sort Lines');
    await sortButton?.trigger('click');

    expect(wrapper.findComponent(TextEditor).props('modelValue')).toBe('apple\nbanana\ncherry');
  });
});

describe('LineDeduplicator tool state persistence', () => {
  afterEach(() => {
    resetToolStateForTests();
  });

  it('restores the input text and reactive options object in forever mode', async () => {
    toolStateMode.value = 'forever';
    isToolStateReady.value = true;

    const first = mount(LineDeduplicator);
    const firstEditor = first.findComponent(TextEditor);
    firstEditor.vm.$emit('update:modelValue', 'zebra\napple');
    await first.vm.$nextTick();
    const caseToggle = first.find('button[role="switch"]');
    const initialChecked = caseToggle.attributes('aria-checked');
    await caseToggle.trigger('click');
    first.unmount();

    const second = mount(LineDeduplicator);
    expect(second.findComponent(TextEditor).props('modelValue')).toBe('zebra\napple');
    expect(second.find('button[role="switch"]').attributes('aria-checked')).toBe(initialChecked === 'true' ? 'false' : 'true');
  });
});
