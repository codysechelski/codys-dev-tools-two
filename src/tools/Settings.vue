<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue';
import type { ThemeMode } from '@/theme';

defineProps<{
  themeMode: ThemeMode;
}>();

defineEmits<{
  setTheme: [themeMode: ThemeMode];
}>();

const themeOptions: Array<{
  mode: ThemeMode;
  label: string;
  description: string;
  icon: 'sun' | 'moon' | 'desktop';
}> = [
  {
    mode: 'light',
    label: 'Light',
    description: 'Use the brighter app theme.',
    icon: 'sun',
  },
  {
    mode: 'dark',
    label: 'Dark',
    description: 'Use the nearly black purple-blue theme.',
    icon: 'moon',
  },
  {
    mode: 'system',
    label: 'System',
    description: 'Follow your operating system appearance.',
    icon: 'desktop',
  },
];
</script>

<template>
  <section class="settings-panel">
    <div class="settings-section">
      <div>
        <h2>Appearance</h2>
        <p>Choose the app theme. System mode follows your OS light or dark appearance.</p>
      </div>

      <div class="settings-theme-grid">
        <button
          v-for="option in themeOptions"
          :key="option.mode"
          class="settings-theme-card"
          :class="{ 'settings-theme-card--active': themeMode === option.mode }"
          type="button"
          @click="$emit('setTheme', option.mode)"
        >
          <span class="settings-theme-card__icon"><AppIcon :name="option.icon" /></span>
          <strong>{{ option.label }}</strong>
          <span>{{ option.description }}</span>
        </button>
      </div>
    </div>
  </section>
</template>
