import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AppSidebar from './AppSidebar.vue';

const tools = [
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    section: 'Formatters',
    description: 'Validate and format JSON payloads.',
    icon: 'code',
    component: {},
    keywords: ['json', 'minify', 'beautify'],
  },
  {
    id: 'text-analyzer',
    name: 'Text Analyzer',
    section: 'String Utilities',
    description: 'Analyze long-form text.',
    icon: 'hashtag',
    component: {},
    keywords: ['word count', 'readability'],
  },
];

const baseProps = {
  tools,
  selectedToolId: null,
  version: '0.1.0',
  attributionsToolId: 'attributions',
  settingsToolId: 'settings',
  pinnedToolIds: [],
};

describe('AppSidebar', () => {
  it('renders the app version and a footer attributions action', async () => {
    const wrapper = mount(AppSidebar, { props: baseProps });

    expect(wrapper.find('.sidebar__footer').text()).toContain('v0.1.0');
    expect(wrapper.find('.sidebar__footer').text()).toContain('|');
    expect(wrapper.find('.sidebar__footer').text()).toContain('Attributions');
    expect(wrapper.find('.tool-nav').text()).not.toContain('Attributions');

    const attributionsButton = wrapper.findAll('.sidebar__footer button').find((button) => button.text() === 'Attributions');
    await attributionsButton?.trigger('click');

    expect(wrapper.emitted('selectTool')?.[0]).toEqual(['attributions']);
  });

  it('emits a null tool id from the footer version link', async () => {
    const wrapper = mount(AppSidebar, { props: baseProps });

    const versionButton = wrapper.findAll('.sidebar__footer button').find((button) => button.text() === 'v0.1.0');
    await versionButton?.trigger('click');

    expect(wrapper.emitted('selectTool')?.[0]).toEqual([null]);
  });

  it('opens settings from the footer gear button', async () => {
    const wrapper = mount(AppSidebar, { props: baseProps });

    await wrapper.find('.sidebar__settings-button').trigger('click');

    expect(wrapper.emitted('selectTool')?.[0]).toEqual(['settings']);
  });

  it('groups tools into sidebar sections', () => {
    const wrapper = mount(AppSidebar, { props: baseProps });

    expect(wrapper.text()).toContain('String Utilities');
    expect(wrapper.text()).toContain('Formatters');
    expect(wrapper.text()).toContain('Text Analyzer');
    expect(wrapper.text()).toContain('JSON Formatter');
  });

  it('has no brand text, just a search input', () => {
    const wrapper = mount(AppSidebar, { props: baseProps });

    expect(wrapper.text()).not.toContain("Cody's");
    expect(wrapper.text()).not.toContain('Dev Tools');
    expect(wrapper.find('.sidebar__filter input').exists()).toBe(true);
  });

  it('filters the tool list by name as the user types', async () => {
    const wrapper = mount(AppSidebar, { props: baseProps });

    await wrapper.find('.sidebar__filter input').setValue('json');

    expect(wrapper.find('.tool-nav').text()).toContain('JSON Formatter');
    expect(wrapper.find('.tool-nav').text()).not.toContain('Text Analyzer');
  });

  it('filters the tool list by keyword, case-insensitively', async () => {
    const wrapper = mount(AppSidebar, { props: baseProps });

    await wrapper.find('.sidebar__filter input').setValue('READABILITY');

    expect(wrapper.find('.tool-nav').text()).toContain('Text Analyzer');
    expect(wrapper.find('.tool-nav').text()).not.toContain('JSON Formatter');
  });

  it('shows an empty state and restores the list when the filter is cleared', async () => {
    const wrapper = mount(AppSidebar, { props: baseProps });
    const input = wrapper.find('.sidebar__filter input');

    await input.setValue('nothing matches this');
    expect(wrapper.find('.tool-nav__empty').exists()).toBe(true);

    await input.setValue('');
    expect(wrapper.find('.tool-nav__empty').exists()).toBe(false);
    expect(wrapper.find('.tool-nav').text()).toContain('JSON Formatter');
    expect(wrapper.find('.tool-nav').text()).toContain('Text Analyzer');
  });

  it('has no Starred section when nothing is pinned', () => {
    const wrapper = mount(AppSidebar, { props: baseProps });

    expect(wrapper.text()).not.toContain('Starred');
  });

  it('shows a Starred section with the pinned tool when pinnedToolIds is set', () => {
    const wrapper = mount(AppSidebar, { props: { ...baseProps, pinnedToolIds: ['json-formatter'] } });
    const sections = wrapper.findAll('.tool-nav__section');

    expect(sections[0].text()).toContain('Starred');
    expect(sections[0].text()).toContain('JSON Formatter');
  });

  it('emits togglePin when a pin button is clicked', async () => {
    const wrapper = mount(AppSidebar, { props: baseProps });

    const pinButton = wrapper.findAll('.tool-nav__pin').find((button) => button.attributes('aria-label') === 'Pin JSON Formatter');
    await pinButton?.trigger('click');

    expect(wrapper.emitted('togglePin')?.[0]).toEqual(['json-formatter']);
  });

  it("marks a pinned tool's pin button as active", () => {
    const wrapper = mount(AppSidebar, { props: { ...baseProps, pinnedToolIds: ['json-formatter'] } });
    const pinButton = wrapper.findAll('.tool-nav__pin').find((button) => button.attributes('aria-label') === 'Unpin JSON Formatter');

    expect(pinButton?.classes()).toContain('tool-nav__pin--active');
  });

  it('defaults to comfortable density when no density prop is given', () => {
    const wrapper = mount(AppSidebar, { props: baseProps });

    expect(wrapper.find('.sidebar').attributes('data-density')).toBe('comfortable');
  });

  it('reflects the compact density prop as a data attribute', () => {
    const wrapper = mount(AppSidebar, { props: { ...baseProps, density: 'compact' } });

    expect(wrapper.find('.sidebar').attributes('data-density')).toBe('compact');
  });
});
