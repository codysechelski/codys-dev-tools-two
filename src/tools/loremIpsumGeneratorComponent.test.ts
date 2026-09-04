import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import LoremIpsumGenerator from './LoremIpsumGenerator.vue';

describe('LoremIpsumGenerator', () => {
  it('renders controls and side-by-side outputs', () => {
    const wrapper = mount(LoremIpsumGenerator);

    expect(wrapper.text()).toContain('Vary ending punctuation');
    expect(wrapper.text()).toContain('Vary sentence punctuation');
    expect(wrapper.text()).toContain('Include common HTML tags');
    expect(wrapper.text()).toContain('Generate');
    expect(wrapper.text()).toContain('Text');
    expect(wrapper.text()).toContain('Markup');
  });

  it('shows definition term controls only for definition list items', async () => {
    const wrapper = mount(LoremIpsumGenerator);

    expect(wrapper.text()).not.toContain('words in term');

    await wrapper.find('[aria-label="Generated unit"]').trigger('click');
    await wrapper.find('[data-value="definition-list-items"]').trigger('click');

    expect(wrapper.text()).toContain('words in term');
    expect(wrapper.find('.html-preview__body').html()).toContain('<dl>');
  });

  it('hides sentence controls for word output', async () => {
    const wrapper = mount(LoremIpsumGenerator);

    await wrapper.find('[aria-label="Generated unit"]').trigger('click');
    await wrapper.find('[data-value="words"]').trigger('click');

    expect(wrapper.text()).not.toContain('sentences that have');
    expect(wrapper.find('.html-preview__body').html()).not.toContain('<p>');
  });

  it('regenerates text with the same selected options', async () => {
    const wrapper = mount(LoremIpsumGenerator);
    const initialOutput = wrapper.find('.html-preview__body').html();

    await wrapper.find('[aria-label="Regenerate text"]').trigger('click');

    expect(wrapper.find('.html-preview__body').html()).not.toBe(initialOutput);
    expect(wrapper.find('[aria-label="Generated unit"]').text()).toContain('paragraphs');
  });
});
