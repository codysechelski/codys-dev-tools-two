<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import AppButton from '@/components/AppButton.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import DataTable from '@/components/DataTable.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { usePersistedToolState } from '@/toolState';
import { defaultCaseSensitive } from '@/formatterDefaults';
import { analyzeLines, removeDuplicateLines, removeLinesByNumber, sortLines, type DuplicateLine, type SortDirection, type SortScheme } from './lineDeduplicator';

const input = ref(`Cody's Dev Tools
cody's dev tools
Sort and dedupe lines of text.
Sort and dedupe lines of text.
Paste your own list below, then use the toolbar to sort or remove duplicates.
Item 2
Item 10
Item 1`);

const options = reactive({
  caseSensitive: defaultCaseSensitive.value,
  trimWhitespace: true,
  ignoreBlankLines: true,
  sortScheme: 'ordinal' as SortScheme,
  sortDirection: 'ascending' as SortDirection,
});

usePersistedToolState('line-sorter-deduplicator', { input, options });

const sortSchemeOptions: Array<{ label: string; value: SortScheme }> = [
  { label: 'Ordinal', value: 'ordinal' },
  { label: 'Locale-aware', value: 'locale' },
  { label: 'Natural', value: 'natural' },
];
const sortDirectionOptions: Array<{ label: string; value: SortDirection }> = [
  { label: 'Ascending', value: 'ascending' },
  { label: 'Descending', value: 'descending' },
];

const lineOptions = computed(() => ({
  caseInsensitive: !options.caseSensitive,
  trimWhitespace: options.trimWhitespace,
  ignoreBlankLines: options.ignoreBlankLines,
}));

const analysis = computed(() => analyzeLines(input.value, lineOptions.value));
const statusLabel = computed(() => {
  const groupCount = analysis.value.duplicates.length;
  if (!groupCount) return 'No duplicate lines';

  const extraCount = analysis.value.duplicates.reduce((sum, group) => sum + (group.occurrences - 1), 0);
  return `${extraCount} duplicate line${extraCount === 1 ? '' : 's'} across ${groupCount} group${groupCount === 1 ? '' : 's'}`;
});

function applySort(): void {
  input.value = sortLines(input.value, { ...lineOptions.value, sortScheme: options.sortScheme, sortDirection: options.sortDirection });
}

function applyRemoveDuplicates(): void {
  input.value = removeDuplicateLines(input.value, lineOptions.value);
}

function removeDuplicate(duplicate: DuplicateLine): void {
  input.value = removeLinesByNumber(input.value, duplicate.lineNumbers.slice(1));
}

const editorRef = ref<InstanceType<typeof TextEditor> | null>(null);

function jumpToLine(lineNumber: number): void {
  editorRef.value?.scrollToLine(lineNumber);
}
</script>

<template>
  <section class="line-tool">
    <ToolToolbar class="line-tool__toolbar">
      <AppSelect
        v-model="options.sortScheme"
        label="Sort Method"
        description="Ordinal compares raw Unicode code points (digits and symbols outrank letters, uppercase outranks lowercase). Locale-aware follows human dictionary order. Natural also treats embedded numbers as numbers, so item2 sorts before item10."
        :options="sortSchemeOptions"
      />
      <AppSelect v-model="options.sortDirection" label="Direction" :options="sortDirectionOptions" />
      <AppToggle v-model="options.caseSensitive" label="Case Sensitive" />
      <AppToggle v-model="options.trimWhitespace" label="Trim whitespace" />
      <AppToggle v-model="options.ignoreBlankLines" label="Ignore blank lines" />
      <AppButton variant="field" icon="sortAlt" :disabled="!input" @click="applySort">Sort Lines</AppButton>
      <template #badge>
        <ToolbarStatusBadge :variant="analysis.duplicates.length ? 'warning' : 'success'" :label="statusLabel" />
      </template>
    </ToolToolbar>

    <div class="line-tool__workspace">
      <TextEditor ref="editorRef" v-model="input" label="Input" language="text" placeholder="Paste lines of text here" />

      <section class="line-tool-results">
        <DataTable scrollable class="line-tool-duplicates">
          <template #colgroup>
            <col />
            <col style="width: 5rem" />
            <col style="width: 10rem" />
            <col style="width: 11rem" />
          </template>
          <template #header>
            <th>Duplicate Lines</th>
            <th>Count</th>
            <th>Lines</th>
            <th>
              <AppButton
                variant="muted"
                size="xs"
                icon="barsStaggered"
                class="line-tool-duplicate__remove-button"
                :disabled="!analysis.duplicates.length"
                @click="applyRemoveDuplicates"
              >
                Remove All Duplicates
              </AppButton>
            </th>
          </template>
          <tr v-for="duplicate in analysis.duplicates" :key="`${duplicate.text}-${duplicate.lineNumbers[0]}`">
            <td><code class="line-tool-duplicate__text" :title="duplicate.text">{{ duplicate.text || '(blank line)' }}</code></td>
            <td class="line-tool-duplicate__meta">{{ duplicate.occurrences }}</td>
            <td class="line-tool-duplicate__meta">
              <template v-for="(lineNumber, index) in duplicate.lineNumbers" :key="lineNumber">
                <span v-if="index > 0">, </span>
                <button type="button" class="line-tool-duplicate__line-link" @click="jumpToLine(lineNumber)">{{ lineNumber }}</button>
              </template>
            </td>
            <td>
              <AppButton
                variant="muted"
                size="xs"
                icon="barsStaggered"
                class="line-tool-duplicate__remove-button"
                :aria-label="`Remove duplicates of ${duplicate.text || 'this blank line'}`"
                @click="removeDuplicate(duplicate)"
              >
                Remove
              </AppButton>
            </td>
          </tr>
          <tr v-if="!analysis.duplicates.length">
            <td colspan="4" class="line-tool-duplicate__empty">No duplicate lines found.</td>
          </tr>
        </DataTable>
      </section>
    </div>
  </section>
</template>
