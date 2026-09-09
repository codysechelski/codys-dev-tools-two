import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import RegexPatternInput from './RegexPatternInput.vue';

describe('RegexPatternInput', () => {
  it('renders a single-line CodeMirror editor without line numbers', () => {
    const wrapper = mount(RegexPatternInput, { props: { modelValue: '\\d+' } });

    expect(wrapper.find('.cm-editor').exists()).toBe(true);
    expect(wrapper.find('.cm-gutters').exists()).toBe(false);
  });

  it('emits update:modelValue when the pattern is edited via insertSnippet', () => {
    const wrapper = mount(RegexPatternInput, { props: { modelValue: '' }, attachTo: document.body });

    wrapper.vm.insertSnippet('\\d');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['\\d']);

    wrapper.unmount();
  });

  it('places the selection inside the snippet when selectStart/selectEnd are given', async () => {
    const wrapper = mount(RegexPatternInput, { props: { modelValue: '' }, attachTo: document.body });

    wrapper.vm.insertSnippet('()', 1, 1);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['()']);

    wrapper.unmount();
  });

  it('strips newlines from the initial value and from later prop updates', async () => {
    const wrapper = mount(RegexPatternInput, { props: { modelValue: 'a\nb' } });

    expect(wrapper.find('.cm-content').text()).toBe('ab');

    await wrapper.setProps({ modelValue: 'c\n\nd' });

    expect(wrapper.find('.cm-content').text()).toBe('cd');
  });

  it('highlights recognized regex tokens with syntax classes', () => {
    const wrapper = mount(RegexPatternInput, { props: { modelValue: '^\\d+$' } });

    expect(wrapper.find('.cm-regex-tok-anchor').exists()).toBe(true);
    expect(wrapper.find('.cm-regex-tok-escape').exists()).toBe(true);
    expect(wrapper.find('.cm-regex-tok-quantifier').exists()).toBe(true);
  });

  it('renders the provided footer slot content', () => {
    const wrapper = mount(RegexPatternInput, {
      props: { modelValue: '' },
      slots: { footer: '<button class="my-footer-button">Insert</button>' },
    });

    expect(wrapper.find('.my-footer-button').exists()).toBe(true);
  });

  it('clears the pattern from the toolbar', async () => {
    const wrapper = mount(RegexPatternInput, { props: { modelValue: '\\d+' }, attachTo: document.body });

    await wrapper.findAll('button').find((button) => button.text() === 'Clear')?.trigger('click');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['']);

    wrapper.unmount();
  });

  it('copies the pattern from the toolbar', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const wrapper = mount(RegexPatternInput, { props: { modelValue: '\\d+' } });

    await wrapper.findAll('button').find((button) => button.text() === 'Copy')?.trigger('click');

    expect(writeText).toHaveBeenCalledWith('\\d+');
  });
});
