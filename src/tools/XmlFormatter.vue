<script setup lang="ts">
import { computed, ref } from 'vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { usePersistedToolState } from '@/toolState';
import { defaultIndentStyle, defaultPreserveBlankLines, defaultPreserveComments } from '@/formatterDefaults';
import { formatXml, type CodeIndentation, type CodeOutputMode } from './codeFormatters';

const input = ref(`<?xml version="1.0" encoding="UTF-8"?>\n<catalog><book id="1"><title>Paste XML here</title></book></catalog>`);
const outputMode = ref<CodeOutputMode>('formatted');
const indentation = ref<CodeIndentation>(defaultIndentStyle.value);
const preserveComments = ref(defaultPreserveComments.value);
const preserveBlankLines = ref(defaultPreserveBlankLines.value);
const wrapTextNodes = ref(true);
const collapseWhitespace = ref(false);
const selfCloseEmptyTags = ref(false);

usePersistedToolState('xml-formatter', {
  input,
  outputMode,
  indentation,
  preserveComments,
  preserveBlankLines,
  wrapTextNodes,
  collapseWhitespace,
  selfCloseEmptyTags,
});

const result = computed(() =>
  formatXml(input.value, {
    mode: outputMode.value,
    indentation: indentation.value,
    preserveComments: preserveComments.value,
    preserveBlankLines: preserveBlankLines.value,
    xmlWrapTextNodes: wrapTextNodes.value,
    xmlCollapseWhitespace: collapseWhitespace.value,
    xmlSelfCloseEmptyTags: selfCloseEmptyTags.value,
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
</script>

<template>
  <section class="formatter-tool">
    <ToolToolbar>
      <AppSelect v-model="outputMode" label="Output" :options="outputModeOptions" />
      <AppSelect v-model="indentation" label="Indent" :options="indentationOptions" />
      <AppToggle v-model="preserveComments" label="Preserve comments" description="Keep XML comments in formatted or minified output." />
      <AppToggle v-model="preserveBlankLines" label="Preserve blank lines" description="Keep intentional blank lines where possible in formatted output." />
      <AppToggle v-model="wrapTextNodes" label="Wrap text nodes" description="Place element text content on its own indented line instead of keeping it beside its tag." />
      <AppToggle v-model="collapseWhitespace" label="Collapse whitespace" description="Reduce runs of whitespace before formatting or minifying XML." />
      <AppToggle v-model="selfCloseEmptyTags" label="Self-close empty tags" description="Collapse empty elements like <tag></tag> into <tag/>." />
      <template #badge>
        <ToolbarStatusBadge v-if="parseError" variant="error" :label="parseError" />
        <ToolbarStatusBadge v-else label="Valid XML" />
      </template>
    </ToolToolbar>
    <div class="formatter-tool__editors">
      <TextEditor v-model="input" label="Input" language="xml" placeholder="Paste XML here" />
      <TextEditor :model-value="formattedOutput" label="Formatted Output" language="xml" readonly placeholder="Formatted XML will appear here" />
    </div>
  </section>
</template>
