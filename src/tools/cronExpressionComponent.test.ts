import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import CronExpressionTool from './CronExpressionTool.vue';

describe('CronExpressionTool', () => {
  it('renders expression builder and parser output', () => {
    const wrapper = mount(CronExpressionTool);

    expect(wrapper.text()).toContain('Cron expression');
    expect(wrapper.text()).toContain('Minute');
    expect(wrapper.text()).toContain('Next Runs');
    expect(wrapper.text()).toContain('Five fields');
  });

  it('applies presets', async () => {
    const wrapper = mount(CronExpressionTool);

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="hourly"]').trigger('click');

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('0 * * * *');
  });

  it('updates day, month, and weekday fields from selects', async () => {
    const wrapper = mount(CronExpressionTool);
    const selects = wrapper.findAll('[role="combobox"]');

    await selects[1].trigger('click');
    await wrapper.find('[data-value="1"]').trigger('click');
    await selects[2].trigger('click');
    await wrapper.find('[data-value="jan"]').trigger('click');
    await selects[3].trigger('click');
    await wrapper.find('[data-value="mon"]').trigger('click');

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('*/15 9-17 1 jan mon');
  });

  it('copies the parsed expression', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const wrapper = mount(CronExpressionTool);

    await wrapper.find('.cron-summary-panel__copy-row .app-button').trigger('click');

    expect(writeText).toHaveBeenCalledWith('*/15 9-17 * * mon-fri');
  });
});
