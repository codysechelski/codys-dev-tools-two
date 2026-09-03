import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import AppModal from './AppModal.vue';

describe('AppModal', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders title, subtitle, icon, body, and close button when open', async () => {
    const wrapper = mount(AppModal, {
      props: {
        open: true,
        title: 'Invalid JSON',
        subtitle: 'Review the parser message.',
        icon: 'code',
      },
      slots: {
        default: 'Modal body',
      },
      attachTo: document.body,
    });

    expect(document.body.textContent).toContain('Invalid JSON');
    expect(document.body.textContent).toContain('Review the parser message.');
    expect(document.body.textContent).toContain('Modal body');
    expect(document.body.querySelector('.modal__icon')).not.toBeNull();

    document.body.querySelector<HTMLButtonElement>('.modal__close')?.click();
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('only renders a footer when footer content is provided', () => {
    mount(AppModal, {
      props: {
        open: true,
        title: 'No Footer',
      },
      attachTo: document.body,
    });

    expect(document.body.querySelector('.modal__footer')).toBeNull();
  });
});
