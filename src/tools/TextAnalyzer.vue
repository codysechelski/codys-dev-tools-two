<script setup lang="ts">
import { computed, ref } from 'vue';
import DataList from '@/components/DataList.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import { analyzeText } from './textAnalyzer';

const input = ref(`Cody's Dev Tools is a focused desktop-style utility app for developers.

Paste long-form text here to analyze paragraphs, words, readability, and repeated terms. The word frequency list updates as you type.`);
const caseSensitive = ref(false);

const analysis = computed(() => analyzeText(input.value, caseSensitive.value));
const summaryStats = computed(() => [
  { label: 'Paragraphs', value: analysis.value.paragraphCount.toLocaleString() },
  { label: 'Words', value: analysis.value.wordCount.toLocaleString() },
  { label: 'Non-whitespace characters', value: analysis.value.nonWhitespaceCharacterCount.toLocaleString() },
  { label: 'Total characters', value: analysis.value.totalCharacterCount.toLocaleString() },
  { label: 'Sentences', value: analysis.value.sentenceCount.toLocaleString() },
  { label: 'Lines', value: analysis.value.lineCount.toLocaleString() },
  { label: 'Unique words', value: analysis.value.uniqueWordCount.toLocaleString() },
  { label: 'Reading time', value: analysis.value.estimatedReadingMinutes ? `${analysis.value.estimatedReadingMinutes} min` : '0 min' },
  { label: 'Avg words / sentence', value: analysis.value.averageWordsPerSentence.toLocaleString() },
  { label: 'Avg characters / word', value: analysis.value.averageCharactersPerWord.toLocaleString() },
  { label: 'Longest word', value: analysis.value.longestWord || 'None' },
  { label: 'Most common word', value: analysis.value.mostCommonWord || 'None' },
]);
</script>

<template>
  <section class="text-analyzer-tool">
    <ToolToolbar class="text-analyzer-tool__toolbar">
      <AppToggle v-model="caseSensitive" label="Case-sensitive word count" />
    </ToolToolbar>

    <div class="text-analyzer-tool__workspace">
      <TextEditor v-model="input" label="Input Text" language="text" placeholder="Paste long-form text here" />

      <section class="text-analyzer-results">
        <DataList class="text-analyzer-stats">
          <article v-for="stat in summaryStats" :key="stat.label" class="data-list__row text-analyzer-stat">
            <span>{{ stat.label }}</span>
            <strong>{{ stat.value }}</strong>
          </article>
        </DataList>

        <DataList header scrollable class="text-analyzer-frequency">
          <template #header>
            <span>Word Frequency</span>
            <span>{{ analysis.wordFrequency.length.toLocaleString() }} unique</span>
          </template>
          <article v-for="item in analysis.wordFrequency" :key="item.word" class="data-list__row text-analyzer-frequency__row">
            <code>{{ item.word }}</code>
            <span>{{ item.count.toLocaleString() }}</span>
            <span>{{ item.percentage }}%</span>
          </article>
          <p v-if="!analysis.wordFrequency.length" class="text-analyzer-frequency__empty">No words to count yet.</p>
        </DataList>
      </section>
    </div>
  </section>
</template>
