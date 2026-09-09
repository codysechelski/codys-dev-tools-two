<script setup lang="ts">
import { computed, ref } from 'vue';
import AppButton from '@/components/AppButton.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { usePersistedToolState } from '@/toolState';
import { computeLineDiff } from './diffTool';

const original = ref(`Cody's Dev Tools
A focused desktop-style utility app for developers.
Paste your original text on the left, and the changed version on the right.`);
const changed = ref(`Cody's Dev Tools
A focused, offline-first utility app for developers.
Paste your original text on the left, and the changed version on the right.
Differences are highlighted in both editors.`);

const ignoreWhitespace = ref(false);

usePersistedToolState('diff-tool', { original, changed, ignoreWhitespace });

const diff = computed(() => computeLineDiff(original.value, changed.value, { ignoreWhitespace: ignoreWhitespace.value }));

const removedLineHighlights = computed(() => diff.value.removedLines.map((line) => ({ line, className: 'cm-diff-line-removed' })));
const addedLineHighlights = computed(() => diff.value.addedLines.map((line) => ({ line, className: 'cm-diff-line-added' })));

const removedWordHighlights = computed(() =>
  diff.value.removedWordRanges.map((range) => ({ from: range.from, to: range.to, className: 'cm-diff-word-removed' })),
);
const addedWordHighlights = computed(() =>
  diff.value.addedWordRanges.map((range) => ({ from: range.from, to: range.to, className: 'cm-diff-word-added' })),
);

const statusLabel = computed(() => {
  if (!original.value.trim() && !changed.value.trim()) return 'Paste text on both sides to compare';
  if (diff.value.identical) return 'No differences';

  const parts: string[] = [];
  if (diff.value.addedCount) parts.push(`+${diff.value.addedCount}`);
  if (diff.value.removedCount) parts.push(`-${diff.value.removedCount}`);
  return `${parts.join(' ')} line${diff.value.addedCount + diff.value.removedCount === 1 ? '' : 's'}`;
});

function swapSides(): void {
  const originalValue = original.value;
  original.value = changed.value;
  changed.value = originalValue;
}
</script>

<template>
  <section class="diff-tool">
    <ToolToolbar class="diff-tool__toolbar">
      <AppButton variant="field" icon="exchangeAlt" icon-only aria-label="Swap original and changed text" @click="swapSides" />
      <AppToggle v-model="ignoreWhitespace" label="Ignore whitespace" description="Treat lines that differ only in leading/trailing whitespace as unchanged." />
      <template #badge>
        <ToolbarStatusBadge :label="statusLabel" />
      </template>
    </ToolToolbar>

    <div class="diff-tool__workspace">
      <TextEditor
        v-model="original"
        label="Original"
        language="text"
        placeholder="Paste the original text here"
        :highlight-lines="removedLineHighlights"
        :highlight-ranges="removedWordHighlights"
      />

      <TextEditor
        v-model="changed"
        label="Changed"
        language="text"
        placeholder="Paste the changed text here"
        :highlight-lines="addedLineHighlights"
        :highlight-ranges="addedWordHighlights"
      />
    </div>
  </section>
</template>
