import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import QrGenerator from './QrGenerator.vue';

describe('QrGenerator', () => {
  it('renders QR options, schema fields, preview, and payload editor', async () => {
    const wrapper = mount(QrGenerator);

    expect(wrapper.text()).toContain('Schema');
    expect(wrapper.text()).toContain('Output');
    expect(wrapper.text()).toContain('Error correction');
    expect(wrapper.text()).toContain('PNG medium');
    await wrapper.findAll('[role="combobox"]')[0].trigger('click');
    expect(wrapper.text()).toContain('URL');
    await wrapper.findAll('[role="combobox"]')[1].trigger('click');
    expect(wrapper.text()).toContain('PNG small');
    expect(wrapper.text()).toContain('PNG large');
    expect(wrapper.text()).toContain('PNG extra large');
    expect(wrapper.text()).not.toContain('Scale');
    expect(wrapper.text()).toContain('Copy');
    expect(wrapper.text()).toContain('Save');
    expect(wrapper.text()).not.toContain('Download');
    expect(wrapper.find('.qr-preview').exists()).toBe(true);
    expect(wrapper.findComponent(TextEditor).exists()).toBe(true);
  });

  it('switches schema fields', async () => {
    const wrapper = mount(QrGenerator);

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="wifi"]').trigger('click');

    expect(wrapper.text()).toContain('SSID');
    expect(wrapper.text()).toContain('Encryption');
    expect(wrapper.text()).toContain('Hidden network');
  });

  it('shows calendar date time picker fields', async () => {
    const wrapper = mount(QrGenerator);

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="calendar"]').trigger('click');

    expect(wrapper.find('.qr-calendar-picker').exists()).toBe(true);
    expect(wrapper.text()).toContain('Start');
    expect(wrapper.text()).toContain('End');
    expect(wrapper.text()).toContain('All Day');
  });

  it('only shows the Copy SVG Code button when SVG output is selected', async () => {
    const wrapper = mount(QrGenerator);

    expect(wrapper.text()).not.toContain('Copy SVG Code');

    await wrapper.findAll('[role="combobox"]')[1].trigger('click');
    await wrapper.find('[data-value="svg"]').trigger('click');

    expect(wrapper.text()).toContain('Copy SVG Code');
  });
});
