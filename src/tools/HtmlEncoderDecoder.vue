<script setup lang="ts">
import { computed, ref } from 'vue';
import AppButton from '@/components/AppButton.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import { usePersistedToolState } from '@/toolState';
import { transformHtmlEntities, type HtmlTransformMode } from './htmlEncoderDecoder';

const input = ref('<p class="note">Cody\'s Dev Tools</p>');
const mode = ref<HtmlTransformMode>('encode');
const encodeAllCharacters = ref(false);

usePersistedToolState('html-encoder-decoder', { input, mode, encodeAllCharacters });

const modeOptions: Array<{ label: string; value: HtmlTransformMode }> = [
  { label: 'Encode', value: 'encode' },
  { label: 'Decode', value: 'decode' },
];
const output = computed(() => transformHtmlEntities(input.value, mode.value, encodeAllCharacters.value));

const inputPlaceholder = computed(() => (mode.value === 'encode' ? 'Paste text or HTML to encode' : 'Paste HTML entities to decode'));
const outputPlaceholder = computed(() => (mode.value === 'encode' ? 'Encoded HTML entities will appear here' : 'Decoded text will appear here'));
const inputLanguage = computed(() => (mode.value === 'encode' ? 'html' : 'text'));
const outputLanguage = computed(() => (mode.value === 'encode' ? 'text' : 'html'));

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
        v-if="mode === 'encode'"
        v-model="encodeAllCharacters"
        label="Encode all characters"
        description="When off, only &, <, >, quotes, and apostrophes are encoded. When on, every Unicode character is encoded as a numeric HTML entity."
      />
    </ToolToolbar>

    <div class="formatter-tool__editors">
      <TextEditor :key="`input-${inputLanguage}`" v-model="input" label="Input" :language="inputLanguage" :placeholder="inputPlaceholder" />
      <TextEditor :key="`output-${outputLanguage}`" :model-value="output" label="Output" :language="outputLanguage" readonly :placeholder="outputPlaceholder" />
    </div>
  </section>
</template>
