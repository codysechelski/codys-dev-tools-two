<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import DataList from '@/components/DataList.vue';
import RegexPatternInput from '@/components/RegexPatternInput.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { usePersistedToolState } from '@/toolState';
import { commonPatterns, testRegex, type RegexFlagsState, type RegexMatch } from './regexTester';

interface RegexSnippet {
  label: string;
  insert: string;
  selectStart?: number;
  selectEnd?: number;
  title: string;
}

interface RegexSnippetGroup {
  label: string;
  snippets: RegexSnippet[];
}

const snippetGroups: RegexSnippetGroup[] = [
  {
    label: 'Character Classes',
    snippets: [
      { label: '.', insert: '.', title: 'Any character except line break' },
      { label: '\\d', insert: '\\d', title: 'Digit (0-9)' },
      { label: '\\D', insert: '\\D', title: 'Non-digit' },
      { label: '\\w', insert: '\\w', title: 'Word character (letter, digit, underscore)' },
      { label: '\\W', insert: '\\W', title: 'Non-word character' },
      { label: '\\s', insert: '\\s', title: 'Whitespace' },
      { label: '\\S', insert: '\\S', title: 'Non-whitespace' },
      { label: '[…]', insert: '[]', selectStart: 1, selectEnd: 1, title: 'Character set' },
      { label: '[^…]', insert: '[^]', selectStart: 2, selectEnd: 2, title: 'Negated character set' },
    ],
  },
  {
    label: 'Anchors',
    snippets: [
      { label: '^', insert: '^', title: 'Start of line' },
      { label: '$', insert: '$', title: 'End of line' },
      { label: '\\b', insert: '\\b', title: 'Word boundary' },
      { label: '\\B', insert: '\\B', title: 'Non-word boundary' },
    ],
  },
  {
    label: 'Quantifiers',
    snippets: [
      { label: '*', insert: '*', title: 'Zero or more' },
      { label: '+', insert: '+', title: 'One or more' },
      { label: '?', insert: '?', title: 'Zero or one' },
      { label: '{n,m}', insert: '{n,m}', selectStart: 1, selectEnd: 4, title: 'Between n and m times' },
    ],
  },
  {
    label: 'Groups',
    snippets: [
      { label: '(…)', insert: '()', selectStart: 1, selectEnd: 1, title: 'Capturing group' },
      { label: '(?:…)', insert: '(?:)', selectStart: 3, selectEnd: 3, title: 'Non-capturing group' },
      { label: '(?<name>…)', insert: '(?<name>)', selectStart: 3, selectEnd: 7, title: 'Named capturing group' },
      { label: '|', insert: '|', title: 'Alternation (or)' },
    ],
  },
];

const pattern = ref('\\b[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}\\b');
const testText = ref(`Contact us at hello@example.com or sales@example.co.uk for support.
This line has no email address in it.
A second contact is support@example.com.`);

const flags = reactive<RegexFlagsState>({
  global: true,
  ignoreCase: false,
  multiline: false,
  dotAll: false,
  unicode: false,
  sticky: false,
});

usePersistedToolState('regex-tester', { pattern, testText, flags });

const presetSelection = ref('');
const presetOptions = computed(() => [
  { label: 'Choose a pattern…', value: '' },
  ...commonPatterns.map((preset) => ({ label: preset.label, value: preset.id })),
]);

watch(presetSelection, (id) => {
  if (!id) return;

  const preset = commonPatterns.find((candidate) => candidate.id === id);
  if (preset) {
    pattern.value = preset.pattern;
    Object.assign(flags, { global: false, ignoreCase: false, multiline: false, dotAll: false, unicode: false, sticky: false }, preset.flags);
  }

  presetSelection.value = '';
});

const result = computed(() => testRegex(pattern.value, flags, testText.value));
const errorMessage = computed(() => result.value.error);
const matches = computed(() => result.value.matches);
const highlightRanges = computed(() => matches.value.map((match) => ({ from: match.index, to: match.endIndex })));

const matchStatusLabel = computed(() => {
  if (!pattern.value) return 'Enter a pattern';
  if (!testText.value) return 'Add test text';

  const count = matches.value.length;
  return `${count.toLocaleString()} match${count === 1 ? '' : 'es'}`;
});

const emptyMatchesLabel = computed(() => {
  if (!pattern.value) return 'Enter a pattern above to find matches.';
  if (errorMessage.value) return 'Fix the pattern error above to find matches.';
  if (!testText.value) return 'Add test text to find matches.';
  return 'No matches found.';
});

const patternEditorRef = ref<InstanceType<typeof RegexPatternInput> | null>(null);
const testEditorRef = ref<InstanceType<typeof TextEditor> | null>(null);

function insertToken(snippet: RegexSnippet): void {
  patternEditorRef.value?.insertSnippet(snippet.insert, snippet.selectStart, snippet.selectEnd);
}

function jumpToMatch(match: RegexMatch): void {
  testEditorRef.value?.scrollToRange(match.index, match.endIndex);
}
</script>

<template>
  <section class="regex-tool">
    <ToolToolbar class="regex-tool__toolbar">
      <AppSelect
        v-model="presetSelection"
        label="Common Patterns"
        description="Replace the pattern with a ready-made example and set its recommended flags."
        :options="presetOptions"
      />
      <AppToggle v-model="flags.global" label="Global (g)" description="Find every match in the test text instead of stopping at the first." />
      <AppToggle v-model="flags.ignoreCase" label="Ignore Case (i)" description="Match letters without regard to uppercase or lowercase." />
      <AppToggle v-model="flags.multiline" label="Multiline (m)" description="^ and $ match the start and end of each line, not just the whole string." />
      <AppToggle v-model="flags.dotAll" label="Dot All (s)" description="Let . also match line break characters." />
      <AppToggle v-model="flags.unicode" label="Unicode (u)" description="Treat the pattern as a sequence of Unicode code points." />
      <AppToggle v-model="flags.sticky" label="Sticky (y)" description="Match only starting from the current search position, like an anchored search." />
      <template #badge>
        <ToolbarStatusBadge v-if="errorMessage" variant="error" :label="errorMessage" />
        <ToolbarStatusBadge v-else :label="matchStatusLabel" />
      </template>
    </ToolToolbar>

    <RegexPatternInput ref="patternEditorRef" v-model="pattern" placeholder="Enter a regular expression, e.g. \b\w+@\w+\.\w+\b">
      <template #footer>
        <div class="regex-tool__footer">
          <div v-for="group in snippetGroups" :key="group.label" class="regex-tool__snippet-group">
            <span class="regex-tool__snippet-group-label">{{ group.label }}</span>
            <button
              v-for="snippet in group.snippets"
              :key="snippet.label"
              type="button"
              class="regex-tool__snippet-button"
              :title="snippet.title"
              @click="insertToken(snippet)"
            >
              {{ snippet.label }}
            </button>
          </div>
        </div>
      </template>
    </RegexPatternInput>

    <div class="regex-tool__workspace">
      <TextEditor
        ref="testEditorRef"
        v-model="testText"
        label="Test String"
        language="text"
        placeholder="Paste text here to test your regular expression against it"
        :highlight-ranges="highlightRanges"
      />

      <section class="regex-tool-results">
        <DataList header scrollable class="regex-tool-matches">
          <template #header>
            <span>Matches</span>
            <span>{{ matches.length.toLocaleString() }}</span>
          </template>
          <button
            v-for="(match, index) in matches"
            :key="`${match.index}-${match.endIndex}`"
            type="button"
            class="data-list__row regex-tool-match"
            @click="jumpToMatch(match)"
          >
            <span class="regex-tool-match__index">{{ index + 1 }}</span>
            <code class="regex-tool-match__text">{{ match.text || '(empty match)' }}</code>
            <span class="regex-tool-match__range">{{ match.index }}–{{ match.endIndex }}</span>
          </button>
          <p v-if="!matches.length" class="regex-tool-matches__empty">{{ emptyMatchesLabel }}</p>
        </DataList>
      </section>
    </div>
  </section>
</template>
