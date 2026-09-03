<script setup lang="ts">
defineProps<{
  toolCount: number;
}>();
</script>

<template>
  <div class="welcome-card">
    <p class="eyebrow">One Codebase</p>
    <h2>Build once for desktop and web.</h2>
    <p>
      This shell is ready for Vue tools that can run in Electron on macOS and Windows, or deploy as a standard web app.
    </p>

    <div class="welcome-card__grid">
      <article>
        <span>{{ toolCount }}</span>
        <strong>Tool slots</strong>
        <p>Add tools in <code>src/tools/registry.ts</code>.</p>
      </article>
      <article>
        <span>TS</span>
        <strong>Typed by default</strong>
        <p>Vue components and Electron code share TypeScript.</p>
      </article>
      <article>
        <span>DS</span>
        <strong>Design tokens</strong>
        <p>Colors, spacing, radii, and borders live in Sass.</p>
      </article>
    </div>
  </div>
</template>
