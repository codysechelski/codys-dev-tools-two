import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DataTable from './DataTable.vue';

describe('DataTable', () => {
  it('renders header cells and body rows as a real table', () => {
    const wrapper = mount(DataTable, {
      slots: {
        header: '<th>Name</th><th>Value</th>',
        default: '<tr><td>Timezone</td><td>UTC</td></tr>',
      },
    });

    expect(wrapper.find('table').exists()).toBe(true);
    expect(wrapper.find('thead').text()).toBe('NameValue');
    expect(wrapper.find('tbody').text()).toBe('TimezoneUTC');
  });

  it('omits the thead entirely when no header slot content is given', () => {
    const wrapper = mount(DataTable, {
      slots: {
        default: '<tr><td>Timezone</td><td>UTC</td></tr>',
      },
    });

    expect(wrapper.find('thead').exists()).toBe(false);
  });

  it('renders an optional colgroup for fixed column widths', () => {
    const wrapper = mount(DataTable, {
      slots: {
        colgroup: '<col /><col style="width: 4rem" />',
        default: '<tr><td>Timezone</td><td>UTC</td></tr>',
      },
    });

    expect(wrapper.find('colgroup').exists()).toBe(true);
    expect(wrapper.findAll('col')).toHaveLength(2);
  });

  it('can mark the table as scrollable', () => {
    const wrapper = mount(DataTable, {
      props: {
        scrollable: true,
      },
    });

    expect(wrapper.classes()).toContain('data-table--scrollable');
  });
});
