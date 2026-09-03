<script setup lang="ts">
import HelpPopover from '@/components/HelpPopover.vue';

defineProps<{
  modelValue: boolean;
  label: string;
  description?: string;
}>();

defineEmits<{
  'update:modelValue': [value: boolean];
}>();
</script>

<template>
  <label class="form-checkbox">
    <span class="form-control__label-row">
      <span class="form-control__label-text">{{ label }}</span>
      <HelpPopover v-if="description" :text="description" :label="`${label} help`" />
    </span>
    <input
      class="form-checkbox__input"
      type="checkbox"
      :checked="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="form-checkbox__control">
      <span class="form-checkbox__box" aria-hidden="true" />
    </span>
  </label>
</template>
