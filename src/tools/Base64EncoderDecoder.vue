<script setup lang="ts">
import { computed, ref } from 'vue';
import AppButton from '@/components/AppButton.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { usePersistedToolState } from '@/toolState';
import { transformBase64, type Base64Mode } from './base64EncoderDecoder';

const input = ref("Cody's Dev Tools");
const mode = ref<Base64Mode>('encode');
const urlSafe = ref(false);

usePersistedToolState('base64-encoder-decoder', { input, mode, urlSafe });

const modeOptions: Array<{ label: string; value: Base64Mode }> = [
  { label: 'Encode', value: 'encode' },
  { label: 'Decode', value: 'decode' },
];

const result = computed(() => transformBase64(input.value, mode.value, urlSafe.value));
const output = computed(() => result.value.output);
const error = computed(() => result.value.error);
const inputPlaceholder = computed(() => (mode.value === 'encode' ? 'Paste text to encode' : 'Paste base64 text to decode'));
const outputPlaceholder = computed(() => (mode.value === 'encode' ? 'Encoded base64 output will appear here' : 'Decoded text will appear here'));

function flipMode(): void {
  const previousOutput = output.value;

  mode.value = mode.value === 'encode' ? 'decode' : 'encode';
  if (previousOutput) input.value = previousOutput;
}
</script>

<template>
  <section class="converter-tool">
    <ToolToolbar>
      <AppSelect v-model="mode" label="Mode" :options="modeOptions" />
      <AppButton variant="field" icon="exchangeAlt" icon-only aria-label="Swap input and output" @click="flipMode" />
      <AppToggle
        v-model="urlSafe"
        label="URL-safe alphabet"
        description="Use - and _ instead of + and /, with padding removed. Useful for URLs, filenames, and query parameters."
      />
      <template #badge>
        <ToolbarStatusBadge v-if="error" variant="error" :label="error" />
        <ToolbarStatusBadge v-else label="Ready" />
      </template>
    </ToolToolbar>

    <div class="formatter-tool__editors">
      <TextEditor v-model="input" label="Input" language="text" :placeholder="inputPlaceholder" />
      <TextEditor :model-value="error || output" label="Output" language="text" readonly :placeholder="outputPlaceholder" />
    </div>
  </section>
</template>
