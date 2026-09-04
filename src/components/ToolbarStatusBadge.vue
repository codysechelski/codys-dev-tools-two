<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import AppModal from '@/components/AppModal.vue';
import TextEditor from '@/components/TextEditor.vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    variant?: 'success' | 'error' | 'warning';
    label: string;
    button?: boolean;
  }>(),
  {
    variant: 'success',
    button: false,
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();
const attrs = useAttrs();
const isDetailModalOpen = ref(false);
const isError = computed(() => props.variant === 'error');
const isWarning = computed(() => props.variant === 'warning');
const hasDetail = computed(() => isError.value || isWarning.value);
const displayLabel = computed(() => {
  if (isError.value) return 'Error - click for details';
  if (isWarning.value) return 'Warning - click for details';
  return props.label;
});
const modalTitle = computed(() => (isWarning.value ? 'Warning Details' : 'Error Details'));
const modalSubtitle = computed(() =>
  isWarning.value ? 'Review the warning message below.' : 'Review the error message below.',
);

function handleClick(event: MouseEvent): void {
  if (hasDetail.value) isDetailModalOpen.value = true;
  emit('click', event);
}
</script>

<template>
  <button
    v-if="props.button || hasDetail"
    v-bind="attrs"
    class="formatter-tool__status"
    :class="{ 'formatter-tool__status--error': isError, 'formatter-tool__status--warning': isWarning }"
    type="button"
    @click="handleClick"
  >
    <AppIcon :name="isError ? 'timesCircle' : isWarning ? 'exclamationTriangle' : 'checkCircle'" />
    <span>{{ displayLabel }}</span>
  </button>
  <p v-else v-bind="attrs" class="formatter-tool__status">
    <AppIcon name="checkCircle" />
    <span>{{ displayLabel }}</span>
  </p>

  <AppModal
    v-if="hasDetail"
    :open="isDetailModalOpen"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    icon="code"
    @close="isDetailModalOpen = false"
  >
    <TextEditor :model-value="props.label" :label="modalTitle" readonly />
  </AppModal>
</template>
