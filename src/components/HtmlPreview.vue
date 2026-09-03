<script setup lang="ts">
import { ref } from 'vue';
import AppButton from '@/components/AppButton.vue';

const props = defineProps<{
  html: string;
  label: string;
  plainText: string;
}>();

const copyState = ref<'idle' | 'copied'>('idle');

async function copyFormatted(): Promise<void> {
  if (!props.html) return;

  if ('ClipboardItem' in window && navigator.clipboard.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([props.html], { type: 'text/html' }),
        'text/plain': new Blob([props.plainText], { type: 'text/plain' }),
      }),
    ]);
  } else {
    await navigator.clipboard.writeText(props.plainText);
  }

  copyState.value = 'copied';
  window.setTimeout(() => {
    copyState.value = 'idle';
  }, 1200);
}
</script>

<template>
  <section class="html-preview">
    <header class="html-preview__toolbar">
      <strong>{{ label }}</strong>
      <AppButton class="text-editor__button" variant="muted" icon="copy" :disabled="!html" @click="copyFormatted">
        {{ copyState === 'copied' ? 'Copied' : 'Copy' }}
      </AppButton>
    </header>
    <div class="html-preview__body" v-html="html" />
  </section>
</template>
