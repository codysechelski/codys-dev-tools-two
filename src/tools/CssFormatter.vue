<script setup lang="ts">
import { computed, ref } from 'vue';
import AppModal from '@/components/AppModal.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { formatCss, type CssIndentation, type CssOutputMode } from './cssFormatter';

const input = ref(`.card{display:grid;gap:1rem;color:#e5e7eb;background:rgba(7,10,24,.78)}

@media (max-width: 720px){.card{grid-template-columns:1fr}}`);
const outputMode = ref<CssOutputMode>('expanded');
const indentation = ref<CssIndentation>('2-spaces');
const sortDeclarations = ref(false);
const preserveComments = ref(true);
const isErrorModalOpen = ref(false);

const result = computed(() =>
  formatCss(input.value, {
    mode: outputMode.value,
    indentation: indentation.value,
    sortDeclarations: sortDeclarations.value,
    preserveComments: preserveComments.value,
  }),
);
const parseError = computed(() => result.value.error);
const formattedOutput = computed(() => result.value.output);

const outputModeOptions: Array<{ label: string; value: CssOutputMode }> = [
  { label: 'Expanded', value: 'expanded' },
  { label: 'Nested', value: 'nested' },
  { label: 'Compact', value: 'compact' },
  { label: 'Compressed', value: 'compressed' },
];
const indentationOptions: Array<{ label: string; value: CssIndentation }> = [
  { label: '2 spaces', value: '2-spaces' },
  { label: '4 spaces', value: '4-spaces' },
  { label: 'Tabs', value: 'tabs' },
];
</script>

<template>
  <section class="formatter-tool">
    <div class="tool-options">
      <AppSelect v-model="outputMode" label="Output" :options="outputModeOptions" />
      <AppSelect v-model="indentation" label="Indent" :options="indentationOptions" />
      <AppToggle v-model="sortDeclarations" label="Sort declarations" description="Alphabetize declarations inside simple CSS rule blocks." />
      <AppToggle v-model="preserveComments" label="Preserve comments" description="Keep block comments in formatted or minified output." />
      <div class="formatter-tool__status-slot">
        <ToolbarStatusBadge
          v-if="parseError"
          variant="error"
          label="Invalid - Click for details"
          button
          @click="isErrorModalOpen = true"
        />
        <ToolbarStatusBadge v-else label="Valid CSS" />
      </div>
    </div>

    <div class="formatter-tool__editors">
      <TextEditor v-model="input" label="Input" language="css" placeholder="Paste CSS here" />
      <TextEditor :model-value="formattedOutput" label="Formatted Output" language="css" readonly placeholder="Formatted CSS will appear here" />
    </div>

    <AppModal
      :open="isErrorModalOpen"
      title="Invalid CSS"
      subtitle="The input could not be formatted. Review the parser message below."
      icon="code"
      @close="isErrorModalOpen = false"
    >
      <TextEditor :model-value="parseError" label="Error Details" readonly />
    </AppModal>
  </section>
</template>
