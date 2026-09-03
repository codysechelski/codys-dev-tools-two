<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue';
import { APP_VERSION } from '@/appInfo';
import AppSidebar from '@/components/AppSidebar.vue';
import { resolveTheme, type ThemeMode } from '@/theme';
import WelcomePanel from '@/components/WelcomePanel.vue';
import { allTools, attributionsTool, settingsTool, tools } from '@/tools/registry';

const selectedToolId = ref<string | null>(null);
const selectedTool = computed(() => allTools.find((tool) => tool.id === selectedToolId.value) ?? null);
const platform = window.codyDevTools?.platform ?? 'web';
const themeMode = ref<ThemeMode>('system');
const systemPrefersDark = ref(true);
const activeTheme = computed(() => resolveTheme(themeMode.value, systemPrefersDark.value));
let mediaQuery: MediaQueryList | null = null;

watchEffect(() => {
  document.body.dataset.theme = activeTheme.value;
});

onMounted(() => {
  mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
  if (!mediaQuery) return;

  systemPrefersDark.value = mediaQuery.matches;
  mediaQuery.addEventListener('change', updateSystemTheme);
});

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', updateSystemTheme);
  delete document.body.dataset.theme;
});

function selectTool(toolId: string): void {
  selectedToolId.value = toolId;
}

function updateSystemTheme(event: MediaQueryListEvent): void {
  systemPrefersDark.value = event.matches;
}
</script>

<template>
  <main class="app-shell" :data-platform="platform" :data-theme="activeTheme">
    <div class="window-drag-region" aria-hidden="true" />

    <AppSidebar
      :tools="tools"
      :selected-tool-id="selectedToolId"
      :version="APP_VERSION"
      :attributions-tool-id="attributionsTool.id"
      :settings-tool-id="settingsTool.id"
      @select-tool="selectTool"
    />

    <section class="workspace">
      <header v-if="selectedTool" class="tool-screen-header">
        <div>
          <h1>{{ selectedTool.name }}</h1>
          <p>{{ selectedTool.instructions ?? selectedTool.description }}</p>
        </div>
      </header>
      <header v-else class="workspace__chrome">
        <div>
          <p class="eyebrow">Developer Toolkit</p>
          <h1>Welcome</h1>
        </div>
        <span class="runtime-pill">{{ platform === 'web' ? 'Web App' : `${platform} Desktop` }}</span>
      </header>

      <component :is="selectedTool.component" v-if="selectedTool" :theme-mode="themeMode" @set-theme="themeMode = $event" />
      <WelcomePanel v-else :tool-count="tools.length" />
    </section>
  </main>
</template>
