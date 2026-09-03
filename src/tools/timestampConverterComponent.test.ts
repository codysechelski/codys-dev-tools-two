import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TimestampConverter from './TimestampConverter.vue';

describe('TimestampConverter', () => {
  it('renders all timestamp input methods and timestamp outputs', async () => {
    const wrapper = mount(TimestampConverter);

    expect(wrapper.text()).toContain('Date Builder');
    expect(wrapper.text()).toContain('Display time zone');
    expect(wrapper.text()).toContain('Input format');
    expect(wrapper.text()).toContain('Set To');
    expect(wrapper.text()).toContain('Date Picker');
    expect(wrapper.text()).toContain('Parse Timestamp');
    expect(wrapper.find('.timestamp-builder.data-list').exists()).toBe(false);
    expect(wrapper.findAll('.timestamp-output-list .data-list__row').length).toBeGreaterThan(3);
    expect(wrapper.text()).toContain('Year');
    expect(wrapper.text()).toContain('Unix time');
    expect(wrapper.text()).toContain('Day of year');
  });

  it('renders date picker fields alongside the other inputs', () => {
    const wrapper = mount(TimestampConverter);

    expect(wrapper.find('.timestamp-picker-row').exists()).toBe(true);
    expect(wrapper.text()).toContain('Time');
    expect(wrapper.text()).toContain('Millisecond');
    expect(wrapper.text()).toContain('Unix time');
  });

  it('switches to parse mode and detects unix seconds', async () => {
    const wrapper = mount(TimestampConverter);
    const parseInput = wrapper.findAll('input').find((input) => input.attributes('placeholder') === 'Unix seconds, milliseconds, or ISO 8601');

    await parseInput?.setValue('0');

    expect(wrapper.text()).toContain('Timestamp input');
    expect(wrapper.text()).toContain('Unix seconds');
    expect(wrapper.text()).toContain('1970');
  });

  it('sets the active timestamp from a relative Set To option', async () => {
    const wrapper = mount(TimestampConverter);
    const selects = wrapper.findAll('[role="combobox"]');

    await selects[2].trigger('click');
    await wrapper.find('[data-value="plus-1-day"]').trigger('click');

    expect(wrapper.find('[aria-label="Set To"]').text()).toContain('Now + 1 day');
    expect(wrapper.find('.timestamp-output-list').text()).toContain('Unix time');
  });
});
