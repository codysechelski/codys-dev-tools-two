import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import SvgViewer from './SvgViewer.vue';

describe('SvgViewer', () => {
  it('renders a preview image and dimensions for the default example', () => {
    const wrapper = mount(SvgViewer);

    const image = wrapper.find('.svg-viewer-preview__image');
    expect(image.exists()).toBe(true);
    expect(image.attributes('src')).toContain('data:image/svg+xml,');
    expect(wrapper.text()).toContain('100 × 100');
  });

  it('shows an empty-state message and no preview image when the input is cleared', async () => {
    const wrapper = mount(SvgViewer, { attachTo: document.body });

    await wrapper.findAll('button').find((button) => button.text() === 'Clear')?.trigger('click');

    expect(wrapper.find('.svg-viewer-preview__image').exists()).toBe(false);
    expect(wrapper.text()).toContain('Paste SVG markup to preview it here.');

    wrapper.unmount();
  });

  it('shows an error badge and no preview for malformed markup', async () => {
    const wrapper = mount(SvgViewer);

    await wrapper.findComponent(TextEditor).vm.$emit('update:modelValue', '<svg><rect></svg>');

    expect(wrapper.find('.svg-viewer-preview__image').exists()).toBe(false);
    expect(wrapper.text()).toContain('Fix the markup above to see a preview.');
    expect(wrapper.find('.formatter-tool__status--error, .tool-toolbar__badge button').exists()).toBe(true);
  });
});
