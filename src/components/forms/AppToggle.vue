<script setup lang="ts">
import HelpPopover from '@/components/HelpPopover.vue';

const props = defineProps<{
  modelValue: boolean;
  label: string;
  description?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

function toggle(): void {
  emit('update:modelValue', !props.modelValue);
}
</script>

<template>
  <div class="form-toggle">
    <span class="form-control__label-row">
      <span class="form-control__label-text">{{ label }}</span>
      <HelpPopover v-if="description" :text="description" :label="`${label} help`" />
    </span>
    <button
      class="form-toggle__control"
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :class="{ 'form-toggle__control--checked': modelValue }"
      @click="toggle"
    >
      <span class="form-toggle__track" aria-hidden="true">
        <span class="form-toggle__thumb" />
      </span>
    </button>
  </div>
</template>
