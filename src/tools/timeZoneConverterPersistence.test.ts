import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AppButton from '@/components/AppButton.vue';
import AppModal from '@/components/AppModal.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import { initToolState, resetToolStateForTests, setRememberToolInputMode, toolStateMode } from '@/toolState';
import TimeZoneConverter from './TimeZoneConverter.vue';
import { canonicalZone, formatClock, prefers24Hour, zonedParts } from './timeZoneConverter';

const STORAGE_KEY = 'codys-dev-tools:tool-state';
const mounted = new Set<VueWrapper>();
function openTool() {
  const wrapper = mount(TimeZoneConverter);
  mounted.add(wrapper);
  return wrapper;
}

function closeTool(wrapper: VueWrapper) {
  wrapper.unmount();
  mounted.delete(wrapper);
}

async function customize(wrapper: VueWrapper) {
  wrapper.findAllComponents(AppSelect)[0]!.vm.$emit('update:modelValue', 'Asia/Tokyo');
  await nextTick();
  await wrapper.find('[role="switch"]').trigger('click');
  const use24Hour = !prefers24Hour();
  const removedLabel = wrapper.find('button[aria-label^="Remove "]').attributes('aria-label');
  await wrapper.find('button[aria-label^="Remove "]').trigger('click');
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Add time zone')!
    .trigger('click');
  wrapper.findAllComponents(AppSelect)[1]!.vm.$emit('update:modelValue', canonicalZone('Asia/Kathmandu'));
  await nextTick();
  await wrapper
    .findComponent(AppModal)
    .findAllComponents(AppButton)
    .find((button) => button.text() === 'Add time zone')!
    .trigger('click');
  await wrapper.find('input[placeholder="YYYY-MM-DD"]').setValue('2000-01-01');
  await wrapper.find('.time-zone-converter__time input').setValue('13:45');
  return { removedLabel, use24Hour };
}

function expectFreshTime(wrapper: VueWrapper, zone: string, use24Hour: boolean) {
  const parts = zonedParts(Date.now(), zone);
  expect(wrapper.find('input[placeholder="YYYY-MM-DD"]').element.value).toBe(parts.date);
  expect(wrapper.find('.time-zone-converter__time input').element.value).toBe(formatClock(parts.minutes, use24Hour));
  expect(wrapper.findAllComponents(AppSelect)[0]!.props('modelValue')).toBe(zone);
  expect(wrapper.find('[role="switch"]').attributes('aria-checked')).toBe(String(use24Hour));
}

afterEach(() => {
  mounted.forEach(closeTool);
  resetToolStateForTests();
  localStorage.clear();
  vi.useRealTimers();
});

describe('Time Zone Converter remembered preferences', () => {
  it('restores session preferences and zone edits, but starts at now in the restored zone', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T00:10Z'));
    await initToolState(false);
    toolStateMode.value = 'session';
    const first = openTool();
    const { removedLabel, use24Hour } = await customize(first);
    closeTool(first);

    vi.setSystemTime(new Date('2026-07-02T23:55Z'));
    const second = openTool();
    expectFreshTime(second, 'Asia/Tokyo', use24Hour);
    expect(second.find(`button[aria-label="${removedLabel}"]`).exists()).toBe(false);
    expect(second.find('button[aria-label^="Remove Asia/Kat"]').exists()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('restores forever preferences after a restart without storing date or time', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T00:10Z'));
    await initToolState(false);
    toolStateMode.value = 'forever';
    const first = openTool();
    const { removedLabel, use24Hour } = await customize(first);
    await vi.advanceTimersByTimeAsync(450);
    const snapshot = JSON.parse(localStorage.getItem(STORAGE_KEY)!)['time-zone-converter'];
    expect(Object.keys(snapshot).sort()).toEqual(['addedZones', 'localZone', 'removedZones', 'use24Hour']);
    expect(snapshot).toMatchObject({ localZone: 'Asia/Tokyo', use24Hour, addedZones: [canonicalZone('Asia/Kathmandu')] });
    expect(snapshot.removedZones).toHaveLength(1);
    closeTool(first);

    resetToolStateForTests();
    vi.setSystemTime(new Date('2026-12-31T23:55Z'));
    await initToolState(false);
    toolStateMode.value = 'forever';
    const second = openTool();
    expectFreshTime(second, 'Asia/Tokyo', use24Hour);
    expect(second.find(`button[aria-label="${removedLabel}"]`).exists()).toBe(false);
    expect(second.find('button[aria-label^="Remove Asia/Kat"]').exists()).toBe(true);
  });

  it('recomputes now after delayed hydration without resetting time on ordinary zone changes', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T23:55Z'));
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        'time-zone-converter': {
          localZone: 'Asia/Tokyo',
          use24Hour: true,
          addedZones: [],
          removedZones: [],
          date: '2000-01-01',
          time: '01:00',
        },
      }),
    );
    toolStateMode.value = 'forever';
    const wrapper = openTool();
    await initToolState(false);
    await nextTick();
    expectFreshTime(wrapper, 'Asia/Tokyo', true);
    await wrapper.find('.time-zone-converter__time input').setValue('09:00');
    wrapper.findAllComponents(AppSelect)[0]!.vm.$emit('update:modelValue', 'UTC');
    await nextTick();
    expect(wrapper.find('.time-zone-converter__time input').element.value).toBe('09:00');
    expect(wrapper.find('input[placeholder="YYYY-MM-DD"]').element.value).toBe('2026-07-02');
  });

  it('does not remember preferences in never mode', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T00:10Z'));
    await initToolState(false);
    const first = openTool();
    const count = first.findAll('.time-zone-converter__row').length;
    await customize(first);
    closeTool(first);
    const second = openTool();
    expectFreshTime(second, canonicalZone(Intl.DateTimeFormat().resolvedOptions().timeZone), prefers24Hour());
    expect(second.findAll('.time-zone-converter__row')).toHaveLength(count);
    expect(second.find('button[aria-label^="Remove Asia/Kat"]').exists()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('discards saved preferences when Remember tool input is turned off', async () => {
    await initToolState(false);
    toolStateMode.value = 'session';
    const first = openTool();
    await customize(first);
    closeTool(first);
    await setRememberToolInputMode('never', false);
    const second = openTool();
    expectFreshTime(second, canonicalZone(Intl.DateTimeFormat().resolvedOptions().timeZone), prefers24Hour());
    expect(second.find('button[aria-label^="Remove Asia/Kat"]').exists()).toBe(false);
  });
});
