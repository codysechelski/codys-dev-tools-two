import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import HtmlEncoderDecoder from './HtmlEncoderDecoder.vue';

describe('HtmlEncoderDecoder', () => {
  it('renders options and editors', () => {
    const wrapper = mount(HtmlEncoderDecoder);

    expect(wrapper.text()).toContain('Mode');
    expect(wrapper.text()).toContain('Encode all characters');
    expect(wrapper.findAllComponents(TextEditor)).toHaveLength(2);
    expect(wrapper.findAllComponents(TextEditor)[0].props('language')).toBe('html');
  });

  it('switches to decode mode', async () => {
    const wrapper = mount(HtmlEncoderDecoder);

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="decode"]').trigger('click');

    expect(wrapper.text()).not.toContain('Encode all characters');
    expect(wrapper.findAllComponents(TextEditor)[1].props('modelValue')).toContain('<p');
  });
});
