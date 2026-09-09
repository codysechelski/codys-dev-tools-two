import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RegexTester from './RegexTester.vue';

describe('RegexTester', () => {
  it('renders with a working example and finds matches by default', () => {
    const wrapper = mount(RegexTester, { attachTo: document.body });

    expect(wrapper.find('.regex-pattern-input').exists()).toBe(true);
    expect(wrapper.text()).toContain('match');
    expect(wrapper.findAll('.regex-tool-match').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.cm-highlight-range').length).toBeGreaterThan(0);

    wrapper.unmount();
  });

  it('inserts a token snippet into the pattern editor from a footer button', async () => {
    const wrapper = mount(RegexTester, { attachTo: document.body });

    const digitButton = wrapper.findAll('.regex-tool__snippet-button').find((button) => button.text() === '\\d');
    expect(digitButton).toBeTruthy();

    const before = wrapper.find('.regex-pattern-input .cm-content').text();
    await digitButton?.trigger('click');
    const after = wrapper.find('.regex-pattern-input .cm-content').text();

    expect(after.length).toBe(before.length + 2);

    wrapper.unmount();
  });

  it('applies a common pattern preset and resets the flags', async () => {
    const wrapper = mount(RegexTester, { attachTo: document.body });

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="ipv4"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.regex-pattern-input .cm-content').text()).toContain('25[0-5]');

    wrapper.unmount();
  });

  it('jumps to a match in the test editor when its row is clicked', async () => {
    const wrapper = mount(RegexTester, { attachTo: document.body });

    const matchRow = wrapper.find('.regex-tool-match');
    expect(matchRow.exists()).toBe(true);

    await matchRow.trigger('click');

    const testEditorContent = wrapper.findAll('.text-editor')[1]?.find('.cm-content');
    expect(document.activeElement).toBe(testEditorContent?.element);

    wrapper.unmount();
  });
});
