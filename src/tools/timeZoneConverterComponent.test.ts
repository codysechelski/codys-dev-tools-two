import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AppSelect from '@/components/forms/AppSelect.vue';
import TimeZoneConverter from './TimeZoneConverter.vue';
import { canonicalZone, formatTime, zonedParts } from './timeZoneConverter';

describe('TimeZoneConverter', () => {
  afterEach(() => vi.useRealTimers());

  it('opens at now in the own zone, with the own zone first', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T12:34:00Z'));
    const wrapper = mount(TimeZoneConverter);
    const zone = canonicalZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    expect(wrapper.find('.time-zone-converter__time input').element.value).toBe(formatTime(zonedParts(Date.now(), zone).minutes));
    expect(wrapper.findAllComponents(AppSelect)[0]!.props('modelValue')).toBe(zone);
    expect(wrapper.find('.time-zone-converter__row').text()).toContain('Current zone');
    wrapper.unmount();
  });

  it('updates rows immediately, preserves wall time on zone change, and steps over midnight', async () => {
    const wrapper = mount(TimeZoneConverter);
    await wrapper.find('input[placeholder="YYYY-MM-DD"]').setValue('2026-07-01');
    await wrapper.find('.time-zone-converter__time input').setValue('23:55');
    wrapper.findAllComponents(AppSelect)[0]!.vm.$emit('update:modelValue', 'UTC');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.time-zone-converter__time input').element.value).toBe('23:55');
    expect(wrapper.text()).toContain('16:55');
    await wrapper.find('[aria-label="Forward 15 minutes"]').trigger('click');
    expect(wrapper.find('.time-zone-converter__time input').element.value).toBe('00:10');
    expect(wrapper.find('input[placeholder="YYYY-MM-DD"]').element.value).toBe('2026-07-02');
    await wrapper.find('[aria-label="Back 15 minutes"]').trigger('click');
    expect(wrapper.find('.time-zone-converter__time input').element.value).toBe('23:55');
    wrapper.unmount();
  });

  it('clears results and reports invalid input and missing DST times', async () => {
    const wrapper = mount(TimeZoneConverter);
    await wrapper.find('.time-zone-converter__time input').setValue('25:00');
    expect(wrapper.find('[role="alert"]').text()).toContain('Enter a time');
    expect(wrapper.findAll('.time-zone-converter__row')).toHaveLength(0);
    await wrapper.find('input[placeholder="YYYY-MM-DD"]').setValue('2026-03-08');
    await wrapper.find('.time-zone-converter__time input').setValue('02:30');
    wrapper.findAllComponents(AppSelect)[0]!.vm.$emit('update:modelValue', 'America/New_York');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[role="alert"]').text()).toContain('does not exist');
    wrapper.unmount();
  });

  it('adds and removes additional zones without allowing default rows to be removed', async () => {
    const wrapper = mount(TimeZoneConverter);
    const count = wrapper.findAll('.time-zone-converter__row').length;
    wrapper.findAllComponents(AppSelect)[1]!.vm.$emit('update:modelValue', 'Asia/Katmandu');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[aria-label="Add selected time zone"]').trigger('click');
    expect(wrapper.findAll('.time-zone-converter__row')).toHaveLength(count + 1);
    const remove = wrapper.findAll('button[aria-label^="Remove "]');
    expect(remove).toHaveLength(1);
    await remove[0]!.trigger('click');
    expect(wrapper.findAll('.time-zone-converter__row')).toHaveLength(count);
    wrapper.unmount();
  });
});
