<script setup lang="ts">
import AppCopyButton from '@/components/AppCopyButton.vue';

const props = defineProps<{
  html: string;
  label: string;
  plainText: string;
}>();

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
}
</script>

<template>
  <section class="html-preview">
    <header class="html-preview__toolbar">
      <strong>{{ label }}</strong>
      <AppCopyButton :copy="copyFormatted" :disabled="!html" />
    </header>
    <div class="html-preview__body" v-html="html" />
  </section>
</template>
