import { mount } from '@vue/test-utils';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppModal from '@/components/AppModal.vue';
import AppButton from '@/components/AppButton.vue';
import TimeZoneConverter from './TimeZoneConverter.vue';
import { canonicalZone, formatClock, prefers24Hour, zonedParts } from './timeZoneConverter';

describe('TimeZoneConverter', () => {
  afterEach(() => vi.useRealTimers());

  it('opens at now in the own zone, with the own zone first', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T12:34:00Z'));
    const wrapper = mount(TimeZoneConverter);
    const zone = canonicalZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    expect(wrapper.find('.time-zone-converter__time input').element.value).toBe(formatClock(zonedParts(Date.now(), zone).minutes, prefers24Hour()));
    expect(wrapper.find('.time-zone-converter__time').classes()).toContain('form-control--label-hidden');
    expect(wrapper.find('.time-zone-converter__time input').attributes('aria-label')).toBe('Time');
    expect(wrapper.findAllComponents(AppSelect)[0]!.props('modelValue')).toBe(zone);
    expect(wrapper.find('.time-zone-converter__row').text()).toContain('Current zone');
    wrapper.unmount();
  });

  it('updates rows immediately, preserves wall time on zone change, and steps over midnight', async () => {
    const wrapper = mount(TimeZoneConverter);
    if (!prefers24Hour()) await wrapper.find('[role="switch"]').trigger('click');
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

  it('opens the toolbar modal and adds/removes zones', async () => {
    const wrapper = mount(TimeZoneConverter);
    const count = wrapper.findAll('.time-zone-converter__row').length;
    expect(wrapper.findAllComponents(AppSelect)).toHaveLength(1);
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add time zone')!
      .trigger('click');
    expect(wrapper.findComponent(AppModal).props('open')).toBe(true);
    wrapper.findAllComponents(AppSelect)[1]!.vm.$emit('update:modelValue', canonicalZone('Asia/Kathmandu'));
    await wrapper.vm.$nextTick();
    await wrapper
      .findComponent(AppModal)
      .findAllComponents(AppButton)
      .find((button) => button.text() === 'Add time zone')!
      .trigger('click');
    expect(wrapper.findAll('.time-zone-converter__row')).toHaveLength(count + 1);
    expect(wrapper.findComponent(AppModal).props('open')).toBe(false);
    await wrapper.find('button[aria-label^="Remove Asia/Kat"]').trigger('click');
    expect(wrapper.findAll('.time-zone-converter__row')).toHaveLength(count);
    wrapper.unmount();
  });

  it('removes and restores default zones, but protects the current zone', async () => {
    const wrapper = mount(TimeZoneConverter);
    const count = wrapper.findAll('.time-zone-converter__row').length;
    expect(wrapper.find('.time-zone-converter__row').find('button[aria-label^="Remove"]').exists()).toBe(false);
    await wrapper.find('button[aria-label="Remove Eastern"]').trigger('click');
    expect(wrapper.findAll('.time-zone-converter__row')).toHaveLength(count - 1);
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add time zone')!
      .trigger('click');
    wrapper.findAllComponents(AppSelect)[1]!.vm.$emit('update:modelValue', 'America/New_York');
    await wrapper.vm.$nextTick();
    await wrapper
      .findComponent(AppModal)
      .findAllComponents(AppButton)
      .find((button) => button.text() === 'Add time zone')!
      .trigger('click');
    expect(wrapper.findAll('.time-zone-converter__row')).toHaveLength(count);
    wrapper.unmount();
  });

  it('toggles clock format without changing the selected instant or invalid input', async () => {
    const wrapper = mount(TimeZoneConverter);
    if (prefers24Hour()) await wrapper.find('[role="switch"]').trigger('click');
    await wrapper.find('.time-zone-converter__time input').setValue('11:55 PM');
    await wrapper.find('[aria-label="Forward 15 minutes"]').trigger('click');
    expect(wrapper.find('.time-zone-converter__time input').element.value).toBe(formatClock(10, false));
    const dates = wrapper.findAll('.time-zone-converter__reading span').map((item) => item.text());
    await wrapper.find('[role="switch"]').trigger('click');
    expect(wrapper.find('.time-zone-converter__time input').element.value).toBe('00:10');
    expect(wrapper.findAll('.time-zone-converter__reading span').map((item) => item.text())).toEqual(dates);
    await wrapper.find('.time-zone-converter__time input').setValue('bad');
    await wrapper.find('[role="switch"]').trigger('click');
    expect(wrapper.find('.time-zone-converter__time input').element.value).toBe('bad');
    wrapper.unmount();
  });

  it('shows country chips, day bars, and live business-hour status', async () => {
    const wrapper = mount(TimeZoneConverter);
    await wrapper.find('input[placeholder="YYYY-MM-DD"]').setValue('2026-07-01');
    wrapper.findAllComponents(AppSelect)[0]!.vm.$emit('update:modelValue', 'UTC');
    await wrapper.vm.$nextTick();
    await wrapper.find('.time-zone-converter__time input').setValue('14:30');
    expect(wrapper.find('[aria-label="United States"]').text()).toBe('🇺🇸');
    expect(wrapper.find('[aria-label="Global time"]').text()).toBe('🌐');
    const eastern = () => wrapper.findAll('.time-zone-converter__row').find((row) => row.find('strong').text() === 'Eastern')!;
    expect(eastern().find('[role="img"][aria-label^="Business hours"]').exists()).toBe(true);
    expect(eastern().findAll('.time-zone-converter__day').length).toBeGreaterThan(0);
    await wrapper.find('.time-zone-converter__time input').setValue('11:30');
    expect(eastern().find('[role="img"][aria-label^="Near business hours"]').exists()).toBe(true);
    await wrapper.find('.time-zone-converter__time input').setValue('00:00');
    expect(eastern().find('[role="img"][aria-label="Outside business hours"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('updates row offsets when the reference zone changes', async () => {
    const wrapper = mount(TimeZoneConverter);
    await wrapper.find('input[placeholder="YYYY-MM-DD"]').setValue('2026-07-01');
    await wrapper.find('.time-zone-converter__time input').setValue('09:00');
    const localSelect = wrapper.findAllComponents(AppSelect)[0]!;
    localSelect.vm.$emit('update:modelValue', 'UTC');
    await wrapper.vm.$nextTick();
    const pacific = () => wrapper.findAll('.time-zone-converter__row').find((row) => row.find('strong').text() === 'Pacific')!;
    expect(pacific().find('.time-zone-converter__offset').text()).toBe('7h behind');
    localSelect.vm.$emit('update:modelValue', 'America/Chicago');
    await wrapper.vm.$nextTick();
    expect(pacific().find('.time-zone-converter__offset').text()).toBe('2h behind');
    expect(localSelect.props('options')[0]).toMatchObject({ value: 'UTC' });
    wrapper.unmount();
  });

  it('uses the themed date-only picker and keeps picked dates independent of the system zone', async () => {
    const wrapper = mount(TimeZoneConverter);
    const picker = wrapper.findComponent(VueDatePicker);
    expect(picker.props('modelType')).toBe('yyyy-MM-dd');
    expect(picker.props('formats')).toMatchObject({ input: 'yyyy-MM-dd' });
    expect(picker.props('timeConfig')).toMatchObject({ enableTimePicker: false });
    expect(picker.props('inputAttrs')).toMatchObject({ clearable: false });
    wrapper.findAllComponents(AppSelect)[0]!.vm.$emit('update:modelValue', 'America/New_York');
    await wrapper.find('.time-zone-converter__time input').setValue('09:00');
    picker.vm.$emit('update:model-value', '2026-03-08');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('input[placeholder="YYYY-MM-DD"]').element.value).toBe('2026-03-08');
    expect(wrapper.find('.time-zone-converter__time input').element.value).toBe('09:00');
    const utc = wrapper.findAll('.time-zone-converter__row').find((row) => row.find('strong').text() === 'UTC')!;
    expect(utc.text()).toContain(formatClock(13 * 60, prefers24Hour()));
    wrapper.unmount();
  });
});
