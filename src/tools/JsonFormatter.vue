<script setup lang="ts">
import { computed, ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import AppModal from '@/components/AppModal.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import { formatJson, type JsonOutputMode } from './jsonFormatter';

const input = ref(`{
  "name": "Cody's Dev Tools",
  "platforms": ["macOS", "Windows", "Web"],
  "offlineReady": true
}`);
const outputMode = ref<JsonOutputMode>('formatted');
const indentation = ref<'2-spaces' | '4-spaces' | 'tabs'>('2-spaces');
const sortKeys = ref(false);
const isErrorModalOpen = ref(false);

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
    <div class="tool-options">
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
      <div class="formatter-tool__status-slot">
        <button
          v-if="parseError"
          class="formatter-tool__status formatter-tool__status--error"
          type="button"
          @click="isErrorModalOpen = true"
        >
          <AppIcon name="timesCircle" />
          <span>Invalid - Click for details</span>
        </button>
        <p v-else class="formatter-tool__status">
          <AppIcon name="checkCircle" />
          <span>Valid JSON</span>
        </p>
      </div>
    </div>

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

    <AppModal
      :open="isErrorModalOpen"
      title="Invalid JSON"
      subtitle="The input could not be parsed. Review the parser message below."
      icon="code"
      @close="isErrorModalOpen = false"
    >
      <TextEditor :model-value="parseError" label="Error Details" readonly />
    </AppModal>
  </section>
</template>
