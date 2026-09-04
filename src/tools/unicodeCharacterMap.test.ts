import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UnicodeCharacterMap from './UnicodeCharacterMap.vue';

describe('UnicodeCharacterMap', () => {
  it('renders filters and character cards', async () => {
    const wrapper = mount(UnicodeCharacterMap);

    expect(wrapper.text()).toContain('Character set');
    expect(wrapper.text()).toContain('Search');
    await wrapper.find('[role="combobox"]').trigger('click');
    expect(wrapper.text()).toContain('All');
    expect(wrapper.text()).toContain('U+0041');
  });

  it('filters characters by name', async () => {
    const wrapper = mount(UnicodeCharacterMap);

    await wrapper.find('input').setValue('capital letter a');

    expect(wrapper.text()).toContain('U+0041');
    expect(wrapper.text()).not.toContain('U+0042');
  });

  it('switches to the matching block when searching by pasted character', async () => {
    const wrapper = mount(UnicodeCharacterMap);

    await wrapper.find('input').setValue('😀');

    expect(wrapper.find('[role="combobox"]').text()).toContain('Emoticons');
    expect(wrapper.text()).toContain('U+1F600');
  });

  it('resets a copy button back to idle when a different character is opened', async () => {
    const wrapper = mount(UnicodeCharacterMap, { attachTo: document.body });
    const cards = wrapper.findAll('.unicode-card');

    await cards[0].trigger('click');
    document.body.querySelector<HTMLButtonElement>('.unicode-detail__copy-character')?.click();
    await new Promise((resolve) => window.setTimeout(resolve));

    expect(document.body.querySelector('.unicode-detail__copy-character')?.textContent).toBe('Copied');

    await cards[1].trigger('click');
    await new Promise((resolve) => window.setTimeout(resolve));

    expect(document.body.querySelector('.unicode-detail__copy-character')?.textContent).toBe('Copy');

    wrapper.unmount();
  });
});
