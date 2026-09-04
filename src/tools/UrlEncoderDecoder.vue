<script setup lang="ts">
import { computed, ref } from 'vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { transformUrl, type UrlTransformMode } from './urlEncoderDecoder';

const input = ref('https://example.com/search?q=Cody\'s Dev Tools#top');
const mode = ref<UrlTransformMode>('encode');
const component = ref(false);
const formSpaces = ref(false);
const rfc3986 = ref(false);

const modeOptions: Array<{ label: string; value: UrlTransformMode }> = [
  { label: 'Encode', value: 'encode' },
  { label: 'Decode', value: 'decode' },
];
const result = computed(() =>
  transformUrl(input.value, {
    mode: mode.value,
    component: component.value,
    formSpaces: formSpaces.value,
    rfc3986: rfc3986.value,
  }),
);
const output = computed(() => result.value.output);
const error = computed(() => result.value.error);
const inputPlaceholder = computed(() => (mode.value === 'encode' ? 'Paste URL text to encode' : 'Paste encoded URL text to decode'));
const outputPlaceholder = computed(() => (mode.value === 'encode' ? 'Encoded URL output will appear here' : 'Decoded URL output will appear here'));
</script>

<template>
  <section class="converter-tool">
    <ToolToolbar>
      <AppSelect v-model="mode" label="Mode" :options="modeOptions" />
      <AppToggle
        v-model="component"
        label="URL component"
        description="Use component mode for query parameter values or path segments. Leave it off when encoding or decoding a full URL."
      />
      <AppToggle
        v-model="formSpaces"
        label="Form spaces (+)"
        description="Encode spaces as + instead of %20. In decode mode, + is treated as a space."
      />
      <AppToggle
        v-if="mode === 'encode'"
        v-model="rfc3986"
        label="RFC 3986"
        description="Strict RFC 3986 encoding for !, ', (, ), and *. Full-URL mode preserves IPv6 brackets."
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
