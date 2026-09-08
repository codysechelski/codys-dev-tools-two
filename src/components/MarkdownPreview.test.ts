import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import MarkdownPreview from './MarkdownPreview.vue';

describe('MarkdownPreview', () => {
  it('shows an empty state when there is no markdown', () => {
    const wrapper = mount(MarkdownPreview, {
      props: { markdown: '', label: 'Table Preview' },
    });

    expect(wrapper.text()).toContain('Nothing to preview yet.');
    expect(wrapper.find('.markdown-preview__body').exists()).toBe(false);
  });

  it('renders a markdown table as real HTML table markup', () => {
    const wrapper = mount(MarkdownPreview, {
      props: { markdown: '| Name | Age |\n| --- | --- |\n| Ada | 36 |', label: 'Table Preview' },
    });

    const table = wrapper.find('.markdown-preview__body table');
    expect(table.exists()).toBe(true);
    expect(table.findAll('th').map((cell) => cell.text())).toEqual(['Name', 'Age']);
    expect(table.findAll('td').map((cell) => cell.text())).toEqual(['Ada', '36']);
  });

  it('copies the rendered markdown as plain text when ClipboardItem is unavailable', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const wrapper = mount(MarkdownPreview, {
      props: { markdown: '| A |\n| --- |\n| 1 |', label: 'Table Preview' },
    });

    await wrapper.find('button').trigger('click');

    expect(writeText).toHaveBeenCalledWith('| A |\n| --- |\n| 1 |');
  });
});
