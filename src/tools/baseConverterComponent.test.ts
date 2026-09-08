import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';
import { isToolStateReady, resetToolStateForTests, toolStateMode } from '@/toolState';
import BaseConverter from './BaseConverter.vue';

function getInput(wrapper: ReturnType<typeof mount>, label: string) {
  return wrapper
    .findAll('.form-text-input')
    .find((field) => field.find('.form-control__label-text').text() === label)!
    .find('input');
}

async function selectCustomBase(wrapper: ReturnType<typeof mount>, value: string): Promise<void> {
  await wrapper.find('[role="combobox"]').trigger('click');
  await wrapper.find(`[data-value="${value}"]`).trigger('click');
}

describe('BaseConverter', () => {
  it('renders all base rows pre-filled with a sample value', () => {
    const wrapper = mount(BaseConverter);

    expect(getInput(wrapper, 'Binary (base 2)').element.value).toBe('11111111');
    expect(getInput(wrapper, 'Octal (base 8)').element.value).toBe('377');
    expect(getInput(wrapper, 'Decimal (base 10)').element.value).toBe('255');
    expect(getInput(wrapper, 'Hexadecimal (base 16)').element.value).toBe('FF');
    expect(getInput(wrapper, 'Base 36').element.value).toBe('73');
    expect(getInput(wrapper, 'Custom').element.value).toBe('11111111');
  });

  it('updates every other field when one field changes', async () => {
    const wrapper = mount(BaseConverter);

    await getInput(wrapper, 'Hexadecimal (base 16)').setValue('1a');
    await nextTick();

    expect(getInput(wrapper, 'Binary (base 2)').element.value).toBe('11010');
    expect(getInput(wrapper, 'Octal (base 8)').element.value).toBe('32');
    expect(getInput(wrapper, 'Decimal (base 10)').element.value).toBe('26');
    expect(getInput(wrapper, 'Base 36').element.value).toBe('Q');
  });

  it('shows an inline error for an invalid digit without touching other fields', async () => {
    const wrapper = mount(BaseConverter);
    const binary = getInput(wrapper, 'Binary (base 2)');

    await binary.setValue('12');
    await binary.trigger('blur');
    await nextTick();

    expect(wrapper.text()).toContain('Enter a valid base 2 number');
    expect(getInput(wrapper, 'Decimal (base 10)').element.value).toBe('255');
  });

  it('reformats the custom field from the canonical value when the custom base changes, without reparsing its text', async () => {
    const wrapper = mount(BaseConverter);

    await selectCustomBase(wrapper, '16');
    await nextTick();

    expect(getInput(wrapper, 'Custom').element.value).toBe('FF');
  });

  it('lowercases letters across fields when the uppercase toggle is turned off', async () => {
    const wrapper = mount(BaseConverter);

    await wrapper.find('button[role="switch"]').trigger('click');
    await nextTick();

    expect(getInput(wrapper, 'Hexadecimal (base 16)').element.value).toBe('ff');
    expect(getInput(wrapper, 'Base 36').element.value).toBe('73');
  });

  it('converts using a custom base of 36', async () => {
    const wrapper = mount(BaseConverter);

    await selectCustomBase(wrapper, '36');
    await new Promise((resolve) => window.setTimeout(resolve));
    await getInput(wrapper, 'Custom').setValue('Z');
    await nextTick();

    expect(getInput(wrapper, 'Decimal (base 10)').element.value).toBe('35');
  });

  it('does not offer base 1 as a custom base option', async () => {
    const wrapper = mount(BaseConverter);

    await wrapper.find('[role="combobox"]').trigger('click');

    const optionValues = wrapper.findAll('[role="option"]').map((option) => option.attributes('data-value'));
    expect(optionValues).not.toContain('1');
    expect(optionValues[0]).toBe('2');
  });
});

describe('BaseConverter tool state persistence', () => {
  afterEach(() => {
    resetToolStateForTests();
  });

  it('restores the previously entered value after switching tools and back in session mode', async () => {
    toolStateMode.value = 'session';
    isToolStateReady.value = true;

    const first = mount(BaseConverter);
    await getInput(first, 'Hexadecimal (base 16)').setValue('1a');
    await nextTick();
    first.unmount();

    const second = mount(BaseConverter);
    expect(getInput(second, 'Hexadecimal (base 16)').element.value).toBe('1a');
    expect(getInput(second, 'Decimal (base 10)').element.value).toBe('26');
  });

  it('does not restore anything when remember-tool-input is set to never', async () => {
    toolStateMode.value = 'never';
    isToolStateReady.value = true;

    const first = mount(BaseConverter);
    await getInput(first, 'Hexadecimal (base 16)').setValue('1a');
    await nextTick();
    first.unmount();

    const second = mount(BaseConverter);
    expect(getInput(second, 'Hexadecimal (base 16)').element.value).toBe('FF');
  });
});
