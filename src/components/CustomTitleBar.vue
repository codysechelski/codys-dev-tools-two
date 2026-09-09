<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import titlebarIcon from '@/assets/images/titlebar-icon.png';
import type { AppSettings } from '@/settings';

const props = defineProps<{
  themeMode: AppSettings['themeMode'];
}>();

type MenuItem =
  | { type: 'separator' }
  | { type: 'item'; id: string; label: string; accelerator?: string }
  | { type: 'radio'; id: string; label: string; value: AppSettings['themeMode'] };

interface MenuColumn {
  label: string;
  items: MenuItem[];
}

const menus: MenuColumn[] = [
  {
    label: 'File',
    items: [
      { type: 'item', id: 'menu-settings', label: 'Settings', accelerator: 'Ctrl+,' },
      { type: 'separator' },
      { type: 'item', id: 'menu-quit', label: 'Quit' },
    ],
  },
  {
    label: 'Edit',
    items: [
      { type: 'item', id: 'menu-undo', label: 'Undo', accelerator: 'Ctrl+Z' },
      { type: 'item', id: 'menu-redo', label: 'Redo', accelerator: 'Ctrl+Y' },
      { type: 'separator' },
      { type: 'item', id: 'menu-cut', label: 'Cut', accelerator: 'Ctrl+X' },
      { type: 'item', id: 'menu-copy', label: 'Copy', accelerator: 'Ctrl+C' },
      { type: 'item', id: 'menu-paste', label: 'Paste', accelerator: 'Ctrl+V' },
      { type: 'item', id: 'menu-delete', label: 'Delete' },
      { type: 'separator' },
      { type: 'item', id: 'menu-select-all', label: 'Select All', accelerator: 'Ctrl+A' },
    ],
  },
  {
    label: 'View',
    items: [
      { type: 'radio', id: 'theme-light', label: 'Theme: Light', value: 'light' },
      { type: 'radio', id: 'theme-dark', label: 'Theme: Dark', value: 'dark' },
      { type: 'radio', id: 'theme-system', label: 'Theme: System', value: 'system' },
      { type: 'separator' },
      { type: 'item', id: 'menu-reload', label: 'Reload', accelerator: 'Ctrl+R' },
      { type: 'item', id: 'menu-force-reload', label: 'Force Reload', accelerator: 'Ctrl+Shift+R' },
      { type: 'item', id: 'menu-toggle-devtools', label: 'Toggle Developer Tools', accelerator: 'Ctrl+Shift+I' },
      { type: 'separator' },
      { type: 'item', id: 'menu-reset-zoom', label: 'Reset Zoom', accelerator: 'Ctrl+0' },
      { type: 'item', id: 'menu-zoom-in', label: 'Zoom In', accelerator: 'Ctrl+=' },
      { type: 'item', id: 'menu-zoom-out', label: 'Zoom Out', accelerator: 'Ctrl+-' },
      { type: 'separator' },
      { type: 'item', id: 'menu-toggle-fullscreen', label: 'Toggle Full Screen', accelerator: 'F11' },
    ],
  },
  {
    label: 'Window',
    items: [
      { type: 'item', id: 'menu-minimize', label: 'Minimize' },
      { type: 'item', id: 'menu-maximize', label: 'Maximize' },
      { type: 'separator' },
      { type: 'item', id: 'menu-close', label: 'Close' },
    ],
  },
  {
    label: 'Help',
    items: [
      { type: 'item', id: 'menu-about', label: 'About' },
      { type: 'item', id: 'menu-check-updates', label: 'Check for Updates...' },
    ],
  },
];

const openMenu = ref<string | null>(null);
const rootEl = ref<HTMLElement | null>(null);

function toggleMenu(label: string): void {
  openMenu.value = openMenu.value === label ? null : label;
}

function trigger(id: string): void {
  window.codyDevTools?.triggerMenuAction?.(id);
  openMenu.value = null;
}

function handleOutsideClick(event: MouseEvent): void {
  if (rootEl.value && !rootEl.value.contains(event.target as Node)) openMenu.value = null;
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') openMenu.value = null;
}

onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick);
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleOutsideClick);
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div ref="rootEl" class="app-titlebar">
    <img :src="titlebarIcon" alt="" class="app-titlebar__icon" />
    <nav class="app-titlebar__menu">
      <div v-for="menu in menus" :key="menu.label" class="app-titlebar__menu-item">
        <button
          type="button"
          class="app-titlebar__menu-button"
          :class="{ 'app-titlebar__menu-button--open': openMenu === menu.label }"
          @click="toggleMenu(menu.label)"
        >
          {{ menu.label }}
        </button>
        <div v-if="openMenu === menu.label" class="app-titlebar__dropdown">
          <template v-for="(item, index) in menu.items" :key="index">
            <hr v-if="item.type === 'separator'" class="app-titlebar__separator" />
            <button
              v-else
              type="button"
              class="app-titlebar__dropdown-item"
              @click="trigger(item.id)"
            >
              <span class="app-titlebar__dropdown-item-check">
                <AppIcon v-if="item.type === 'radio' && props.themeMode === item.value" name="checkCircle" />
              </span>
              <span class="app-titlebar__dropdown-item-label">{{ item.label }}</span>
              <span v-if="item.type === 'item' && item.accelerator" class="app-titlebar__accelerator">{{ item.accelerator }}</span>
            </button>
          </template>
        </div>
      </div>
    </nav>
  </div>
</template>
