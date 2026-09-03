import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DataList from './DataList.vue';

describe('DataList', () => {
  it('renders an optional header and default rows', () => {
    const wrapper = mount(DataList, {
      props: {
        header: true,
      },
      slots: {
        header: '<span>Name</span><span>Value</span>',
        default: '<article class="data-list__row">UTC</article>',
      },
    });

    expect(wrapper.find('.data-list__header').text()).toBe('NameValue');
    expect(wrapper.find('.data-list__body').text()).toBe('UTC');
  });

  it('can mark the body as scrollable', () => {
    const wrapper = mount(DataList, {
      props: {
        scrollable: true,
      },
    });

    expect(wrapper.classes()).toContain('data-list--scrollable');
  });
});
