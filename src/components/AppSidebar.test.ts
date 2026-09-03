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
  },
  {
    id: 'text-analyzer',
    name: 'Text Analyzer',
    section: 'String Utilities',
    description: 'Analyze long-form text.',
    icon: 'hashtag',
    component: {},
  },
];

describe('AppSidebar', () => {
  it('renders the app version and a footer attributions action', async () => {
    const wrapper = mount(AppSidebar, {
      props: {
        tools,
        selectedToolId: null,
        version: '0.1.0',
        attributionsToolId: 'attributions',
        settingsToolId: 'settings',
      },
    });

    expect(wrapper.find('.sidebar__footer').text()).toContain('v0.1.0');
    expect(wrapper.find('.sidebar__footer').text()).toContain('|');
    expect(wrapper.find('.sidebar__footer').text()).toContain('Attributions');
    expect(wrapper.find('.tool-nav').text()).not.toContain('Attributions');

    await wrapper.find('.sidebar__footer button').trigger('click');

    expect(wrapper.emitted('selectTool')?.[0]).toEqual(['attributions']);
  });

  it('opens settings from the footer gear button', async () => {
    const wrapper = mount(AppSidebar, {
      props: {
        tools,
        selectedToolId: null,
        version: '0.1.0',
        attributionsToolId: 'attributions',
        settingsToolId: 'settings',
      },
    });

    await wrapper.find('.sidebar__settings-button').trigger('click');

    expect(wrapper.emitted('selectTool')?.[0]).toEqual(['settings']);
  });

  it('groups tools into sidebar sections', () => {
    const wrapper = mount(AppSidebar, {
      props: {
        tools,
        selectedToolId: null,
        version: '0.1.0',
        attributionsToolId: 'attributions',
        settingsToolId: 'settings',
      },
    });

    expect(wrapper.text()).toContain('String Utilities');
    expect(wrapper.text()).toContain('Formatters');
    expect(wrapper.text()).toContain('Text Analyzer');
    expect(wrapper.text()).toContain('JSON Formatter');
  });
});
