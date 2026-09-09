<script setup lang="ts">
import { ref } from 'vue';
import AppButton from '@/components/AppButton.vue';
import AppCopyButton from '@/components/AppCopyButton.vue';
import AppIcon from '@/components/AppIcon.vue';
import AppModal from '@/components/AppModal.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import type { AppSettings, IndentStyle, RememberToolInput, SidebarDensity } from '@/settings';
import type { ThemeMode } from '@/theme';

defineProps<{
  themeMode: ThemeMode;
  isElectron: boolean;
  settingsPath: string;
  isCustomSettingsLocation: boolean;
  settingsLocationWarning: string;
  rememberToolInput: RememberToolInput;
  hasSavedToolData: boolean;
  settings: AppSettings;
}>();

const emit = defineEmits<{
  setTheme: [themeMode: ThemeMode];
  chooseSettingsLocation: [];
  resetSettingsLocation: [];
  setRememberToolInput: [mode: RememberToolInput];
  clearSavedToolData: [];
  updateSetting: [patch: Partial<AppSettings>];
  resetSettings: [];
}>();

const showResetConfirm = ref(false);

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

const rememberToolInputOptions: Array<{
  mode: RememberToolInput;
  label: string;
  description: string;
  icon: 'timesCircle' | 'clock' | 'save';
}> = [
  {
    mode: 'never',
    label: 'Never',
    description: 'Every tool starts fresh each time you open it.',
    icon: 'timesCircle',
  },
  {
    mode: 'session',
    label: 'For this session',
    description: 'Switching tools keeps what you typed, but it resets when you restart the app.',
    icon: 'clock',
  },
  {
    mode: 'forever',
    label: 'Forever',
    description: 'What you type is restored even after restarting the app.',
    icon: 'save',
  },
];

const indentStyleOptions: Array<{ label: string; value: IndentStyle }> = [
  { label: '2 spaces', value: '2-spaces' },
  { label: '4 spaces', value: '4-spaces' },
  { label: 'Tabs', value: 'tabs' },
];

const sidebarDensityOptions: Array<{
  value: SidebarDensity;
  label: string;
  description: string;
  icon: 'listUl' | 'gripLines';
}> = [
  {
    value: 'comfortable',
    label: 'Comfortable',
    description: 'More breathing room around each tool.',
    icon: 'listUl',
  },
  {
    value: 'compact',
    label: 'Compact',
    description: 'Smaller rows so more tools fit on screen at once.',
    icon: 'gripLines',
  },
];

function confirmReset(): void {
  showResetConfirm.value = false;
  emit('resetSettings');
}
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

    <div class="settings-section">
      <div>
        <h2>Sidebar Density</h2>
        <p>Choose how much space each item in the tool list takes up.</p>
      </div>

      <div class="settings-theme-grid">
        <button
          v-for="option in sidebarDensityOptions"
          :key="option.value"
          class="settings-theme-card"
          :class="{ 'settings-theme-card--active': settings.sidebarDensity === option.value }"
          type="button"
          @click="emit('updateSetting', { sidebarDensity: option.value })"
        >
          <span class="settings-theme-card__icon"><AppIcon :name="option.icon" /></span>
          <strong>{{ option.label }}</strong>
          <span>{{ option.description }}</span>
        </button>
      </div>
    </div>

    <div class="settings-section">
      <div>
        <h2>Remember Tool Input</h2>
        <p>Choose whether tools should remember what you type and select.</p>
      </div>

      <div class="settings-theme-grid">
        <button
          v-for="option in rememberToolInputOptions"
          :key="option.mode"
          class="settings-theme-card"
          :class="{ 'settings-theme-card--active': rememberToolInput === option.mode }"
          type="button"
          @click="$emit('setRememberToolInput', option.mode)"
        >
          <span class="settings-theme-card__icon"><AppIcon :name="option.icon" /></span>
          <strong>{{ option.label }}</strong>
          <span>{{ option.description }}</span>
        </button>
      </div>

      <div v-if="hasSavedToolData" class="settings-file-actions">
        <AppButton variant="secondary" @click="$emit('clearSavedToolData')">Clear Saved Tool Data</AppButton>
      </div>
    </div>

    <div class="settings-section">
      <div>
        <h2>Formatting Defaults</h2>
        <p>Starting values new tool tabs open with. Any tool you've customized before keeps its own remembered value.</p>
      </div>

      <div class="settings-formatting-grid">
        <AppSelect
          :model-value="settings.defaultIndentStyle"
          label="Default indent"
          :options="indentStyleOptions"
          @update:model-value="emit('updateSetting', { defaultIndentStyle: $event })"
        />
        <AppToggle
          :model-value="settings.defaultPreserveComments"
          label="Preserve comments"
          description="Formatters keep comments by default instead of stripping them."
          @update:model-value="emit('updateSetting', { defaultPreserveComments: $event })"
        />
        <AppToggle
          :model-value="settings.defaultPreserveBlankLines"
          label="Preserve blank lines"
          description="Formatters keep blank lines between statements by default."
          @update:model-value="emit('updateSetting', { defaultPreserveBlankLines: $event })"
        />
        <AppToggle
          :model-value="settings.defaultCaseSensitive"
          label="Case-sensitive matching"
          description="Text Analyzer and Line Sorter/Deduplicator treat differently-cased text as different by default."
          @update:model-value="emit('updateSetting', { defaultCaseSensitive: $event })"
        />
        <AppToggle
          :model-value="settings.defaultSortKeys"
          label="Sort keys / declarations"
          description="JSON, CSS, and XML/YAML converters alphabetize keys by default."
          @update:model-value="emit('updateSetting', { defaultSortKeys: $event })"
        />
      </div>
    </div>

    <div v-if="isElectron" class="settings-section">
      <div>
        <h2>Settings File</h2>
        <p>Your preferences are saved to this file automatically whenever you change them.</p>
      </div>

      <div class="settings-file-path">
        <code>{{ settingsPath }}</code>
        <AppCopyButton :value="settingsPath" size="sm" :disabled="!settingsPath" />
      </div>

      <p v-if="settingsLocationWarning" class="settings-file-warning">
        <AppIcon name="exclamationTriangle" />
        {{ settingsLocationWarning }}
      </p>

      <div class="settings-file-actions">
        <AppButton variant="secondary" @click="$emit('chooseSettingsLocation')">Choose Custom Location…</AppButton>
        <AppButton v-if="isCustomSettingsLocation" variant="muted" @click="$emit('resetSettingsLocation')">Reset to Default</AppButton>
      </div>
    </div>

    <div class="settings-section">
      <div>
        <h2>Reset</h2>
        <p>Revert theme, sidebar density, remembered-input mode, formatting defaults, and pinned tools back to their factory values.</p>
      </div>

      <div class="settings-file-actions">
        <AppButton variant="destructive" @click="showResetConfirm = true">Reset All Settings</AppButton>
      </div>
    </div>

    <AppModal
      :open="showResetConfirm"
      title="Reset all settings?"
      subtitle="This reverts every preference on this page to its default. Saved tool input is not affected."
      icon="exclamationTriangle"
      @close="showResetConfirm = false"
    >
      <template #footer>
        <AppButton variant="muted" @click="showResetConfirm = false">Cancel</AppButton>
        <AppButton variant="destructive" @click="confirmReset">Reset Settings</AppButton>
      </template>
    </AppModal>
  </section>
</template>
