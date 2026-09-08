<script setup lang="ts">
withDefaults(
  defineProps<{
    scrollable?: boolean;
  }>(),
  {
    scrollable: false,
  },
);
</script>

<template>
  <div class="data-table" :class="{ 'data-table--scrollable': scrollable }">
    <div class="data-table__scroll">
      <table class="data-table__table">
        <colgroup v-if="$slots.colgroup">
          <slot name="colgroup" />
        </colgroup>
        <thead v-if="$slots.header">
          <tr>
            <slot name="header" />
          </tr>
        </thead>
        <tbody>
          <slot />
        </tbody>
      </table>
    </div>
  </div>
</template>
