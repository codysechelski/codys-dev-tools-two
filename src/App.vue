<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';
import { APP_VERSION } from '@/appInfo';
import AppIcon from '@/components/AppIcon.vue';
import AppSidebar from '@/components/AppSidebar.vue';
import CustomTitleBar from '@/components/CustomTitleBar.vue';
import { resolveTheme } from '@/theme';
import { DEFAULT_SETTINGS, loadSettingsFromLocalStorage, saveSettingsToLocalStorage, type AppSettings, type RememberToolInput } from '@/settings';
import { clearAllToolState, hasStoredToolState, initToolState, setRememberToolInputMode, toolStateMode } from '@/toolState';
import { applyFormatterDefaults } from '@/formatterDefaults';
import HomePanel from '@/components/HomePanel.vue';
import UpdateBanner from '@/components/UpdateBanner.vue';
import { allTools, attributionsTool, settingsTool, tools } from '@/tools/registry';

const selectedToolId = ref<string | null>(null);
const selectedTool = computed(() => allTools.find((tool) => tool.id === selectedToolId.value) ?? null);
const platform = window.codyDevTools?.platform ?? 'web';
const isElectron = Boolean(window.codyDevTools?.isElectron);
const settings = ref<AppSettings>({ ...DEFAULT_SETTINGS });
const settingsPath = ref('');
const isCustomSettingsLocation = ref(false);
const settingsLocationWarning = ref('');
const themeMode = computed(() => settings.value.themeMode);
const rememberToolInput = computed(() => settings.value.rememberToolInput);
const hasSavedToolData = computed(() => hasStoredToolState());
const systemPrefersDark = ref(true);
const updateNotice = ref<UpdateNotice | null>(null);
const activeTheme = computed(() => resolveTheme(themeMode.value, systemPrefersDark.value));
let mediaQuery: MediaQueryList | null = null;
let isLoadingSettings = false;

watchEffect(() => {
  document.body.dataset.theme = activeTheme.value;
});

watch(themeMode, (mode) => {
  window.codyDevTools?.notifyThemeChanged?.(mode);
  if (isLoadingSettings) return;

  void persistSettings();
});

watch(settings, applyFormatterDefaults, { immediate: true, deep: true });

onMounted(async () => {
  window.codyDevTools?.onSetTheme?.((mode) => {
    settings.value = { ...settings.value, themeMode: mode };
  });

  window.codyDevTools?.onNavigateHome?.(() => selectTool(null));
  window.codyDevTools?.onNavigateSettings?.(() => selectTool(settingsTool.id));
  window.codyDevTools?.onUpdateNotice?.((notice) => {
    updateNotice.value = notice;
  });

  mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
  if (mediaQuery) {
    systemPrefersDark.value = mediaQuery.matches;
    mediaQuery.addEventListener('change', updateSystemTheme);
  }

  void initToolState(isElectron);

  isLoadingSettings = true;
  if (isElectron) {
    const result = await window.codyDevTools!.loadSettings();
    settings.value = result.settings;
    settingsPath.value = result.settingsPath;
    isCustomSettingsLocation.value = result.isCustomLocation;
    settingsLocationWarning.value = result.warning ?? '';
  } else {
    settings.value = loadSettingsFromLocalStorage();
  }
  toolStateMode.value = settings.value.rememberToolInput;
  isLoadingSettings = false;
});

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', updateSystemTheme);
  delete document.body.dataset.theme;
});

function selectTool(toolId: string | null): void {
  selectedToolId.value = toolId;
}

function updateSystemTheme(event: MediaQueryListEvent): void {
  systemPrefersDark.value = event.matches;
}

function setThemeMode(mode: AppSettings['themeMode']): void {
  settings.value = { ...settings.value, themeMode: mode };
}

async function setRememberToolInput(mode: RememberToolInput): Promise<void> {
  await setRememberToolInputMode(mode, isElectron);
  settings.value = { ...settings.value, rememberToolInput: mode };
  await persistSettings();
}

async function clearSavedToolData(): Promise<void> {
  await clearAllToolState(isElectron);
}

async function updateSetting(patch: Partial<AppSettings>): Promise<void> {
  settings.value = { ...settings.value, ...patch };
  await persistSettings();
}

async function togglePin(toolId: string): Promise<void> {
  const pinnedToolIds = settings.value.pinnedToolIds.includes(toolId)
    ? settings.value.pinnedToolIds.filter((id) => id !== toolId)
    : [...settings.value.pinnedToolIds, toolId];
  settings.value = { ...settings.value, pinnedToolIds };
  await persistSettings();
}

async function resetSettings(): Promise<void> {
  settings.value = { ...DEFAULT_SETTINGS };
  await persistSettings();
}

async function persistSettings(): Promise<void> {
  if (isElectron) {
    // settings.value is a Vue reactive proxy; contextBridge/ipcRenderer requires a
    // structured-cloneable plain object, so spread it into one before sending.
    const result = await window.codyDevTools!.saveSettings({ ...settings.value });
    settingsPath.value = result.settingsPath;
  } else {
    saveSettingsToLocalStorage(settings.value);
  }
}

async function chooseSettingsLocation(): Promise<void> {
  const result = await window.codyDevTools?.chooseSettingsDirectory?.();
  if (!result) return;

  settingsPath.value = result.settingsPath;
  isCustomSettingsLocation.value = result.isCustomLocation;
  settingsLocationWarning.value = result.warning ?? '';
  await persistSettings();
}

async function resetSettingsLocation(): Promise<void> {
  const result = await window.codyDevTools?.resetSettingsDirectory?.();
  if (!result) return;

  settingsPath.value = result.settingsPath;
  isCustomSettingsLocation.value = result.isCustomLocation;
  settingsLocationWarning.value = result.warning ?? '';
  await persistSettings();
}

function installUpdate(): void {
  window.codyDevTools?.quitAndInstallUpdate?.();
}

function dismissUpdateBanner(): void {
  updateNotice.value = null;
}
</script>

<template>
  <CustomTitleBar v-if="platform === 'win32'" :theme-mode="themeMode" />
  <main class="app-shell" :data-platform="platform" :data-theme="activeTheme">
    <div class="window-drag-region" aria-hidden="true" />

    <AppSidebar
      :tools="tools"
      :selected-tool-id="selectedToolId"
      :version="APP_VERSION"
      :attributions-tool-id="attributionsTool.id"
      :settings-tool-id="settingsTool.id"
      :pinned-tool-ids="settings.pinnedToolIds"
      :density="settings.sidebarDensity"
      @select-tool="selectTool"
      @toggle-pin="togglePin"
    />

    <section class="workspace">
      <header v-if="selectedTool" class="tool-screen-header">
        <div>
          <h1><AppIcon class="tool-screen-header__icon" :name="selectedTool.icon" />{{ selectedTool.name }}</h1>
          <p>{{ selectedTool.instructions ?? selectedTool.description }}</p>
        </div>
      </header>

      <component
        :is="selectedTool.component"
        v-if="selectedTool"
        :theme-mode="themeMode"
        :is-electron="isElectron"
        :settings-path="settingsPath"
        :is-custom-settings-location="isCustomSettingsLocation"
        :settings-location-warning="settingsLocationWarning"
        :remember-tool-input="rememberToolInput"
        :has-saved-tool-data="hasSavedToolData"
        :settings="settings"
        @set-theme="setThemeMode"
        @choose-settings-location="chooseSettingsLocation"
        @reset-settings-location="resetSettingsLocation"
        @set-remember-tool-input="setRememberToolInput"
        @clear-saved-tool-data="clearSavedToolData"
        @update-setting="updateSetting"
        @reset-settings="resetSettings"
      />
      <HomePanel v-else :theme="activeTheme" :version="APP_VERSION" />
    </section>

    <UpdateBanner v-if="updateNotice" :notice="updateNotice" @install="installUpdate" @dismiss="dismissUpdateBanner" />
  </main>
</template>
