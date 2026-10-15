<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import logoForDarkBg from '@/assets/images/logo-dark-bg.svg';
import logoForLightBg from '@/assets/images/logo-light-bg.svg';
import type { ResolvedTheme } from '@/theme';

const GITHUB_URL = 'https://github.com/codysechelski/codys-dev-tools-two';
const KOFI_URL = 'https://ko-fi.com/X2B128UDFL';

const props = defineProps<{
  theme: ResolvedTheme;
  version: string;
}>();

const logoSrc = computed(() => (props.theme === 'dark' ? logoForDarkBg : logoForLightBg));
</script>

<template>
  <div class="home-panel">
    <img :src="logoSrc" alt="Cody's Dev Tools" class="home-panel__logo" />
    <p class="home-panel__version">v{{ version }}</p>
    <p class="home-panel__blurb">
      A collection of developer tools that runs locally and never tracks or reads what you enter. Always open source, always ad-free.
    </p>
    <div class="home-panel__links">
      <a :href="GITHUB_URL" target="_blank" rel="noopener noreferrer" class="app-button app-button--secondary home-panel__link">
        <AppIcon name="github" />
        View on GitHub
      </a>
      <a :href="KOFI_URL" target="_blank" rel="noopener noreferrer" class="app-button app-button--secondary home-panel__link">
        <AppIcon name="mugHot" />
        Buy Me a Coffee
      </a>
    </div>
    <p class="home-panel__hint">Select a tool from the sidebar to get started.</p>
  </div>
</template>
