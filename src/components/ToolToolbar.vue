<template>
  <div class="tool-options tool-toolbar">
    <div class="tool-toolbar__options">
      <slot />
    </div>
    <div v-if="$slots.badge" class="formatter-tool__status-slot tool-toolbar__badge">
      <slot name="badge" />
    </div>
  </div>
</template>
