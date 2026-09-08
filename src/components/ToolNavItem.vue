<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue';
import type { ToolDefinition } from '@/tools/types';

const props = defineProps<{
  tool: ToolDefinition;
  active: boolean;
  pinned: boolean;
}>();

defineEmits<{
  select: [];
  togglePin: [];
}>();
</script>

<template>
  <div class="tool-nav__item" :class="{ 'tool-nav__item--active': active }">
    <button class="tool-nav__item-button" type="button" @click="$emit('select')">
      <span class="tool-nav__icon"><AppIcon :name="tool.icon" /></span>
      <span>
        <strong>{{ tool.name }}</strong>
      </span>
    </button>
    <button
      class="tool-nav__pin"
      :class="{ 'tool-nav__pin--active': pinned }"
      type="button"
      :aria-pressed="pinned"
      :aria-label="pinned ? `Unpin ${props.tool.name}` : `Pin ${props.tool.name}`"
      @click="$emit('togglePin')"
    >
      <AppIcon name="star" />
    </button>
  </div>
</template>
