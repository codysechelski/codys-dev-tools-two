import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import UuidGenerator from './UuidGenerator.vue';

describe('UuidGenerator', () => {
  it('renders UUID options and output editor', async () => {
    const wrapper = mount(UuidGenerator);

    expect(wrapper.text()).toContain('Count');
    await wrapper.find('[role="combobox"]').trigger('click');
    expect(wrapper.findAll('[role="option"]').map((option) => option.text())).toEqual(['1', '5', '20', '50', '100']);
    expect(wrapper.text()).toContain('Uppercase');
    expect(wrapper.text()).toContain('No hyphens');
    expect(wrapper.text()).not.toContain('Generate');
    expect(wrapper.findComponent(TextEditor).exists()).toBe(true);
  });

  it('generates output from selected options', async () => {
    const randomUUID = vi.spyOn(crypto, 'randomUUID').mockReturnValue('123e4567-e89b-42d3-a456-426614174000');
    const wrapper = mount(UuidGenerator);

    await wrapper.find('[role="combobox"]').trigger('click');
    await wrapper.find('[data-value="1"]').trigger('click');
    await wrapper.findAll('button[role="switch"]')[0].trigger('click');
    await wrapper.findAll('button[role="switch"]')[1].trigger('click');

    expect(wrapper.findComponent(TextEditor).props('modelValue')).toBe('123E4567E89B42D3A456426614174000');

    randomUUID.mockRestore();
  });
});
