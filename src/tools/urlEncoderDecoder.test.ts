import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import UrlEncoderDecoder from './UrlEncoderDecoder.vue';

describe('UrlEncoderDecoder', () => {
  it('renders options and editors', () => {
    const wrapper = mount(UrlEncoderDecoder);

    expect(wrapper.text()).toContain('Mode');
    expect(wrapper.text()).toContain('URL component');
    expect(wrapper.text()).toContain('Form spaces (+)');
    expect(wrapper.text()).toContain('RFC 3986');
    expect(wrapper.findAllComponents(TextEditor)).toHaveLength(2);
  });

  it('hides RFC 3986 for decode mode', async () => {
    const wrapper = mount(UrlEncoderDecoder);

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="decode"]').trigger('click');

    expect(wrapper.text()).not.toContain('RFC 3986');
  });
});
