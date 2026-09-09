import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import DiffTool from './DiffTool.vue';

describe('DiffTool', () => {
  it('highlights removed lines on the left and added lines on the right for the default example', () => {
    const wrapper = mount(DiffTool);
    const editors = wrapper.findAllComponents(TextEditor);

    expect(editors).toHaveLength(2);
    expect(editors[0].props('highlightLines')?.length).toBeGreaterThan(0);
    expect(editors[1].props('highlightLines')?.length).toBeGreaterThan(0);
    expect(editors[0].props('highlightLines')?.every((entry: { className: string }) => entry.className === 'cm-diff-line-removed')).toBe(true);
    expect(editors[1].props('highlightLines')?.every((entry: { className: string }) => entry.className === 'cm-diff-line-added')).toBe(true);
  });

  it('reports no differences and highlights nothing when both sides are identical', async () => {
    const wrapper = mount(DiffTool);
    const editors = wrapper.findAllComponents(TextEditor);

    await editors[0].vm.$emit('update:modelValue', 'same\ntext');
    await editors[1].vm.$emit('update:modelValue', 'same\ntext');

    expect(wrapper.text()).toContain('No differences');
    expect(editors[0].props('highlightLines')).toEqual([]);
    expect(editors[1].props('highlightLines')).toEqual([]);
    expect(editors[0].props('highlightRanges')).toEqual([]);
    expect(editors[1].props('highlightRanges')).toEqual([]);
  });

  it('highlights only the changed word within an edited line, using distinct word-level classes', async () => {
    const wrapper = mount(DiffTool);
    const editors = wrapper.findAllComponents(TextEditor);

    await editors[0].vm.$emit('update:modelValue', 'hello world');
    await editors[1].vm.$emit('update:modelValue', 'hello there');

    const removedRanges = editors[0].props('highlightRanges') as Array<{ from: number; to: number; className: string }>;
    const addedRanges = editors[1].props('highlightRanges') as Array<{ from: number; to: number; className: string }>;

    expect(removedRanges).toHaveLength(1);
    expect(addedRanges).toHaveLength(1);
    expect(removedRanges[0].className).toBe('cm-diff-word-removed');
    expect(addedRanges[0].className).toBe('cm-diff-word-added');
    expect('hello world'.slice(removedRanges[0].from, removedRanges[0].to)).toBe('world');
    expect('hello there'.slice(addedRanges[0].from, addedRanges[0].to)).toBe('there');
  });

  it('swaps the original and changed text when the swap button is clicked', async () => {
    const wrapper = mount(DiffTool);
    const editors = wrapper.findAllComponents(TextEditor);

    await editors[0].vm.$emit('update:modelValue', 'left side');
    await editors[1].vm.$emit('update:modelValue', 'right side');

    await wrapper.find('[aria-label="Swap original and changed text"]').trigger('click');

    expect(editors[0].props('modelValue')).toBe('right side');
    expect(editors[1].props('modelValue')).toBe('left side');
  });

  it('ignores whitespace-only differences when the toggle is enabled', async () => {
    const wrapper = mount(DiffTool);
    const editors = wrapper.findAllComponents(TextEditor);

    await editors[0].vm.$emit('update:modelValue', 'a\n  b');
    await editors[1].vm.$emit('update:modelValue', 'a\nb');
    expect(wrapper.text()).not.toContain('No differences');

    await wrapper.findAll('button').find((button) => button.attributes('role') === 'switch')?.trigger('click');

    expect(wrapper.text()).toContain('No differences');
  });
});
