<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AppButton from '@/components/AppButton.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import { usePersistedToolState } from '@/toolState';
import { clampCount, generateUuids } from './uuidGenerator';

const countInput = ref('5');
const uppercase = ref(false);
const removeHyphens = ref(false);
const uuids = ref(generateUuids({ count: 5, uppercase: false, removeHyphens: false }));

usePersistedToolState('uuid-generator', { countInput, uppercase, removeHyphens });

const output = computed(() => uuids.value.join('\n'));
const countOptions = [
  { label: '1', value: '1' },
  { label: '5', value: '5' },
  { label: '20', value: '20' },
  { label: '50', value: '50' },
  { label: '100', value: '100' },
];

watch([countInput, uppercase, removeHyphens], regenerate);

function regenerate(): void {
  uuids.value = generateUuids({
    count: clampCount(Number(countInput.value)),
    uppercase: uppercase.value,
    removeHyphens: removeHyphens.value,
  });
}
</script>

<template>
  <section class="uuid-tool">
    <ToolToolbar>
      <AppSelect v-model="countInput" label="Count" :options="countOptions" />
      <AppToggle v-model="uppercase" label="Uppercase" />
      <AppToggle v-model="removeHyphens" label="No hyphens" />
      <AppButton variant="field" icon="recycle" icon-only aria-label="Regenerate UUIDs" @click="regenerate" />
    </ToolToolbar>

    <TextEditor :model-value="output" label="UUID Output" readonly />
  </section>
</template>
