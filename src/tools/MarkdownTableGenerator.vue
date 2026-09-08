<script setup lang="ts">
import { computed, ref } from 'vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppTextInput from '@/components/forms/AppTextInput.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { usePersistedToolState } from '@/toolState';
import { convertTableToMarkdown, type TableAlignment, type TableDelimiter, type TableOutputMode } from './markdownTableConverter';

const input = ref(`Tool,Category,Keywords
JSON Formatter,Formatters,"json, validate, minify"
Markdown Table Generator,Converters,"csv, tsv, table, markdown"`);
const delimiter = ref<TableDelimiter>('auto');
const customDelimiter = ref('');
const hasHeaderRow = ref(true);
const trimCells = ref(true);
const alignment = ref<TableAlignment>('none');
const outputMode = ref<TableOutputMode>('aligned');

usePersistedToolState('markdown-table-generator', { input, delimiter, customDelimiter, hasHeaderRow, trimCells, alignment, outputMode });

const result = computed(() =>
  convertTableToMarkdown(input.value, {
    delimiter: delimiter.value,
    customDelimiter: customDelimiter.value,
    hasHeaderRow: hasHeaderRow.value,
    trimCells: trimCells.value,
    alignment: alignment.value,
    outputMode: outputMode.value,
  }),
);
const output = computed(() => result.value.output);

const statusVariant = computed<'error' | 'warning' | 'success'>(() => {
  if (result.value.error) return 'error';
  if (result.value.warning) return 'warning';
  return 'success';
});
const statusLabel = computed(() => {
  if (result.value.error) return result.value.error;
  if (result.value.warning) return result.value.warning;
  if (!input.value.trim()) return 'Paste tabular data to begin';

  const detectedSuffix = delimiter.value === 'auto' && result.value.detectedDelimiter ? ` · detected ${delimiterLabels[result.value.detectedDelimiter]}` : '';
  const columns = `${result.value.columnCount} column${result.value.columnCount === 1 ? '' : 's'}`;
  const rows = `${result.value.rowCount} row${result.value.rowCount === 1 ? '' : 's'}`;
  return `${columns} × ${rows}${detectedSuffix}`;
});

const delimiterLabels: Record<Exclude<TableDelimiter, 'auto' | 'custom'>, string> = {
  comma: 'comma',
  tab: 'tab',
  semicolon: 'semicolon',
  pipe: 'pipe',
};
const delimiterOptions: Array<{ label: string; value: TableDelimiter }> = [
  { label: 'Auto-detect', value: 'auto' },
  { label: 'Comma (CSV)', value: 'comma' },
  { label: 'Tab (Excel/TSV)', value: 'tab' },
  { label: 'Semicolon', value: 'semicolon' },
  { label: 'Pipe / Markdown', value: 'pipe' },
  { label: 'Custom', value: 'custom' },
];
const alignmentOptions: Array<{ label: string; value: TableAlignment }> = [
  { label: 'None', value: 'none' },
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
];
const outputModeOptions: Array<{ label: string; value: TableOutputMode }> = [
  { label: 'Aligned', value: 'aligned' },
  { label: 'Compact', value: 'compact' },
];
</script>

<template>
  <section class="formatter-tool">
    <ToolToolbar>
      <AppSelect
        v-model="delimiter"
        label="Delimiter"
        description="Auto-detect looks for the most consistent comma, tab, semicolon, or pipe split across the pasted lines. Pick Pipe / Markdown to reflow a table you already pasted as markdown."
        :options="delimiterOptions"
      />
      <AppTextInput v-if="delimiter === 'custom'" v-model="customDelimiter" label="Custom delimiter" placeholder="One or more characters" />
      <AppSelect v-model="alignment" label="Alignment" description="Column alignment applied to every column via the header separator row." :options="alignmentOptions" />
      <AppSelect v-model="outputMode" label="Output" description="Aligned pads every column so the pipes line up in the raw markdown source. Compact uses minimal spacing." :options="outputModeOptions" />
      <AppToggle v-model="hasHeaderRow" label="First row is header" description="Treat the first pasted line as column headers instead of data." />
      <AppToggle v-model="trimCells" label="Trim cells" description="Remove leading and trailing whitespace from each parsed cell." />
      <template #badge>
        <ToolbarStatusBadge :variant="statusVariant" :label="statusLabel" />
      </template>
    </ToolToolbar>

    <div class="formatter-tool__editors markdown-table-tool__editors">
      <TextEditor v-model="input" label="Input" language="text" placeholder="Paste a table copied from a webpage, spreadsheet, CSV, TSV, or markdown" />
      <div class="markdown-table-tool__output-column">
        <TextEditor :model-value="output" label="Markdown Table" language="text" readonly placeholder="The generated markdown table will appear here" />
        <MarkdownPreview :markdown="output" label="Table Preview" />
      </div>
    </div>
  </section>
</template>
