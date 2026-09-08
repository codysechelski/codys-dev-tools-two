<script setup lang="ts">
import { computed, ref } from 'vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { usePersistedToolState } from '@/toolState';
import { defaultIndentStyle, defaultSortKeys } from '@/formatterDefaults';
import { formatJson, type JsonOutputMode } from './jsonFormatter';

const input = ref(`{
  "name": "Cody's Dev Tools",
  "platforms": ["macOS", "Windows", "Web"],
  "offlineReady": true
}`);
const outputMode = ref<JsonOutputMode>('formatted');
const indentation = ref<'2-spaces' | '4-spaces' | 'tabs'>(defaultIndentStyle.value);
const sortKeys = ref(defaultSortKeys.value);

usePersistedToolState('json-formatter', { input, outputMode, indentation, sortKeys });

const result = computed(() =>
  formatJson(input.value, {
    mode: outputMode.value,
    indentation: indentation.value,
    sortKeys: sortKeys.value,
  }),
);

const parseError = computed(() => result.value.error);
const formattedOutput = computed(() => result.value.output);

const outputModeOptions: Array<{ label: string; value: JsonOutputMode }> = [
  { label: 'Format', value: 'formatted' },
  { label: 'Minify', value: 'compact' },
  { label: 'Newline JSON', value: 'newline-delimited' },
];

const indentationOptions: Array<{ label: string; value: '2-spaces' | '4-spaces' | 'tabs' }> = [
  { label: '2 spaces', value: '2-spaces' },
  { label: '4 spaces', value: '4-spaces' },
  { label: 'Tabs', value: 'tabs' },
];
</script>

<template>
  <section class="formatter-tool">
    <ToolToolbar>
      <AppSelect
        v-model="outputMode"
        label="Output"
        :options="outputModeOptions"
      />
      <AppSelect
        v-model="indentation"
        label="Indent"
        :options="indentationOptions"
      />
      <AppToggle v-model="sortKeys" label="Sort keys" description="Alphabetize object keys recursively." />
      <template #badge>
        <ToolbarStatusBadge v-if="parseError" variant="error" :label="parseError" />
        <ToolbarStatusBadge v-else label="Valid JSON" />
      </template>
    </ToolToolbar>

    <div class="formatter-tool__editors">
      <TextEditor v-model="input" label="Input" language="json" placeholder="Paste JSON here" />
      <TextEditor
        :model-value="formattedOutput"
        label="Formatted Output"
        language="json"
        readonly
        placeholder="Formatted JSON will appear here"
      />
    </div>
  </section>
</template>
