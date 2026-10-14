import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HelpPopover from './HelpPopover.vue';

describe('HelpPopover', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an accessible help trigger and tooltip text', () => {
    const wrapper = mount(HelpPopover, {
      props: {
        text: 'Additional context',
        label: 'Output help',
      },
    });

    expect(wrapper.find('button').attributes('aria-label')).toBe('Output help');
    expect(wrapper.find('[role="tooltip"]').text()).toBe('Additional context');
  });

  it('promotes the content to the top layer and positions it against the viewport on hover', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 0;
    });
    const showPopover = vi.fn();
    const hidePopover = vi.fn();
    const wrapper = mount(HelpPopover, { props: { text: 'Help' }, attachTo: document.body });
    const content = wrapper.find('[role="tooltip"]');
    const contentEl = content.element as HTMLElement;
    let popoverOpen = false;
    contentEl.showPopover = () => {
      popoverOpen = true;
      showPopover();
    };
    contentEl.hidePopover = () => {
      popoverOpen = false;
      hidePopover();
    };
    const matches = contentEl.matches.bind(contentEl);
    vi.spyOn(contentEl, 'matches').mockImplementation((selector) =>
      selector === ':popover-open' ? popoverOpen : matches(selector),
    );
    Object.defineProperty(contentEl, 'offsetWidth', { configurable: true, value: 200 });
    Object.defineProperty(contentEl, 'offsetHeight', { configurable: true, value: 60 });
    vi.spyOn(wrapper.find('button').element, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 4, y: 300, width: 16, height: 16 }),
    );

    expect(content.attributes('popover')).toBe('manual');

    await wrapper.trigger('mouseenter');

    expect(showPopover).toHaveBeenCalledOnce();
    expect(content.classes()).toContain('help-popover__content--open');
    expect(contentEl.style.left).toBe('8px');
    expect(contentEl.style.top).toBe('232px');

    await wrapper.trigger('mouseleave');

    expect(hidePopover).toHaveBeenCalledOnce();
    expect(content.classes()).not.toContain('help-popover__content--open');
    wrapper.unmount();
  });

  it('stays open while focused even after the pointer leaves, and closes on Escape', async () => {
    const wrapper = mount(HelpPopover, { props: { text: 'Help' }, attachTo: document.body });
    const content = wrapper.find('[role="tooltip"]');

    await wrapper.find('button').trigger('focusin');
    await wrapper.trigger('mouseenter');
    await wrapper.trigger('mouseleave');
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await wrapper.vm.$nextTick();

    expect(content.classes()).toContain('help-popover__content--open');

    await wrapper.trigger('keydown', { key: 'Escape' });

    expect(content.classes()).not.toContain('help-popover__content--open');
    wrapper.unmount();
  });
});
