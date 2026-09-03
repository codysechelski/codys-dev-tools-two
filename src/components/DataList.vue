<script setup lang="ts">
withDefaults(
  defineProps<{
    header?: boolean;
    scrollable?: boolean;
  }>(),
  {
    scrollable: false,
  },
);
</script>

<template>
  <div class="data-list" :class="{ 'data-list--scrollable': scrollable }">
    <div v-if="header" class="data-list__header">
      <slot name="header" />
    </div>
    <div class="data-list__body">
      <slot />
    </div>
  </div>
</template>
