<script setup lang="ts">
import { computed, ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { usePersistedToolState } from '@/toolState';
import { buildSvgPreviewUrl, formatDimension, validateSvg } from './svgViewer';

const input = ref(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="42" fill="#67e8f9" />
  <path d="M32 54l14 14 24-30" fill="none" stroke="#0c1029" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
</svg>`);

usePersistedToolState('svg-viewer', { input });

const validation = computed(() => validateSvg(input.value));
const previewUrl = computed(() => (validation.value.valid ? buildSvgPreviewUrl(input.value) : ''));

const dimensionLabel = computed(() => {
  const { width, height } = validation.value;
  return width !== null && height !== null ? `${formatDimension(width)} × ${formatDimension(height)}` : '';
});

const statusLabel = computed(() => {
  if (!input.value.trim()) return 'Paste SVG markup';
  return dimensionLabel.value || 'Valid SVG';
});

const emptyPreviewMessage = computed(() => (input.value.trim() ? 'Fix the markup above to see a preview.' : 'Paste SVG markup to preview it here.'));
</script>

<template>
  <section class="svg-viewer-tool">
    <ToolToolbar class="svg-viewer-tool__toolbar">
      <template #badge>
        <ToolbarStatusBadge v-if="validation.error" variant="error" :label="validation.error" />
        <ToolbarStatusBadge v-else :label="statusLabel" />
      </template>
    </ToolToolbar>

    <div class="svg-viewer-tool__workspace">
      <TextEditor v-model="input" label="SVG Source" language="xml" placeholder="Paste SVG markup here" />

      <section class="svg-viewer-preview-panel">
        <div v-if="previewUrl" class="svg-viewer-preview">
          <img class="svg-viewer-preview__image" :src="previewUrl" alt="SVG preview" />
        </div>
        <div v-else class="svg-viewer-preview svg-viewer-preview--empty">
          <AppIcon name="vectorSquare" />
          <p>{{ emptyPreviewMessage }}</p>
        </div>
      </section>
    </div>
  </section>
</template>
