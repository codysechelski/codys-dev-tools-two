import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AppCopyButton from './AppCopyButton.vue';

describe('AppCopyButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(navigator.clipboard.writeText).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies the value, shows a success state, then resets to idle', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const wrapper = mount(AppCopyButton, {
      props: { value: 'hello world' },
    });

    expect(wrapper.text()).toBe('Copy');

    await wrapper.trigger('click');
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('hello world'));
    await vi.advanceTimersByTimeAsync(0);

    expect(wrapper.text()).toBe('Copied');
    expect(wrapper.classes()).toContain('app-button--success');

    await vi.advanceTimersByTimeAsync(1400);

    expect(wrapper.text()).toBe('Copy');
    expect(wrapper.classes()).toContain('app-button--muted');
  });

  it('does nothing when there is no value and no custom copy handler', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const wrapper = mount(AppCopyButton, {
      props: { value: '' },
    });

    await wrapper.trigger('click');

    expect(writeText).not.toHaveBeenCalled();
    expect(wrapper.text()).toBe('Copy');
  });

  it('uses a custom copy handler when provided instead of writing the value', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const copy = vi.fn().mockResolvedValue(undefined);
    const wrapper = mount(AppCopyButton, {
      props: { copy, label: 'Copy SVG Code' },
    });

    await wrapper.trigger('click');
    await vi.waitFor(() => expect(copy).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(0);

    expect(writeText).not.toHaveBeenCalled();
    expect(wrapper.text()).toBe('Copied');
  });

  it('shows an error state when the copy handler rejects, then resets', async () => {
    const copy = vi.fn().mockRejectedValue(new Error('nope'));
    const wrapper = mount(AppCopyButton, {
      props: { copy },
    });

    await wrapper.trigger('click');
    await vi.waitFor(() => expect(copy).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(0);

    expect(wrapper.text()).toBe('Copy failed');
    expect(wrapper.classes()).toContain('app-button--destructive');

    await vi.advanceTimersByTimeAsync(1800);

    expect(wrapper.text()).toBe('Copy');
  });

  it('does not respond to clicks while disabled', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const wrapper = mount(AppCopyButton, {
      props: { value: 'hi', disabled: true },
    });

    await wrapper.trigger('click');

    expect(writeText).not.toHaveBeenCalled();
  });

  it('resets to idle immediately when resetKey changes', async () => {
    const wrapper = mount(AppCopyButton, {
      props: { value: 'hi', resetKey: 'a' },
    });

    await wrapper.trigger('click');
    await vi.advanceTimersByTimeAsync(0);
    expect(wrapper.text()).toBe('Copied');

    await wrapper.setProps({ resetKey: 'b' });
    await vi.advanceTimersByTimeAsync(0);

    expect(wrapper.text()).toBe('Copy');
  });
});
