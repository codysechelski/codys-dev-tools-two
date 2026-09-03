<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue';

defineProps<{
  text: string;
  label?: string;
}>();
</script>

<template>
  <span class="help-popover">
    <button class="help-popover__trigger" type="button" :aria-label="label ?? 'More information'">
      <AppIcon name="questionCircle" />
    </button>
    <span class="help-popover__content" role="tooltip">{{ text }}</span>
  </span>
</template>
