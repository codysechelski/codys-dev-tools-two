<script setup lang="ts">
import { computed, ref } from 'vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { usePersistedToolState } from '@/toolState';
import { defaultIndentStyle, defaultPreserveBlankLines, defaultPreserveComments } from '@/formatterDefaults';
import { formatJavaScript, type CodeIndentation, type CodeOutputMode } from './codeFormatters';

const input = ref(`function greet(name){const message='Hello, '+name;return message;}`);
const outputMode = ref<CodeOutputMode>('formatted');
const indentation = ref<CodeIndentation>(defaultIndentStyle.value);
const preserveComments = ref(defaultPreserveComments.value);
const preserveBlankLines = ref(defaultPreserveBlankLines.value);
const semicolons = ref<'preserve' | 'add' | 'remove'>('preserve');
const quoteStyle = ref<'preserve' | 'single' | 'double'>('preserve');
const trailingCommas = ref<'preserve' | 'remove'>('preserve');

usePersistedToolState('javascript-formatter', {
  input,
  outputMode,
  indentation,
  preserveComments,
  preserveBlankLines,
  semicolons,
  quoteStyle,
  trailingCommas,
});

const result = computed(() =>
  formatJavaScript(input.value, {
    mode: outputMode.value,
    indentation: indentation.value,
    preserveComments: preserveComments.value,
    preserveBlankLines: preserveBlankLines.value,
    jsSemicolons: semicolons.value,
    jsQuoteStyle: quoteStyle.value,
    jsTrailingCommas: trailingCommas.value,
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
const semicolonOptions: Array<{ label: string; value: 'preserve' | 'add' | 'remove' }> = [
  { label: 'Preserve', value: 'preserve' },
  { label: 'Add', value: 'add' },
  { label: 'Remove', value: 'remove' },
];
const quoteStyleOptions: Array<{ label: string; value: 'preserve' | 'single' | 'double' }> = [
  { label: 'Preserve', value: 'preserve' },
  { label: 'Single', value: 'single' },
  { label: 'Double', value: 'double' },
];
const trailingCommaOptions: Array<{ label: string; value: 'preserve' | 'remove' }> = [
  { label: 'Preserve', value: 'preserve' },
  { label: 'Remove', value: 'remove' },
];
</script>

<template>
  <section class="formatter-tool">
    <ToolToolbar>
      <AppSelect v-model="outputMode" label="Output" :options="outputModeOptions" />
      <AppSelect v-model="indentation" label="Indent" :options="indentationOptions" />
      <AppSelect v-model="semicolons" label="Semicolons" :options="semicolonOptions" />
      <AppSelect v-model="quoteStyle" label="Quote style" :options="quoteStyleOptions" />
      <AppSelect v-model="trailingCommas" label="Trailing commas" :options="trailingCommaOptions" />
      <AppToggle v-model="preserveComments" label="Preserve comments" description="Keep line and block comments in formatted or minified output." />
      <AppToggle v-model="preserveBlankLines" label="Preserve blank lines" description="Keep intentional blank lines where possible in formatted output." />
      <template #badge>
        <ToolbarStatusBadge v-if="parseError" variant="error" :label="parseError" />
        <ToolbarStatusBadge v-else label="Valid JavaScript" />
      </template>
    </ToolToolbar>
    <div class="formatter-tool__editors">
      <TextEditor v-model="input" label="Input" language="javascript" placeholder="Paste JavaScript here" />
      <TextEditor :model-value="formattedOutput" label="Formatted Output" language="javascript" readonly placeholder="Formatted JavaScript will appear here" />
    </div>
  </section>
</template>
