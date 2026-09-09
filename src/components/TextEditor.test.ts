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

  it('applies syntax highlighting for the yaml language', () => {
    const wrapper = mount(TextEditor, {
      props: { modelValue: 'name: Acme\ncount: 42', label: 'Input', language: 'yaml' },
    });

    const spans = wrapper.findAll('.cm-line span');
    const classOf = (text: string): string | undefined => spans.find((span) => span.text() === text)?.classes()[0];

    const keyClass = classOf('name');
    expect(keyClass).toBeTruthy();
    expect(classOf('count')).toBe(keyClass);
    expect(classOf('42')).toBeTruthy();
    expect(classOf('42')).not.toBe(keyClass);
  });

  it('applies keyword syntax highlighting for the sql language, including SOQL-only clauses', () => {
    const wrapper = mount(TextEditor, {
      props: { modelValue: "SELECT Id FROM Account WHERE Name = 'Acme' WITH SECURITY_ENFORCED", label: 'Input', language: 'sql' },
    });

    // CodeMirror generates its own highlight class names, so assert on structure (same class for every
    // recognized keyword, a different one for the string literal) rather than a specific class string.
    const spans = wrapper.findAll('.cm-line span');
    const classOf = (text: string): string | undefined => spans.find((span) => span.text() === text)?.classes()[0];

    const keywordClass = classOf('SELECT');
    expect(keywordClass).toBeTruthy();
    expect(classOf('FROM')).toBe(keywordClass);
    expect(classOf('WHERE')).toBe(keywordClass);
    expect(classOf('WITH')).toBe(keywordClass);
    expect(classOf('SECURITY_ENFORCED')).toBe(keywordClass);

    const stringClass = classOf("'Acme'");
    expect(stringClass).toBeTruthy();
    expect(stringClass).not.toBe(keywordClass);
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
      attachTo: document.body,
    });

    await wrapper.findAll('button').find((button) => button.text() === 'Clear')?.trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['']);
    expect(document.activeElement).toBe(wrapper.find('.cm-content').element);

    wrapper.unmount();
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

  it('renders highlight ranges as marks and updates them when the prop changes', async () => {
    const wrapper = mount(TextEditor, {
      props: { modelValue: 'hello world', label: 'Input', highlightRanges: [{ from: 0, to: 5 }] },
      attachTo: document.body,
    });

    expect(wrapper.findAll('.cm-highlight-range')).toHaveLength(1);

    await wrapper.setProps({ highlightRanges: [{ from: 0, to: 5 }, { from: 6, to: 11 }] });

    expect(wrapper.findAll('.cm-highlight-range')).toHaveLength(2);

    wrapper.unmount();
  });

  it('ignores out-of-bounds or zero-length highlight ranges instead of throwing', () => {
    expect(() =>
      mount(TextEditor, {
        props: { modelValue: 'hi', label: 'Input', highlightRanges: [{ from: 5, to: 9 }, { from: 1, to: 1 }] },
        attachTo: document.body,
      }),
    ).not.toThrow();
  });

  it('exposes scrollToRange to select a character range and focus the editor', () => {
    const wrapper = mount(TextEditor, { props: { modelValue: 'hello world', label: 'Input' }, attachTo: document.body });

    wrapper.vm.scrollToRange(6, 11);

    expect(document.activeElement).toBe(wrapper.find('.cm-content').element);

    wrapper.unmount();
  });

  it('clamps scrollToRange to the document bounds instead of throwing', () => {
    const wrapper = mount(TextEditor, { props: { modelValue: 'hi', label: 'Input' }, attachTo: document.body });

    expect(() => wrapper.vm.scrollToRange(-5, 999)).not.toThrow();

    wrapper.unmount();
  });

  it('renders highlight lines as full-line decorations with the given class and updates them when the prop changes', async () => {
    const wrapper = mount(TextEditor, {
      props: { modelValue: 'a\nb\nc', label: 'Input', highlightLines: [{ line: 2, className: 'cm-diff-line-added' }] },
      attachTo: document.body,
    });

    expect(wrapper.findAll('.cm-diff-line-added')).toHaveLength(1);

    await wrapper.setProps({
      highlightLines: [
        { line: 1, className: 'cm-diff-line-removed' },
        { line: 3, className: 'cm-diff-line-added' },
      ],
    });

    expect(wrapper.findAll('.cm-diff-line-removed')).toHaveLength(1);
    expect(wrapper.findAll('.cm-diff-line-added')).toHaveLength(1);

    wrapper.unmount();
  });

  it('ignores out-of-bounds highlight lines instead of throwing', () => {
    expect(() =>
      mount(TextEditor, {
        props: { modelValue: 'a\nb', label: 'Input', highlightLines: [{ line: 0, className: 'cm-diff-line-added' }, { line: 99, className: 'cm-diff-line-removed' }] },
        attachTo: document.body,
      }),
    ).not.toThrow();
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
