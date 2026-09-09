<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AppButton from '@/components/AppButton.vue';
import AppCopyButton from '@/components/AppCopyButton.vue';
import AppIcon from '@/components/AppIcon.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { usePersistedToolState } from '@/toolState';
import {
  buildCssSnippet,
  buildDataUrl,
  buildHtmlSnippet,
  extensionForMime,
  formatBytes,
  parseDataUrl,
  SUPPORTED_IMAGE_MIME_TYPES,
} from './base64ImageConverter';

type Mode = 'encode' | 'decode';

const mode = ref<Mode>('encode');
const decodeAssumedMime = ref<string>('image/png');
const decodeInput = ref('');

usePersistedToolState('base64-image-converter', { mode, decodeAssumedMime });

const modeOptions: Array<{ label: string; value: Mode }> = [
  { label: 'Encode', value: 'encode' },
  { label: 'Decode', value: 'decode' },
];
const mimeOptions = SUPPORTED_IMAGE_MIME_TYPES.map((mime) => ({ label: mime, value: mime }));

// --- Encode ---
const isDragOver = ref(false);
const encodeError = ref('');
const fileName = ref('');
const fileSize = ref(0);
const dataUrl = ref('');
const imageWidth = ref(0);
const imageHeight = ref(0);
const fileInputRef = ref<HTMLInputElement | null>(null);

const hasImage = computed(() => Boolean(dataUrl.value));
const rawBase64 = computed(() => parseDataUrl(dataUrl.value)?.base64 ?? '');
const cssSnippet = computed(() => (dataUrl.value ? buildCssSnippet(dataUrl.value) : ''));
const htmlSnippet = computed(() => (dataUrl.value ? buildHtmlSnippet(dataUrl.value) : ''));
const encodedSizeLabel = computed(() =>
  fileSize.value ? `${formatBytes(fileSize.value)} → ${formatBytes(rawBase64.value.length)} base64` : '',
);

function browseForFile(): void {
  fileInputRef.value?.click();
}

function handleFileInputChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';

  if (file) void loadFile(file);
}

function handleFileDrop(event: DragEvent): void {
  isDragOver.value = false;
  const file = event.dataTransfer?.files?.[0];

  if (file) void loadFile(file);
}

async function loadFile(file: File): Promise<void> {
  encodeError.value = '';

  if (!file.type.startsWith('image/')) {
    encodeError.value = `"${file.name}" doesn't look like an image file.`;
    return;
  }

  try {
    const result = await readFileAsDataUrl(file);
    const dimensions = await getImageDimensions(result);
    fileName.value = file.name;
    fileSize.value = file.size;
    dataUrl.value = result;
    imageWidth.value = dimensions.width;
    imageHeight.value = dimensions.height;
  } catch {
    encodeError.value = `Unable to read "${file.name}".`;
  }
}

function clearImage(): void {
  fileName.value = '';
  fileSize.value = 0;
  dataUrl.value = '';
  imageWidth.value = 0;
  imageHeight.value = 0;
  encodeError.value = '';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error('Unable to decode image'));
    image.src = url;
  });
}

// --- Decode ---
const decodeCandidateDataUrl = computed(() => {
  const trimmed = decodeInput.value.trim();
  if (!trimmed) return '';

  const parsed = parseDataUrl(trimmed);
  if (parsed) return buildDataUrl(parsed.mime, parsed.base64);

  return buildDataUrl(decodeAssumedMime.value, trimmed.replace(/\s+/g, ''));
});
const decodePreviewUrl = ref('');
const decodeError = ref('');
const decodedWidth = ref(0);
const decodedHeight = ref(0);

watch(
  decodeCandidateDataUrl,
  async (candidate) => {
    decodeError.value = '';
    decodePreviewUrl.value = '';
    decodedWidth.value = 0;
    decodedHeight.value = 0;

    if (!candidate) return;

    try {
      const dimensions = await getImageDimensions(candidate);
      if (candidate !== decodeCandidateDataUrl.value) return;

      decodePreviewUrl.value = candidate;
      decodedWidth.value = dimensions.width;
      decodedHeight.value = dimensions.height;
    } catch {
      if (candidate !== decodeCandidateDataUrl.value) return;

      decodeError.value = "That doesn't decode to a valid image. Check the base64 text and image type.";
    }
  },
  { immediate: true },
);

const canDownloadDecoded = computed(() => Boolean(decodePreviewUrl.value));
const isSavingDecoded = ref(false);

async function downloadDecodedImage(): Promise<void> {
  if (!decodePreviewUrl.value) return;

  isSavingDecoded.value = true;
  try {
    const parsed = parseDataUrl(decodePreviewUrl.value);
    const extension = extensionForMime(parsed?.mime ?? 'image/png');
    const blob = await (await fetch(decodePreviewUrl.value)).blob();

    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: `image.${extension}`,
        types: [{ description: 'Image', accept: { [blob.type]: [`.${extension}`] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    }

    const link = document.createElement('a');
    link.download = `image.${extension}`;
    link.href = URL.createObjectURL(blob);
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) throw error;
  } finally {
    isSavingDecoded.value = false;
  }
}
</script>

<template>
  <section class="base64-image-tool">
    <ToolToolbar>
      <AppSelect v-model="mode" label="Mode" :options="modeOptions" />
      <AppSelect
        v-if="mode === 'decode'"
        v-model="decodeAssumedMime"
        label="Image type"
        description="Used only when the pasted text has no data: URL prefix identifying the image type."
        :options="mimeOptions"
      />
      <template #badge>
        <ToolbarStatusBadge v-if="mode === 'encode' && encodeError" variant="error" :label="encodeError" />
        <ToolbarStatusBadge v-else-if="mode === 'encode' && encodedSizeLabel" :label="encodedSizeLabel" />
        <ToolbarStatusBadge v-else-if="mode === 'decode' && decodeError" variant="error" :label="decodeError" />
        <ToolbarStatusBadge v-else-if="mode === 'decode' && decodedWidth" :label="`${decodedWidth} × ${decodedHeight}px`" />
      </template>
    </ToolToolbar>

    <div v-if="mode === 'encode'" class="base64-image-tool__workspace">
      <section class="base64-image-tool__preview-panel">
        <div
          v-if="!hasImage"
          class="text-editor-file-drop"
          :class="{ 'text-editor-file-drop--active': isDragOver }"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleFileDrop"
        >
          <AppIcon name="fileImage" />
          <p>Drag and drop an image here</p>
          <AppButton variant="secondary" @click="browseForFile">Browse Files</AppButton>
          <input ref="fileInputRef" type="file" accept="image/*" class="text-editor-file-drop__input" @change="handleFileInputChange" />
        </div>

        <div v-else class="base64-image-preview">
          <img class="base64-image-preview__image" :src="dataUrl" :alt="fileName" />
          <div class="base64-image-preview__meta">
            <span>{{ fileName }}</span>
            <span>{{ imageWidth }} × {{ imageHeight }}px</span>
          </div>
          <AppButton variant="muted" size="sm" icon="times" @click="clearImage">Choose a Different Image</AppButton>
        </div>
      </section>

      <section class="base64-image-tool__output-panel">
        <TextEditor :model-value="dataUrl" label="Data URL" language="text" readonly placeholder="Load an image to generate a data URL" />
        <div class="base64-image-tool__copy-actions">
          <AppCopyButton label="Copy Base64" :value="rawBase64" :disabled="!hasImage" />
          <AppCopyButton label="Copy CSS" :value="cssSnippet" :disabled="!hasImage" />
          <AppCopyButton label="Copy HTML" :value="htmlSnippet" :disabled="!hasImage" />
        </div>
      </section>
    </div>

    <div v-else class="base64-image-tool__workspace">
      <section class="base64-image-tool__input-panel">
        <TextEditor v-model="decodeInput" label="Base64 Input" language="text" placeholder="Paste a base64 string or a data: URL" />
      </section>

      <section class="base64-image-tool__preview-panel">
        <div class="base64-image-preview">
          <img v-if="decodePreviewUrl" class="base64-image-preview__image" :src="decodePreviewUrl" alt="Decoded image preview" />
          <p v-else>{{ decodeError || 'Paste base64 image data to preview it here.' }}</p>
          <AppButton
            v-if="decodePreviewUrl"
            variant="primary"
            :icon="isSavingDecoded ? 'spinner' : 'save'"
            :disabled="!canDownloadDecoded || isSavingDecoded"
            @click="downloadDecodedImage"
          >
            {{ isSavingDecoded ? 'Saving' : 'Download Image' }}
          </AppButton>
        </div>
      </section>
    </div>
  </section>
</template>
