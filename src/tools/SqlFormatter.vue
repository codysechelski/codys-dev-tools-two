<script setup lang="ts">
import { computed, ref } from 'vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { usePersistedToolState } from '@/toolState';
import { defaultIndentStyle, defaultPreserveComments } from '@/formatterDefaults';
import { formatSql, type SqlFormatterOptions, type SqlIndentation, type SqlKeywordCase, type SqlOutputMode } from './sqlFormatter';

const input = ref(`SELECT Id, Name, (SELECT Id, LastName FROM Contacts)
FROM Account
WHERE Industry = 'Technology' AND AnnualRevenue > 1000000
WITH SECURITY_ENFORCED
ORDER BY Name
LIMIT 20`);

const outputMode = ref<SqlOutputMode>('expanded');
const indentation = ref<SqlIndentation>(defaultIndentStyle.value);
const keywordCase = ref<SqlKeywordCase>('upper');
const preserveComments = ref(defaultPreserveComments.value);

usePersistedToolState('sql-formatter', { input, outputMode, indentation, keywordCase, preserveComments });

const result = computed(() =>
  formatSql(input.value, {
    mode: outputMode.value,
    indentation: indentation.value,
    keywordCase: keywordCase.value,
    preserveComments: preserveComments.value,
  } satisfies SqlFormatterOptions),
);
const parseError = computed(() => result.value.error);
const formattedOutput = computed(() => result.value.output);

const outputModeOptions: Array<{ label: string; value: SqlOutputMode }> = [
  { label: 'Expanded', value: 'expanded' },
  { label: 'Compact', value: 'compact' },
  { label: 'Minified', value: 'minified' },
];
const indentationOptions: Array<{ label: string; value: SqlIndentation }> = [
  { label: '2 spaces', value: '2-spaces' },
  { label: '4 spaces', value: '4-spaces' },
  { label: 'Tabs', value: 'tabs' },
];
const keywordCaseOptions: Array<{ label: string; value: SqlKeywordCase }> = [
  { label: 'UPPERCASE', value: 'upper' },
  { label: 'lowercase', value: 'lower' },
  { label: 'Preserve', value: 'preserve' },
];
</script>

<template>
  <section class="formatter-tool">
    <ToolToolbar>
      <AppSelect v-model="outputMode" label="Output" :options="outputModeOptions" />
      <AppSelect v-model="indentation" label="Indent" :options="indentationOptions" />
      <AppSelect
        v-model="keywordCase"
        label="Keyword Case"
        description="Applies only to recognized SQL/SOQL keywords (SELECT, FROM, AND, IN, COUNT, ...) — table, column, and relationship names are never changed."
        :options="keywordCaseOptions"
      />
      <AppToggle v-model="preserveComments" label="Preserve comments" description="Keep -- and /* */ comments in the output instead of removing them." />
      <template #badge>
        <ToolbarStatusBadge v-if="parseError" variant="error" :label="parseError" />
        <ToolbarStatusBadge v-else label="Valid SQL/SOQL" />
      </template>
    </ToolToolbar>

    <div class="formatter-tool__editors">
      <TextEditor v-model="input" label="Input" language="sql" placeholder="Paste a SQL or SOQL query here" />
      <TextEditor
        :model-value="formattedOutput"
        label="Formatted Output"
        language="sql"
        readonly
        placeholder="Formatted SQL/SOQL will appear here"
      />
    </div>
  </section>
</template>
