<script setup lang="ts">
import { useAttrs } from 'vue';
import AppIcon from '@/components/AppIcon.vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    variant?: 'success' | 'error';
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
</script>

<template>
  <button
    v-if="props.button"
    v-bind="attrs"
    class="formatter-tool__status"
    :class="{ 'formatter-tool__status--error': props.variant === 'error' }"
    type="button"
    @click="emit('click', $event)"
  >
    <AppIcon :name="props.variant === 'error' ? 'timesCircle' : 'checkCircle'" />
    <span>{{ props.label }}</span>
  </button>
  <p v-else v-bind="attrs" class="formatter-tool__status" :class="{ 'formatter-tool__status--error': props.variant === 'error' }">
    <AppIcon :name="props.variant === 'error' ? 'timesCircle' : 'checkCircle'" />
    <span>{{ props.label }}</span>
  </p>
</template>
