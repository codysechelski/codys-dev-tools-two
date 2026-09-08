import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TextEditor from './TextEditor.vue';

describe('TextEditor', () => {
  it('renders a CodeMirror editor with line numbers', () => {
    const wrapper = mount(TextEditor, {
      props: {
        modelValue: 'a\nb',
        label: 'Input',
        language: 'json',
      },
    });

    expect(wrapper.find('.cm-editor').exists()).toBe(true);
    expect(wrapper.find('.cm-gutters').exists()).toBe(true);
  });

  it('renders readonly editors as non-editable', () => {
    const wrapper = mount(TextEditor, {
      props: {
        modelValue: '{"a":1}',
        label: 'Output',
        readonly: true,
      },
    });

    expect(wrapper.classes()).toContain('text-editor--readonly');
    expect(wrapper.find('.cm-content').attributes('contenteditable')).toBe('false');
    expect(wrapper.text()).not.toContain('Clear');
  });

  it('clears editable editor contents from the toolbar', async () => {
    const wrapper = mount(TextEditor, {
      props: {
        modelValue: '{"a":1}',
        label: 'Input',
      },
    });

    await wrapper.findAll('button').find((button) => button.text() === 'Clear')?.trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['']);
  });

  it('copies the editor contents from the toolbar', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const wrapper = mount(TextEditor, {
      props: {
        modelValue: '{"a":1}',
        label: 'Output',
      },
    });

    const copyButton = wrapper.findAll('button').find((button) => button.text() === 'Copy');

    expect(copyButton?.find('.app-icon').exists()).toBe(true);
    await copyButton?.trigger('click');

    expect(writeText).toHaveBeenCalledWith('{"a":1}');
  });

  it('renders optional help text in a popover', () => {
    const wrapper = mount(TextEditor, {
      props: {
        modelValue: '',
        label: 'Format String',
        description: 'Use {0} for the first column.',
      },
    });

    expect(wrapper.find('.help-popover').exists()).toBe(true);
    expect(wrapper.text()).toContain('Use {0} for the first column.');
  });

  it('only shows the Load File button for editable editors', () => {
    const editable = mount(TextEditor, { props: { modelValue: '', label: 'Input' } });
    const readonly = mount(TextEditor, { props: { modelValue: '', label: 'Output', readonly: true } });

    expect(editable.text()).toContain('Load File');
    expect(readonly.text()).not.toContain('Load File');
  });

  it('opens the load file modal with a drag-and-drop zone in the browser', async () => {
    const wrapper = mount(TextEditor, { props: { modelValue: '', label: 'Input' }, attachTo: document.body });

    await wrapper.findAll('button').find((button) => button.text() === 'Load File')?.trigger('click');

    expect(document.body.textContent).toContain('Load File');
    expect(document.body.querySelector('.text-editor-file-drop')).not.toBeNull();

    wrapper.unmount();
  });

  it('loads a dropped text file into the editor', async () => {
    const wrapper = mount(TextEditor, { props: { modelValue: '', label: 'Input' }, attachTo: document.body });

    await wrapper.findAll('button').find((button) => button.text() === 'Load File')?.trigger('click');

    const file = new File(['hello from disk'], 'notes.txt', { type: 'text/plain' });
    await dispatchDrop(file);

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['hello from disk']);
    expect(document.body.querySelector('.text-editor-file-drop')).toBeNull();

    wrapper.unmount();
  });

  it('rejects binary files with an inline error and keeps the modal open', async () => {
    const wrapper = mount(TextEditor, { props: { modelValue: '', label: 'Input' }, attachTo: document.body });

    await wrapper.findAll('button').find((button) => button.text() === 'Load File')?.trigger('click');

    const binaryFile = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01, 0x02])], 'image.png', { type: 'image/png' });
    await dispatchDrop(binaryFile);

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(document.body.textContent).toContain("doesn't look like a text file");
    expect(document.body.querySelector('.text-editor-file-drop')).not.toBeNull();

    wrapper.unmount();
  });
});

describe('TextEditor Load File in Electron', () => {
  afterEach(() => {
    delete (window as { codyDevTools?: unknown }).codyDevTools;
  });

  it('still shows the drag-and-drop modal, but routes Browse Files to the native picker instead of a file input', async () => {
    const loadTextFile = vi.fn().mockResolvedValue({ name: 'notes.txt', content: 'from native dialog' });
    window.codyDevTools = { platform: 'darwin', isElectron: true, loadTextFile };

    const wrapper = mount(TextEditor, { props: { modelValue: '', label: 'Input' }, attachTo: document.body });

    await wrapper.findAll('button').find((button) => button.text() === 'Load File')?.trigger('click');

    expect(document.body.querySelector('.text-editor-file-drop')).not.toBeNull();
    expect(document.body.querySelector('.text-editor-file-drop__input')).toBeNull();

    await clickBrowseFiles();

    expect(loadTextFile).toHaveBeenCalled();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['from native dialog']);
    expect(document.body.querySelector('.text-editor-file-drop')).toBeNull();

    wrapper.unmount();
  });

  it('shows an inline error and keeps the modal open when the native picker reports a non-text file', async () => {
    const loadTextFile = vi.fn().mockResolvedValue({ name: 'image.png', error: "\"image.png\" doesn't look like a text file." });
    window.codyDevTools = { platform: 'darwin', isElectron: true, loadTextFile };

    const wrapper = mount(TextEditor, { props: { modelValue: '', label: 'Input' }, attachTo: document.body });

    await wrapper.findAll('button').find((button) => button.text() === 'Load File')?.trigger('click');
    await clickBrowseFiles();

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(document.body.textContent).toContain("doesn't look like a text file");
    expect(document.body.querySelector('.text-editor-file-drop')).not.toBeNull();

    wrapper.unmount();
  });

  it('does not open the native picker when the user cancels', async () => {
    const loadTextFile = vi.fn().mockResolvedValue(null);
    window.codyDevTools = { platform: 'darwin', isElectron: true, loadTextFile };

    const wrapper = mount(TextEditor, { props: { modelValue: '', label: 'Input' }, attachTo: document.body });

    await wrapper.findAll('button').find((button) => button.text() === 'Load File')?.trigger('click');
    await clickBrowseFiles();

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(document.body.querySelector('.text-editor-file-drop')).not.toBeNull();

    wrapper.unmount();
  });

  it('exposes scrollToLine to move the cursor and focus a given line', () => {
    const wrapper = mount(TextEditor, { props: { modelValue: 'a\nb\nc', label: 'Input' }, attachTo: document.body });

    wrapper.vm.scrollToLine(2);

    expect(document.activeElement).toBe(wrapper.find('.cm-content').element);

    wrapper.unmount();
  });

  it('clamps scrollToLine to the document bounds instead of throwing', () => {
    const wrapper = mount(TextEditor, { props: { modelValue: 'a\nb\nc', label: 'Input' }, attachTo: document.body });

    expect(() => wrapper.vm.scrollToLine(99)).not.toThrow();
    expect(() => wrapper.vm.scrollToLine(0)).not.toThrow();

    wrapper.unmount();
  });

  it('holds the target line highlight, then fades it out and removes it', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const wrapper = mount(TextEditor, { props: { modelValue: 'a\nb\nc', label: 'Input' }, attachTo: document.body });

    wrapper.vm.scrollToLine(2);

    expect(wrapper.findAll('.cm-line-flash')).toHaveLength(1);
    expect(wrapper.findAll('.cm-line-flash--fading')).toHaveLength(0);

    vi.advanceTimersByTime(1000);

    expect(wrapper.findAll('.cm-line-flash--fading')).toHaveLength(1);

    vi.advanceTimersByTime(900);

    expect(wrapper.findAll('.cm-line-flash')).toHaveLength(0);

    wrapper.unmount();
    vi.useRealTimers();
  });
});

async function dispatchDrop(file: File): Promise<void> {
  const dropZone = document.body.querySelector('.text-editor-file-drop');
  const event = new Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { files: [file] } });
  dropZone?.dispatchEvent(event);
  await new Promise((resolve) => window.setTimeout(resolve));
}

async function clickBrowseFiles(): Promise<void> {
  const browseButton = Array.from(document.body.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Browse Files');
  browseButton?.dispatchEvent(new Event('click', { bubbles: true }));
  await new Promise((resolve) => window.setTimeout(resolve));
}
