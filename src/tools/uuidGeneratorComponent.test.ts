import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TextEditor from '@/components/TextEditor.vue';
import UuidGenerator from './UuidGenerator.vue';

describe('UuidGenerator', () => {
  it('regenerates UUIDs when the regenerate button is clicked', async () => {
    const wrapper = mount(UuidGenerator);
    const initialOutput = wrapper.findComponent(TextEditor).props('modelValue');

    await wrapper.find('[aria-label="Regenerate UUIDs"]').trigger('click');

    const nextOutput = wrapper.findComponent(TextEditor).props('modelValue');
    expect(nextOutput).not.toBe(initialOutput);
  });
});
