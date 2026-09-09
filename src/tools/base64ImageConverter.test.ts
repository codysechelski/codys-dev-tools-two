import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import Base64ImageConverter from './Base64ImageConverter.vue';

const VALID_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 0;
  naturalHeight = 0;

  set src(value: string) {
    queueMicrotask(() => {
      if (value.includes(VALID_PNG_BASE64)) {
        this.naturalWidth = 1;
        this.naturalHeight = 1;
        this.onload?.();
      } else {
        this.onerror?.();
      }
    });
  }
}

describe('Base64ImageConverter', () => {
  beforeEach(() => {
    vi.stubGlobal('Image', MockImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the mode select and encode drop zone by default', () => {
    const wrapper = mount(Base64ImageConverter);

    expect(wrapper.text()).toContain('Mode');
    expect(wrapper.find('.text-editor-file-drop').exists()).toBe(true);
  });

  it('shows the image type select only in decode mode', async () => {
    const wrapper = mount(Base64ImageConverter);

    expect(wrapper.text()).not.toContain('Image type');

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="decode"]').trigger('click');

    expect(wrapper.text()).toContain('Image type');
  });

  it('rejects a non-image file with a clear error', async () => {
    const wrapper = mount(Base64ImageConverter);
    const file = new File(['not an image'], 'notes.txt', { type: 'text/plain' });
    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [file] });

    await input.trigger('change');

    expect(wrapper.find('.formatter-tool__status--error').text()).toBe('Error - click for details');

    await wrapper.find('.formatter-tool__status--error').trigger('click');

    expect(document.body.textContent).toContain("doesn't look like an image file");
  });

  it('previews a valid decoded data URL and reports its dimensions', async () => {
    const wrapper = mount(Base64ImageConverter);

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="decode"]').trigger('click');

    const textarea = wrapper.findComponent(TextEditor);
    await textarea.vm.$emit('update:modelValue', `data:image/png;base64,${VALID_PNG_BASE64}`);
    await new Promise((resolve) => setTimeout(resolve));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('img[alt="Decoded image preview"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('1 × 1px');
  });

  it('shows an error for base64 that does not decode to an image', async () => {
    const wrapper = mount(Base64ImageConverter);

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="decode"]').trigger('click');

    const textarea = wrapper.findComponent(TextEditor);
    await textarea.vm.$emit('update:modelValue', 'not-valid-base64-image-data');
    await new Promise((resolve) => setTimeout(resolve));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.formatter-tool__status--error').text()).toBe('Error - click for details');

    await wrapper.find('.formatter-tool__status--error').trigger('click');

    expect(document.body.textContent).toContain("doesn't decode to a valid image");
  });

  it('swaps a loaded image into the decode input when flipped from encode', async () => {
    const wrapper = mount(Base64ImageConverter);
    const file = new File([Uint8Array.from(atob(VALID_PNG_BASE64), (c) => c.charCodeAt(0))], 'test.png', { type: 'image/png' });
    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [file] });

    await input.trigger('change');
    await waitFor(() => !wrapper.find('.text-editor-file-drop').exists());

    await wrapper.find('[aria-label="Swap input and output"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[role="combobox"]').text()).toContain('Decode');
    expect(wrapper.findComponent(TextEditor).props('modelValue')).toContain(VALID_PNG_BASE64);
  });

  it('swaps a decoded preview into the loaded image when flipped from decode', async () => {
    const wrapper = mount(Base64ImageConverter);

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="decode"]').trigger('click');

    const textarea = wrapper.findComponent(TextEditor);
    await textarea.vm.$emit('update:modelValue', `data:image/png;base64,${VALID_PNG_BASE64}`);
    await waitFor(() => wrapper.find('img[alt="Decoded image preview"]').exists());

    await wrapper.find('[aria-label="Swap input and output"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[role="combobox"]').text()).toContain('Encode');
    expect(wrapper.find('.text-editor-file-drop').exists()).toBe(false);
    expect(wrapper.find('.base64-image-preview__image').attributes('src')).toContain(VALID_PNG_BASE64);
  });
});

async function waitFor(predicate: () => boolean, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error('waitFor timed out');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
