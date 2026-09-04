<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppTextInput from '@/components/forms/AppTextInput.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { detectDelimiter, formatStringTemplate, type InputDelimiter, type JoinToken } from './stringTemplateFormatter';

const input = ref('1,one\n2,two');
const template = ref("The number at index {rowIndex},{colIndex} is {0} and the spelling at index {rowIndex},{colIndex} is '{1}'");
const delimiter = ref<InputDelimiter>('comma');
const customDelimiter = ref('');
const skipFirstLine = ref(false);
const trimCells = ref(true);
const lineEnding = ref<JoinToken>('lf');
const staticTextBefore = ref('');
const staticTextAfter = ref('');
const joinWith = ref<JoinToken>('lf');
const showDelimiterAutoBadge = ref(false);
let delimiterBadgeTimeout: number | undefined;

const delimiterOptions: Array<{ label: string; value: InputDelimiter }> = [
  { label: 'Comma', value: 'comma' },
  { label: 'Tab', value: 'tab' },
  { label: 'Semicolon', value: 'semicolon' },
  { label: 'Colon', value: 'colon' },
  { label: 'Dash', value: 'dash' },
  { label: 'Underscore', value: 'underscore' },
  { label: 'Pipe', value: 'pipe' },
  { label: 'Single space', value: 'space' },
  { label: 'Whitespace', value: 'whitespace' },
  { label: 'Custom', value: 'custom' },
];
const joinOptions: Array<{ label: string; value: JoinToken }> = [
  { label: 'New Line (Mac/Linux)', value: 'lf' },
  { label: 'New Line (Windows)', value: 'crlf' },
  { label: 'Comma', value: 'comma' },
  { label: 'Comma + Space', value: 'comma-space' },
  { label: 'Semicolon', value: 'semicolon' },
  { label: 'Semicolon + Space', value: 'semicolon-space' },
  { label: 'Colon', value: 'colon' },
  { label: 'Colon + Space', value: 'colon-space' },
  { label: 'Pipe', value: 'pipe' },
  { label: 'Tab', value: 'tab' },
  { label: 'Space', value: 'space' },
  { label: 'Nothing', value: 'none' },
];
const result = computed(() =>
  formatStringTemplate({
    input: input.value,
    template: template.value,
    delimiter: delimiter.value,
    customDelimiter: customDelimiter.value,
    skipFirstLine: skipFirstLine.value,
    trimCells: trimCells.value,
    lineEnding: lineEnding.value,
    staticTextBefore: staticTextBefore.value,
    staticTextAfter: staticTextAfter.value,
    joinWith: joinWith.value,
  }),
);
const output = computed(() => result.value.output);
const error = computed(() => result.value.error);
const warning = computed(() => result.value.warning);
const rowCount = computed(() => result.value.rows.length);

watch(input, (value) => {
  if (delimiter.value === 'custom') return;

  const detectedDelimiter = detectDelimiter(value);
  if (detectedDelimiter && detectedDelimiter !== delimiter.value) {
    delimiter.value = detectedDelimiter;
    flashDelimiterAutoBadge();
  }
});

function flashDelimiterAutoBadge(): void {
  showDelimiterAutoBadge.value = true;
  window.clearTimeout(delimiterBadgeTimeout);
  delimiterBadgeTimeout = window.setTimeout(() => {
    showDelimiterAutoBadge.value = false;
  }, 1000);
}
</script>

<template>
  <section class="template-tool">
    <ToolToolbar class="template-tool__toolbar">
      <AppSelect v-model="delimiter" label="Delimiter" label-badge="AUTO" :label-badge-visible="showDelimiterAutoBadge" :options="delimiterOptions" />
      <AppTextInput v-if="delimiter === 'custom'" v-model="customDelimiter" label="Custom delimiter" placeholder="One or more characters" />
      <AppSelect
        v-model="lineEnding"
        label="Line ending"
        description="Controls how each formatted row is joined in the output."
        :options="joinOptions"
      />
      <AppToggle v-model="skipFirstLine" label="Skip first line" description="Ignore the first input row when it contains table headers." />
      <AppToggle v-model="trimCells" label="Trim cells" description="Remove leading and trailing whitespace from each parsed cell." />
      <template #badge>
        <ToolbarStatusBadge v-if="error" variant="error" :label="error" />
        <ToolbarStatusBadge v-else-if="warning" variant="warning" :label="warning" />
        <ToolbarStatusBadge v-else :label="`${rowCount} rows formatted`" />
      </template>
    </ToolToolbar>

    <div class="template-tool__workspace">
      <section class="template-tool__input-panel">
        <div class="template-tool__editors">
          <TextEditor
            v-model="template"
            label="Format String"
            description="Use {0}, {1}, etc. to insert column values. Use {rowIndex} for the zero-based row number. Use {colIndex} before a column placeholder to print that column index. Escape literal braces as \{ and \}."
            language="text"
            placeholder="Use {0}, {1}, {rowIndex}, and {colIndex} placeholders"
          />
          <TextEditor v-model="input" label="Input Data" language="text" placeholder="Paste delimited rows here" />
        </div>

        <div class="template-tool__static-options">
          <AppTextInput v-model="staticTextBefore" label="Static Text Before" placeholder="Text before generated rows" />
          <AppTextInput v-model="staticTextAfter" label="Static Text After" placeholder="Text after generated rows" />
          <AppSelect v-model="joinWith" label="Join With" :options="joinOptions" />
        </div>
      </section>

      <section class="template-tool__output-panel">
        <TextEditor :model-value="error || output" label="Output" language="text" readonly placeholder="Formatted output will appear here" />
      </section>
    </div>
  </section>
</template>
