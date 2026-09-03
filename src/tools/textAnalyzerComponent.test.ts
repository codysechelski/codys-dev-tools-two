import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import TextAnalyzer from './TextAnalyzer.vue';

describe('TextAnalyzer', () => {
  it('renders input editor and text stats', () => {
    const wrapper = mount(TextAnalyzer);

    expect(wrapper.findComponent(TextEditor).exists()).toBe(true);
    expect(wrapper.text()).toContain('Paragraphs');
    expect(wrapper.text()).toContain('Words');
    expect(wrapper.text()).toContain('Non-whitespace characters');
    expect(wrapper.text()).toContain('Word Frequency');
  });

  it('updates word counts when case sensitivity changes', async () => {
    const wrapper = mount(TextAnalyzer);

    wrapper.findComponent(TextEditor).vm.$emit('update:modelValue', 'Code code CODE');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('code');
    expect(wrapper.text()).toContain('3');

    await wrapper.find('button[role="switch"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('CODE');
    expect(wrapper.text()).toContain('Code');
  });
});
