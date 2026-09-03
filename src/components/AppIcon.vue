<script setup lang="ts">
import { icons, type IconName } from '@/icons';

const props = defineProps<{
  name: IconName;
}>();
</script>

<template>
  <svg class="app-icon" aria-hidden="true" focusable="false" :viewBox="icons[props.name].viewBox">
    <path :d="icons[props.name].path" />
  </svg>
</template>
