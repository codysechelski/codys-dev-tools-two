<script setup lang="ts">
import { computed, ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import AppTextInput from '@/components/forms/AppTextInput.vue';
import ToolNavItem from '@/components/ToolNavItem.vue';
import type { SidebarDensity } from '@/settings';
import type { ToolDefinition } from '@/tools/types';

const props = withDefaults(
  defineProps<{
    tools: ToolDefinition[];
    selectedToolId: string | null;
    version: string;
    attributionsToolId: string;
    settingsToolId: string;
    pinnedToolIds: string[];
    density?: SidebarDensity;
  }>(),
  {
    density: 'comfortable',
  },
);

defineEmits<{
  selectTool: [toolId: string | null];
  togglePin: [toolId: string];
}>();

const filter = ref('');

const sectionOrder = ['String Utilities', 'Encoders/Decoders', 'Date Utilities', 'Formatters', 'Converters', 'Miscellaneous'];
const filteredTools = computed(() => {
  const query = filter.value.trim().toLowerCase();
  if (!query) return props.tools;

  return props.tools.filter((tool) => `${tool.name} ${(tool.keywords ?? []).join(' ')}`.toLowerCase().includes(query));
});
const pinnedTools = computed(() => filteredTools.value.filter((tool) => props.pinnedToolIds.includes(tool.id)));
const groupedTools = computed(() =>
  sectionOrder
    .map((section) => ({
      section,
      tools: filteredTools.value.filter((tool) => tool.section === section),
    }))
    .filter((group) => group.tools.length),
);
</script>

<template>
  <aside class="sidebar" :data-density="density">
    <div class="sidebar__drag-region" />
    <div class="sidebar__filter">
      <AppTextInput v-model="filter" label="Search tools" hide-label placeholder="Search tools…" icon="search" />
    </div>

    <nav class="tool-nav" aria-label="Developer tools">
      <section v-if="pinnedTools.length" class="tool-nav__section">
        <h2>Starred</h2>
        <ToolNavItem
          v-for="tool in pinnedTools"
          :key="tool.id"
          :tool="tool"
          :active="tool.id === selectedToolId"
          :pinned="true"
          @select="$emit('selectTool', tool.id)"
          @toggle-pin="$emit('togglePin', tool.id)"
        />
      </section>

      <section v-for="group in groupedTools" :key="group.section" class="tool-nav__section">
        <h2>{{ group.section }}</h2>
        <ToolNavItem
          v-for="tool in group.tools"
          :key="tool.id"
          :tool="tool"
          :active="tool.id === selectedToolId"
          :pinned="pinnedToolIds.includes(tool.id)"
          @select="$emit('selectTool', tool.id)"
          @toggle-pin="$emit('togglePin', tool.id)"
        />
      </section>
      <p v-if="!groupedTools.length" class="tool-nav__empty">No tools match "{{ filter.trim() }}".</p>
    </nav>

    <footer class="sidebar__footer">
      <div class="sidebar__footer-links">
        <button type="button" @click="$emit('selectTool', null)">v{{ version }}</button>
        <span aria-hidden="true">|</span>
        <button type="button" @click="$emit('selectTool', attributionsToolId)">Attributions</button>
      </div>
      <button class="sidebar__settings-button" type="button" aria-label="Settings" @click="$emit('selectTool', settingsToolId)">
        <AppIcon name="cog" />
      </button>
    </footer>
  </aside>
</template>
