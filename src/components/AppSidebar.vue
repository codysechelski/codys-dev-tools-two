<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import type { ToolDefinition } from '@/tools/types';

const props = defineProps<{
  tools: ToolDefinition[];
  selectedToolId: string | null;
  version: string;
  attributionsToolId: string;
  settingsToolId: string;
}>();

defineEmits<{
  selectTool: [toolId: string];
}>();

const sectionOrder = ['String Utilities', 'Encoders/Decoders', 'Date Utilities', 'Formatters', 'Converters', 'Miscellaneous'];
const groupedTools = computed(() =>
  sectionOrder
    .map((section) => ({
      section,
      tools: props.tools.filter((tool) => tool.section === section),
    }))
    .filter((group) => group.tools.length),
);
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar__drag-region" />
    <div class="sidebar__brand">
      <span class="sidebar__brand-mark">CD</span>
      <div>
        <strong>Cody's</strong>
        <span>Dev Tools</span>
      </div>
    </div>

    <nav class="tool-nav" aria-label="Developer tools">
      <section v-for="group in groupedTools" :key="group.section" class="tool-nav__section">
        <h2>{{ group.section }}</h2>
        <button
          v-for="tool in group.tools"
          :key="tool.id"
          class="tool-nav__item"
          :class="{ 'tool-nav__item--active': tool.id === selectedToolId }"
          type="button"
          @click="$emit('selectTool', tool.id)"
        >
          <span class="tool-nav__icon"><AppIcon :name="tool.icon" /></span>
          <span>
            <strong>{{ tool.name }}</strong>
          </span>
        </button>
      </section>
    </nav>

    <footer class="sidebar__footer">
      <div class="sidebar__footer-links">
        <span>v{{ version }}</span>
        <span aria-hidden="true">|</span>
        <button type="button" @click="$emit('selectTool', attributionsToolId)">Attributions</button>
      </div>
      <button class="sidebar__settings-button" type="button" aria-label="Settings" @click="$emit('selectTool', settingsToolId)">
        <AppIcon name="cog" />
      </button>
    </footer>
  </aside>
</template>
