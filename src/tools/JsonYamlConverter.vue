<script setup lang="ts">
import { computed, ref } from 'vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import {
  convertJsonYaml,
  type JsonYamlDirection,
  type JsonYamlIndentation,
  type YamlLineWidth,
} from './jsonYamlConverter';

const input = ref(`{
  "name": "Cody's Dev Tools",
  "tools": ["JSON Formatter", "UUID Generator", "JSON/YAML Converter"]
}`);
const direction = ref<JsonYamlDirection>('json-to-yaml');
const jsonIndentation = ref<JsonYamlIndentation>('2-spaces');
const yamlLineWidth = ref<YamlLineWidth>('preserve');
const sortKeys = ref(false);

const result = computed(() =>
  convertJsonYaml(input.value, {
    direction: direction.value,
    jsonIndentation: jsonIndentation.value,
    yamlLineWidth: yamlLineWidth.value,
    sortKeys: sortKeys.value,
  }),
);
const output = computed(() => result.value.output);
const error = computed(() => result.value.error);
const inputLanguage = computed(() => (direction.value === 'json-to-yaml' ? 'json' : 'text'));
const outputLanguage = computed(() => (direction.value === 'yaml-to-json' ? 'json' : 'text'));

const directionOptions: Array<{ label: string; value: JsonYamlDirection }> = [
  { label: 'JSON to YAML', value: 'json-to-yaml' },
  { label: 'YAML to JSON', value: 'yaml-to-json' },
];
const indentationOptions: Array<{ label: string; value: JsonYamlIndentation }> = [
  { label: '2 spaces', value: '2-spaces' },
  { label: '4 spaces', value: '4-spaces' },
  { label: 'Tabs', value: 'tabs' },
];
const lineWidthOptions: Array<{ label: string; value: YamlLineWidth }> = [
  { label: 'Preserve', value: 'preserve' },
  { label: 'Wrap at 80', value: 'wrap-80' },
  { label: 'Wrap at 120', value: 'wrap-120' },
];
</script>

<template>
  <section class="converter-tool">
    <div class="tool-options">
      <AppSelect v-model="direction" label="Direction" :options="directionOptions" />
      <AppSelect
        v-if="direction === 'yaml-to-json'"
        v-model="jsonIndentation"
        label="JSON indent"
        :options="indentationOptions"
      />
      <AppSelect
        v-else
        v-model="yamlLineWidth"
        label="YAML width"
        description="Preserve keeps long scalar values on one line when possible. Wrapping can make prose-like values easier to read."
        :options="lineWidthOptions"
      />
      <AppToggle v-model="sortKeys" label="Sort keys" description="Alphabetize object/map keys recursively before writing output." />
      <div class="formatter-tool__status-slot">
        <ToolbarStatusBadge v-if="error" variant="error" label="Invalid input" />
        <ToolbarStatusBadge v-else label="Ready" />
      </div>
    </div>

    <div class="formatter-tool__editors">
      <TextEditor v-model="input" label="Input" :language="inputLanguage" placeholder="Paste JSON or YAML here" />
      <TextEditor :model-value="error || output" label="Output" :language="outputLanguage" readonly placeholder="Converted output will appear here" />
    </div>
  </section>
</template>
