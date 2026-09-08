<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';
import AppCopyButton from '@/components/AppCopyButton.vue';

const props = defineProps<{
  markdown: string;
  label: string;
}>();

const html = computed(() => (props.markdown.trim() ? marked.parse(props.markdown, { async: false, gfm: true, breaks: false }) : ''));

async function copyFormatted(): Promise<void> {
  if (!html.value) return;

  if ('ClipboardItem' in window && navigator.clipboard.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html.value], { type: 'text/html' }),
        'text/plain': new Blob([props.markdown], { type: 'text/plain' }),
      }),
    ]);
  } else {
    await navigator.clipboard.writeText(props.markdown);
  }
}
</script>

<template>
  <section class="markdown-preview">
    <header class="markdown-preview__toolbar">
      <strong>{{ label }}</strong>
      <AppCopyButton :copy="copyFormatted" size="sm" :disabled="!html" />
    </header>
    <div v-if="html" class="markdown-preview__body" v-html="html" />
    <p v-else class="markdown-preview__empty">Nothing to preview yet.</p>
  </section>
</template>
