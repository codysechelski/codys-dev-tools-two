<script setup lang="ts">
defineProps<{
  heading: string;
  subheading?: string;
}>();
</script>

<template>
  <article class="app-card">
    <header class="app-card__header">
      <h3 class="app-card__heading">{{ heading }}</h3>
      <span v-if="subheading" class="app-card__subheading">{{ subheading }}</span>
    </header>

    <div class="app-card__body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="app-card__footer">
      <slot name="footer" />
    </footer>
  </article>
</template>
