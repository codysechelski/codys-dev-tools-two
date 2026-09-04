<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import AppButton from '@/components/AppButton.vue';
import type { IconName } from '@/icons';

const props = withDefaults(
  defineProps<{
    value?: string;
    copy?: () => Promise<void> | void;
    label?: string;
    copiedLabel?: string;
    errorLabel?: string;
    variant?: 'primary' | 'secondary' | 'muted' | 'ghost' | 'field';
    icon?: IconName;
    disabled?: boolean;
    resetKey?: string | number;
  }>(),
  {
    value: '',
    copy: undefined,
    label: 'Copy',
    copiedLabel: 'Copied',
    errorLabel: 'Copy failed',
    variant: 'muted',
    icon: 'copy',
    disabled: false,
    resetKey: undefined,
  },
);

const status = ref<'idle' | 'copied' | 'error'>('idle');
let buttonEl: HTMLElement | undefined;
let resetTimeout: number | undefined;

const displayLabel = computed(() => {
  if (status.value === 'copied') return props.copiedLabel;
  if (status.value === 'error') return props.errorLabel;
  return props.label;
});
const displayVariant = computed(() => {
  if (status.value === 'copied') return 'success';
  if (status.value === 'error') return 'destructive';
  return props.variant;
});
const displayIcon = computed(() => {
  if (status.value === 'copied') return 'checkCircle';
  if (status.value === 'error') return 'timesCircle';
  return props.icon;
});

watch(
  () => props.resetKey,
  () => {
    if (status.value === 'idle') return;
    window.clearTimeout(resetTimeout);
    void animateWidthChange(() => {
      status.value = 'idle';
    });
  },
);

onBeforeUnmount(() => {
  window.clearTimeout(resetTimeout);
});

function setButtonRef(instance: unknown): void {
  buttonEl = (instance as { $el?: HTMLElement } | null)?.$el;
}

async function handleClick(): Promise<void> {
  if (props.disabled) return;

  try {
    if (props.copy) {
      await props.copy();
    } else {
      if (!props.value) return;
      await navigator.clipboard.writeText(props.value);
    }
    await applyStatus('copied', 1400);
  } catch {
    await applyStatus('error', 1800);
  }
}

async function applyStatus(next: 'copied' | 'error', duration: number): Promise<void> {
  await animateWidthChange(() => {
    status.value = next;
  });

  window.clearTimeout(resetTimeout);
  resetTimeout = window.setTimeout(() => {
    void animateWidthChange(() => {
      status.value = 'idle';
    });
  }, duration);
}

async function animateWidthChange(mutate: () => void): Promise<void> {
  const el = buttonEl;
  if (!el) {
    mutate();
    return;
  }

  const startWidth = el.getBoundingClientRect().width;
  mutate();
  await nextTick();

  const endWidth = el.getBoundingClientRect().width;
  el.style.width = `${startWidth}px`;
  void el.offsetWidth;

  requestAnimationFrame(() => {
    el.style.width = `${endWidth}px`;
  });

  window.setTimeout(() => {
    el.style.width = '';
  }, 220);
}
</script>

<template>
  <AppButton
    class="app-copy-button"
    :ref="setButtonRef"
    :variant="displayVariant"
    :icon="displayIcon"
    :disabled="disabled"
    @click="handleClick"
  >
    {{ displayLabel }}
  </AppButton>
</template>
