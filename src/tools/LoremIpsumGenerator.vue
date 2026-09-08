<script setup lang="ts">
import { computed, ref } from 'vue';
import AppButton from '@/components/AppButton.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppTextInput from '@/components/forms/AppTextInput.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import HtmlPreview from '@/components/HtmlPreview.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import { usePersistedToolState } from '@/toolState';
import { generateLoremIpsum, stripHtml, type CountMode, type LoremUnit } from './loremIpsum';

const varyEndingPunctuation = ref(false);
const varySentencePunctuation = ref(false);
const includeCommonHtmlTags = ref(false);
const unitCount = ref('7');
const unit = ref<LoremUnit>('paragraphs');
const sentenceCountMode = ref<CountMode>('about');
const sentenceCount = ref('4');
const wordCountMode = ref<CountMode>('about');
const wordCount = ref('11');
const termWordCountMode = ref<CountMode>('exactly');
const termWordCount = ref('2');
const refreshSeed = ref(Date.now());

usePersistedToolState('lorem-ipsum-generator', {
  varyEndingPunctuation,
  varySentencePunctuation,
  includeCommonHtmlTags,
  unitCount,
  unit,
  sentenceCountMode,
  sentenceCount,
  wordCountMode,
  wordCount,
  termWordCountMode,
  termWordCount,
  refreshSeed,
});

const countModeOptions: Array<{ label: string; value: CountMode }> = [
  { label: 'about', value: 'about' },
  { label: 'exactly', value: 'exactly' },
];
const unitOptions: Array<{ label: string; value: LoremUnit }> = [
  { label: 'words', value: 'words' },
  { label: 'paragraphs', value: 'paragraphs' },
  { label: 'ordered list items', value: 'ordered-list-items' },
  { label: 'unordered list items', value: 'unordered-list-items' },
  { label: 'definition list items', value: 'definition-list-items' },
];
const output = computed(() =>
  generateLoremIpsum({
    unitCount: Number(unitCount.value),
    unit: unit.value,
    sentenceCountMode: sentenceCountMode.value,
    sentenceCount: Number(sentenceCount.value),
    wordCountMode: wordCountMode.value,
    wordCount: Number(wordCount.value),
    termWordCountMode: termWordCountMode.value,
    termWordCount: Number(termWordCount.value),
    varyEndingPunctuation: varyEndingPunctuation.value,
    varySentencePunctuation: varySentencePunctuation.value,
    includeCommonHtmlTags: includeCommonHtmlTags.value,
    random: createSeededRandom(refreshSeed.value),
  }),
);
const plainOutput = computed(() => stripHtml(output.value));
const showSentenceControls = computed(() => unit.value !== 'words');
const showDefinitionControls = computed(() => unit.value === 'definition-list-items');

function regenerate(): void {
  refreshSeed.value += 1;
}

function createSeededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}
</script>

<template>
  <section class="lorem-tool">
    <ToolToolbar class="lorem-tool__toolbar">
      <AppToggle
        v-model="varyEndingPunctuation"
        label="Vary ending punctuation"
        description="Uses mostly periods with occasional question marks and exclamation points, roughly matching polished long-form English prose."
      />
      <AppToggle
        v-model="varySentencePunctuation"
        label="Vary sentence punctuation"
        description="Adds natural commas and occasional semicolons, colons, parentheses, and quotation marks to make generated sentences feel less uniform."
      />
      <AppToggle
        v-model="includeCommonHtmlTags"
        label="Include common HTML tags"
        description="Randomly wraps words with common inline tags: em, strong, and placeholder links."
      />
    </ToolToolbar>

    <div class="lorem-tool__phrase" aria-label="Lorem ipsum generation options">
      <span>Generate</span>
      <AppTextInput v-model="unitCount" hide-label label="Item count" type="number" :min="1" :max="100" :step="1" />
      <AppSelect v-model="unit" hide-label label="Generated unit" :options="unitOptions" />
      <template v-if="showSentenceControls">
        <span>with</span>
        <AppSelect v-model="sentenceCountMode" hide-label label="Sentence count mode" :options="countModeOptions" />
        <AppTextInput v-model="sentenceCount" hide-label label="Sentence count" type="number" :min="1" :max="40" :step="1" />
        <span>sentences that have</span>
        <AppSelect v-model="wordCountMode" hide-label label="Word count mode" :options="countModeOptions" />
        <AppTextInput v-model="wordCount" hide-label label="Words per sentence" type="number" :min="1" :max="120" :step="1" />
        <span>words</span>
      </template>
      <template v-if="showDefinitionControls">
        <span>with</span>
        <AppSelect v-model="termWordCountMode" hide-label label="Term word count mode" :options="countModeOptions" />
        <AppTextInput v-model="termWordCount" hide-label label="Words in term" type="number" :min="1" :max="12" :step="1" />
        <span>words in term.</span>
      </template>
      <AppButton variant="field" icon="recycle" icon-only aria-label="Regenerate text" @click="regenerate" />
    </div>

    <div class="lorem-tool__outputs">
      <HtmlPreview :html="output" :plain-text="plainOutput" label="Text" />
      <TextEditor :model-value="output" label="Markup" language="html" readonly placeholder="Generated markup will appear here" />
    </div>
  </section>
</template>
