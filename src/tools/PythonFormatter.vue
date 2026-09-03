<script setup lang="ts">
import { computed, ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import AppModal from '@/components/AppModal.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import { formatPython, type CodeIndentation } from './codeFormatters';

const input = ref(`def greet(name):\nmessage = f"Hello, {name}"\nreturn message`);
const indentation = ref<CodeIndentation>('2-spaces');
const preserveComments = ref(true);
const preserveBlankLines = ref(false);
const normalizeIndentation = ref(true);
const isErrorModalOpen = ref(false);
const result = computed(() =>
  formatPython(input.value, {
    mode: 'formatted',
    indentation: indentation.value,
    preserveComments: preserveComments.value,
    preserveBlankLines: preserveBlankLines.value,
    pythonNormalizeIndentation: normalizeIndentation.value,
  }),
);
const parseError = computed(() => result.value.error);
const formattedOutput = computed(() => result.value.output);
const indentationOptions: Array<{ label: string; value: CodeIndentation }> = [
  { label: '2 spaces', value: '2-spaces' },
  { label: '4 spaces', value: '4-spaces' },
  { label: 'Tabs', value: 'tabs' },
];
</script>

<template>
  <section class="formatter-tool">
    <div class="tool-options">
      <AppSelect v-model="indentation" label="Indent" :options="indentationOptions" />
      <AppToggle v-model="preserveComments" label="Preserve comments" description="Keep Python comments in formatted output." />
      <AppToggle v-model="preserveBlankLines" label="Preserve blank lines" description="Keep intentional blank lines where possible in formatted output." />
      <AppToggle v-model="normalizeIndentation" label="Normalize indentation" description="Rewrite leading indentation using the selected indent style." />
      <div class="formatter-tool__status-slot">
        <button v-if="parseError" class="formatter-tool__status formatter-tool__status--error" type="button" @click="isErrorModalOpen = true">
          <AppIcon name="timesCircle" />
          <span>Invalid - Click for details</span>
        </button>
        <p v-else class="formatter-tool__status"><AppIcon name="checkCircle" /><span>Valid Python</span></p>
      </div>
    </div>
    <div class="formatter-tool__editors">
      <TextEditor v-model="input" label="Input" language="python" placeholder="Paste Python here" />
      <TextEditor :model-value="formattedOutput" label="Formatted Output" language="python" readonly placeholder="Formatted Python will appear here" />
    </div>
    <AppModal :open="isErrorModalOpen" title="Invalid Python" subtitle="The input could not be formatted. Review the parser message below." icon="code" @close="isErrorModalOpen = false">
      <TextEditor :model-value="parseError" label="Error Details" readonly />
    </AppModal>
  </section>
</template>
