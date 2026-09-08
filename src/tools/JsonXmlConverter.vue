<script setup lang="ts">
import { computed, ref } from 'vue';
import AppButton from '@/components/AppButton.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppTextInput from '@/components/forms/AppTextInput.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { usePersistedToolState } from '@/toolState';
import { defaultIndentStyle, defaultSortKeys } from '@/formatterDefaults';
import { convertJsonXml, type JsonXmlDirection, type JsonXmlIndentation } from './jsonXmlConverter';

const input = ref(`{
  "name": "Cody's Dev Tools",
  "tools": ["JSON Formatter", "XML Formatter", "JSON/XML Converter"]
}`);
const direction = ref<JsonXmlDirection>('json-to-xml');
const indentation = ref<JsonXmlIndentation>(defaultIndentStyle.value);
const rootElement = ref('root');
const sortKeys = ref(defaultSortKeys.value);
const includeAttributes = ref(true);

usePersistedToolState('json-xml-converter', { input, direction, indentation, rootElement, sortKeys, includeAttributes });

const result = computed(() =>
  convertJsonXml(input.value, {
    direction: direction.value,
    indentation: indentation.value,
    rootElement: rootElement.value,
    sortKeys: sortKeys.value,
    includeAttributes: includeAttributes.value,
  }),
);
const output = computed(() => result.value.output);
const error = computed(() => result.value.error);
const inputLanguage = computed(() => (direction.value === 'json-to-xml' ? 'json' : 'xml'));
const outputLanguage = computed(() => (direction.value === 'xml-to-json' ? 'json' : 'xml'));

const directionOptions: Array<{ label: string; value: JsonXmlDirection }> = [
  { label: 'JSON to XML', value: 'json-to-xml' },
  { label: 'XML to JSON', value: 'xml-to-json' },
];
const indentationOptions: Array<{ label: string; value: JsonXmlIndentation }> = [
  { label: '2 spaces', value: '2-spaces' },
  { label: '4 spaces', value: '4-spaces' },
  { label: 'Tabs', value: 'tabs' },
];

function flipDirection(): void {
  const previousOutput = output.value;

  direction.value = direction.value === 'json-to-xml' ? 'xml-to-json' : 'json-to-xml';
  if (previousOutput) input.value = previousOutput;
}
</script>

<template>
  <section class="converter-tool">
    <ToolToolbar>
      <AppSelect v-model="direction" label="Mode" :options="directionOptions" />
      <AppButton variant="field" icon="exchangeAlt" icon-only aria-label="Swap input and output" @click="flipDirection" />
      <AppTextInput
        v-if="direction === 'json-to-xml'"
        v-model="rootElement"
        label="Root element"
        description="Element name used to wrap JSON that doesn't already have a single top-level key."
        placeholder="root"
      />
      <AppSelect v-model="indentation" label="Indent" :options="indentationOptions" />
      <AppToggle
        v-model="includeAttributes"
        label="Include attributes"
        description="Read and write XML attributes as @_-prefixed JSON properties instead of dropping them."
      />
      <AppToggle v-model="sortKeys" label="Sort keys" description="Alphabetize object keys recursively before writing output." />
      <template #badge>
        <ToolbarStatusBadge v-if="error" variant="error" :label="error" />
        <ToolbarStatusBadge v-else label="Ready" />
      </template>
    </ToolToolbar>

    <div class="formatter-tool__editors">
      <TextEditor v-model="input" label="Input" :language="inputLanguage" placeholder="Paste JSON or XML here" />
      <TextEditor :model-value="error || output" label="Output" :language="outputLanguage" readonly placeholder="Converted output will appear here" />
    </div>
  </section>
</template>
