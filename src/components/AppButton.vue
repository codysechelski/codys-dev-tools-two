<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue';
import type { IconName } from '@/icons';

withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'muted' | 'destructive' | 'ghost';
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    icon?: IconName;
    iconOnly?: boolean;
  }>(),
  {
    variant: 'secondary',
    type: 'button',
    disabled: false,
    iconOnly: false,
  },
);
</script>

<template>
  <button
    class="app-button"
    :class="[`app-button--${variant}`, icon ? `app-button--icon-${icon}` : '', iconOnly ? 'app-button--icon-only' : '']"
    :type="type"
    :disabled="disabled"
  >
    <AppIcon v-if="icon" :name="icon" />
    <slot />
  </button>
</template>
