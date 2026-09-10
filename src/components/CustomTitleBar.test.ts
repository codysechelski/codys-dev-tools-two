import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CustomTitleBar from './CustomTitleBar.vue';

describe('CustomTitleBar', () => {
  afterEach(() => {
    delete (window as { codyDevTools?: unknown }).codyDevTools;
  });

  it('opens a menu on click and shows its items', async () => {
    const wrapper = mount(CustomTitleBar, { props: { themeMode: 'dark', theme: 'dark' } });

    expect(wrapper.find('.app-titlebar__dropdown').exists()).toBe(false);

    await wrapper.findAll('.app-titlebar__menu-button').find((button) => button.text() === 'File')?.trigger('click');

    const dropdown = wrapper.find('.app-titlebar__dropdown');
    expect(dropdown.exists()).toBe(true);
    expect(dropdown.text()).toContain('Settings');
    expect(dropdown.text()).toContain('Quit');
  });

  it('sends the item id through triggerMenuAction and closes the dropdown', async () => {
    const triggerMenuAction = vi.fn();
    window.codyDevTools = { platform: 'win32', isElectron: true, triggerMenuAction } as unknown as NonNullable<Window['codyDevTools']>;

    const wrapper = mount(CustomTitleBar, { props: { themeMode: 'dark', theme: 'dark' } });
    await wrapper.findAll('.app-titlebar__menu-button').find((button) => button.text() === 'File')?.trigger('click');
    await wrapper.findAll('.app-titlebar__dropdown-item').find((item) => item.text().includes('Settings'))?.trigger('click');

    expect(triggerMenuAction).toHaveBeenCalledWith('menu-settings');
    expect(wrapper.find('.app-titlebar__dropdown').exists()).toBe(false);
  });

  it('marks the theme item matching the current theme-mode prop as checked', async () => {
    const wrapper = mount(CustomTitleBar, { props: { themeMode: 'dark', theme: 'dark' } });
    await wrapper.findAll('.app-titlebar__menu-button').find((button) => button.text() === 'View')?.trigger('click');

    const items = wrapper.findAll('.app-titlebar__dropdown-item');
    const darkItem = items.find((item) => item.text().includes('Theme: Dark'));
    const lightItem = items.find((item) => item.text().includes('Theme: Light'));

    expect(darkItem?.find('.app-icon').exists()).toBe(true);
    expect(lightItem?.find('.app-icon').exists()).toBe(false);
  });

  it('switches to the hovered top-level menu while one is already open, but not when none is open', async () => {
    const wrapper = mount(CustomTitleBar, { props: { themeMode: 'dark', theme: 'dark' } });
    const buttons = wrapper.findAll('.app-titlebar__menu-button');
    const fileButton = buttons.find((button) => button.text() === 'File')!;
    const editButton = buttons.find((button) => button.text() === 'Edit')!;

    await editButton.trigger('mouseenter');
    expect(wrapper.find('.app-titlebar__dropdown').exists()).toBe(false);

    await fileButton.trigger('click');
    await editButton.trigger('mouseenter');

    const dropdown = wrapper.find('.app-titlebar__dropdown');
    expect(dropdown.text()).toContain('Undo');
  });

  it('swaps the titlebar icon for the resolved theme, not the raw theme-mode setting', () => {
    const darkWrapper = mount(CustomTitleBar, { props: { themeMode: 'system', theme: 'dark' } });
    const lightWrapper = mount(CustomTitleBar, { props: { themeMode: 'system', theme: 'light' } });

    const darkSrc = darkWrapper.find('.app-titlebar__icon').attributes('src');
    const lightSrc = lightWrapper.find('.app-titlebar__icon').attributes('src');

    expect(darkSrc).not.toBe(lightSrc);
  });

  it('closes an open menu when clicking outside it', async () => {
    const wrapper = mount(CustomTitleBar, { props: { themeMode: 'dark', theme: 'dark' }, attachTo: document.body });
    await wrapper.findAll('.app-titlebar__menu-button').find((button) => button.text() === 'File')?.trigger('click');
    expect(wrapper.find('.app-titlebar__dropdown').exists()).toBe(true);

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.app-titlebar__dropdown').exists()).toBe(false);
    wrapper.unmount();
  });
});
