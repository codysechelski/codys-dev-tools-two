<script setup lang="ts">
import { computed, ref } from 'vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { usePersistedToolState } from '@/toolState';
import { defaultIndentStyle, defaultPreserveBlankLines, defaultPreserveComments } from '@/formatterDefaults';
import { formatHtml, type CodeIndentation, type CodeOutputMode } from './codeFormatters';

const input = ref(`<main><h1>Hello</h1><p>Paste HTML here.</p></main>`);
const outputMode = ref<CodeOutputMode>('formatted');
const indentation = ref<CodeIndentation>(defaultIndentStyle.value);
const preserveComments = ref(defaultPreserveComments.value);
const preserveBlankLines = ref(defaultPreserveBlankLines.value);
const wrapTextNodes = ref(true);
const collapseWhitespace = ref(false);
const voidTagStyle = ref<'preserve' | 'xhtml'>('preserve');

usePersistedToolState('html-formatter', {
  input,
  outputMode,
  indentation,
  preserveComments,
  preserveBlankLines,
  wrapTextNodes,
  collapseWhitespace,
  voidTagStyle,
});

const result = computed(() =>
  formatHtml(input.value, {
    mode: outputMode.value,
    indentation: indentation.value,
    preserveComments: preserveComments.value,
    preserveBlankLines: preserveBlankLines.value,
    htmlWrapTextNodes: wrapTextNodes.value,
    htmlCollapseWhitespace: collapseWhitespace.value,
    htmlVoidTagStyle: voidTagStyle.value,
  }),
);
const parseError = computed(() => result.value.error);
const formattedOutput = computed(() => result.value.output);
const outputModeOptions: Array<{ label: string; value: CodeOutputMode }> = [
  { label: 'Format', value: 'formatted' },
  { label: 'Minify', value: 'compact' },
];
const indentationOptions: Array<{ label: string; value: CodeIndentation }> = [
  { label: '2 spaces', value: '2-spaces' },
  { label: '4 spaces', value: '4-spaces' },
  { label: 'Tabs', value: 'tabs' },
];
const voidTagStyleOptions: Array<{ label: string; value: 'preserve' | 'xhtml' }> = [
  { label: 'Preserve', value: 'preserve' },
  { label: 'XHTML-style', value: 'xhtml' },
];
</script>

<template>
  <section class="formatter-tool">
    <ToolToolbar>
      <AppSelect v-model="outputMode" label="Output" :options="outputModeOptions" />
      <AppSelect v-model="indentation" label="Indent" :options="indentationOptions" />
      <AppSelect v-model="voidTagStyle" label="Void tags" :options="voidTagStyleOptions" />
      <AppToggle v-model="preserveComments" label="Preserve comments" description="Keep HTML comments in formatted or minified output." />
      <AppToggle v-model="preserveBlankLines" label="Preserve blank lines" description="Keep intentional blank lines where possible in formatted output." />
      <AppToggle v-model="wrapTextNodes" label="Wrap text nodes" description="Place text content on its own indented line instead of keeping it beside its tag." />
      <AppToggle v-model="collapseWhitespace" label="Collapse whitespace" description="Reduce runs of whitespace before formatting or minifying HTML." />
      <template #badge>
        <ToolbarStatusBadge v-if="parseError" variant="error" :label="parseError" />
        <ToolbarStatusBadge v-else label="Valid HTML" />
      </template>
    </ToolToolbar>
    <div class="formatter-tool__editors">
      <TextEditor v-model="input" label="Input" language="html" placeholder="Paste HTML here" />
      <TextEditor :model-value="formattedOutput" label="Formatted Output" language="html" readonly placeholder="Formatted HTML will appear here" />
    </div>
  </section>
</template>
