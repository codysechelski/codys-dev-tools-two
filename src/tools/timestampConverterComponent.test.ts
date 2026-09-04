import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TimestampConverter from './TimestampConverter.vue';

describe('TimestampConverter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders all timestamp input methods and timestamp outputs', async () => {
    const wrapper = mount(TimestampConverter);

    expect(wrapper.text()).toContain('Date Builder');
    expect(wrapper.text()).toContain('Display time zone');
    expect(wrapper.text()).toContain('Input format');
    expect(wrapper.text()).toContain('Now');
    expect(wrapper.text()).not.toContain('Set To');
    expect(wrapper.text()).toContain('Date Picker');
    expect(wrapper.text()).toContain('Parse Timestamp');
    expect(wrapper.find('.timestamp-builder.data-list').exists()).toBe(false);
    expect(wrapper.findAll('.timestamp-output-list .data-list__row').length).toBeGreaterThan(3);
    expect(wrapper.text()).toContain('Year');
    expect(wrapper.text()).toContain('Unix time');
    expect(wrapper.text()).toContain('Day of year');
  });

  it('orders parse timestamp, date picker, then date builder', () => {
    const wrapper = mount(TimestampConverter);
    const inputPanel = wrapper.find('.timestamp-tool__input-panel');
    const sections = inputPanel.findAll('.timestamp-input-section');

    expect(sections.map((section) => section.find('h4').text())).toEqual(['Parse Timestamp', 'Date Picker', 'Date Builder']);
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

    expect(wrapper.text()).toContain('Timestamp');
    expect(wrapper.text()).toContain('Unix seconds');
    expect(wrapper.text()).toContain('1970');
  });

  it('sets all timestamp inputs to the current date from the Now button', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-04T16:30:45.123Z'));
    const wrapper = mount(TimestampConverter);
    const parseInput = wrapper.findAll('input').find((input) => input.attributes('placeholder') === 'Unix seconds, milliseconds, or ISO 8601');

    await parseInput?.setValue('0');
    await wrapper.findAll('button').find((button) => button.text() === 'Now')?.trigger('click');

    const inputs = wrapper.findAll('input');
    const yearInput = inputs.find((input) => input.attributes('step') === '1' && input.attributes('value') === '2026');

    expect(parseInput?.element.value).toBe(Math.floor(new Date('2026-09-04T16:30:45.123Z').getTime() / 1000).toString());
    expect(yearInput?.exists()).toBe(true);
    expect(wrapper.find('.timestamp-output-list').text()).toContain('Unix time');
  });

  it('formats the timestamp input from Now using the selected input format', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-04T16:30:45.123Z'));
    const wrapper = mount(TimestampConverter);
    const parseInput = wrapper.findAll('input').find((input) => input.attributes('placeholder') === 'Unix seconds, milliseconds, or ISO 8601');

    await wrapper.find('.timestamp-parse-row [role="combobox"]').trigger('click');
    await wrapper.find('[data-value="unix-milliseconds"]').trigger('click');
    await wrapper.findAll('button').find((button) => button.text() === 'Now')?.trigger('click');

    expect(parseInput?.element.value).toBe('1788539445123');

    await wrapper.find('.timestamp-parse-row [role="combobox"]').trigger('click');
    await wrapper.find('[data-value="iso-8601"]').trigger('click');
    await wrapper.findAll('button').find((button) => button.text() === 'Now')?.trigger('click');

    expect(parseInput?.element.value).toBe('2026-09-04T16:30:45.123Z');

    await wrapper.find('.timestamp-parse-row [role="combobox"]').trigger('click');
    await wrapper.find('[data-value="auto"]').trigger('click');
    await wrapper.findAll('button').find((button) => button.text() === 'Now')?.trigger('click');

    expect(parseInput?.element.value).toBe('1788539445');
  });

  it('parses RFC 5545 (iCalendar) timestamps and shows the matching output row', async () => {
    const wrapper = mount(TimestampConverter);
    const parseInput = wrapper.findAll('input').find((input) => input.attributes('placeholder') === 'Unix seconds, milliseconds, or ISO 8601');

    await wrapper.find('.timestamp-tool__toolbar [role="combobox"]').trigger('click');
    await wrapper.find('[data-value="utc"]').trigger('click');
    await wrapper.find('.timestamp-parse-row [role="combobox"]').trigger('click');
    await wrapper.find('[data-value="rfc-5545"]').trigger('click');
    await nextTick();
    await new Promise((resolve) => window.setTimeout(resolve));
    await parseInput?.setValue('20260831T184759Z');
    await nextTick();

    expect(wrapper.find('.timestamp-tool__toolbar').text()).not.toContain('Error - click for details');
    expect(wrapper.find('.timestamp-output-list').text()).toContain('RFC 5545 (iCalendar)');
    expect(wrapper.find('.timestamp-output-list').text()).toContain('20260831T184759Z');
  });

  it('filters timestamp input characters for the selected input format', async () => {
    const wrapper = mount(TimestampConverter);
    const parseInput = wrapper.findAll('input').find((input) => input.attributes('placeholder') === 'Unix seconds, milliseconds, or ISO 8601');

    await wrapper.find('.timestamp-parse-row [role="combobox"]').trigger('click');
    await wrapper.find('[data-value="unix-seconds"]').trigger('click');
    await nextTick();
    await new Promise((resolve) => window.setTimeout(resolve));
    await parseInput?.setValue('12abc-3');

    expect(parseInput?.element.value).toBe('12-3');

    await wrapper.find('.timestamp-parse-row [role="combobox"]').trigger('click');
    await wrapper.find('[data-value="iso-8601"]').trigger('click');
    await nextTick();
    await new Promise((resolve) => window.setTimeout(resolve));
    await parseInput?.setValue('2026-09-04T16:30:45.123Zabc');

    expect(parseInput?.element.value).toBe('2026-09-04T16:30:45.123Z');

    await wrapper.find('.timestamp-parse-row [role="combobox"]').trigger('click');
    await wrapper.find('[data-value="rfc-5545"]').trigger('click');
    await nextTick();
    await new Promise((resolve) => window.setTimeout(resolve));
    await parseInput?.setValue('20260904t163045-z');

    expect(parseInput?.element.value).toBe('20260904163045');
  });

  it('places input format in the parse timestamp section', () => {
    const wrapper = mount(TimestampConverter);

    expect(wrapper.find('.timestamp-tool__toolbar [aria-label="Input format"]').exists()).toBe(false);
    expect(wrapper.find('.timestamp-parse-row [aria-label="Input format"]').exists()).toBe(true);
  });

  it('shows a toolbar badge error and blanks output values for invalid parse input', async () => {
    const wrapper = mount(TimestampConverter, { attachTo: document.body });
    const parseInput = wrapper.findAll('input').find((input) => input.attributes('placeholder') === 'Unix seconds, milliseconds, or ISO 8601');

    await wrapper.find('.timestamp-parse-row [role="combobox"]').trigger('click');
    await wrapper.find('[data-value="unix-seconds"]').trigger('click');
    await nextTick();
    await new Promise((resolve) => window.setTimeout(resolve));
    await parseInput?.setValue('not-a-timestamp');
    await nextTick();

    expect(wrapper.find('.tool-toolbar__badge .formatter-tool__status--error').text()).toBe('Error - click for details');
    expect(wrapper.findAll('.timestamp-output-list .data-list__row').length).toBeGreaterThan(3);
    expect(wrapper.find('.timestamp-output-list').text()).toContain('Unix time');
    expect(wrapper.findAll('.timestamp-output-list code').every((value) => value.text() === '')).toBe(true);

    await wrapper.find('.tool-toolbar__badge .formatter-tool__status--error').trigger('click');
    await nextTick();

    expect(document.body.textContent).toContain('Error Details');
    expect(document.body.textContent).toContain('Invalid Unix seconds value.');

    wrapper.unmount();
  });
});
