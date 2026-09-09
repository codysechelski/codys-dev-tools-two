import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import Base64EncoderDecoder from './Base64EncoderDecoder.vue';

describe('Base64EncoderDecoder', () => {
  it('renders options and editors', () => {
    const wrapper = mount(Base64EncoderDecoder);

    expect(wrapper.text()).toContain('Mode');
    expect(wrapper.text()).toContain('URL-safe alphabet');
    expect(wrapper.findAllComponents(TextEditor)).toHaveLength(2);
  });

  it('encodes the default input by default', () => {
    const wrapper = mount(Base64EncoderDecoder);

    expect(wrapper.findAllComponents(TextEditor)[1].props('modelValue')).toBe("Q29keSdzIERldiBUb29scw==");
  });

  it('decodes when switched to decode mode', async () => {
    const wrapper = mount(Base64EncoderDecoder);

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="decode"]').trigger('click');
    await wrapper.findAllComponents(TextEditor)[0].vm.$emit('update:modelValue', 'aGk=');

    expect(wrapper.findAllComponents(TextEditor)[1].props('modelValue')).toBe('hi');
  });

  it('shows an error badge for invalid base64 in decode mode', async () => {
    const wrapper = mount(Base64EncoderDecoder);

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="decode"]').trigger('click');
    await wrapper.findAllComponents(TextEditor)[0].vm.$emit('update:modelValue', '!!!');

    expect(wrapper.text()).toContain('not valid base64');
  });
});
