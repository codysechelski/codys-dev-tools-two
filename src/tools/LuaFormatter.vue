<script setup lang="ts">
import { computed, ref } from 'vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { formatLua, type CodeIndentation } from './codeFormatters';

const input = ref(`local function greet(name)\nlocal message = "Hello, " .. name\nreturn message\nend`);
const indentation = ref<CodeIndentation>('2-spaces');
const preserveComments = ref(true);
const preserveBlankLines = ref(false);
const normalizeIndentation = ref(true);
const result = computed(() =>
  formatLua(input.value, {
    mode: 'formatted',
    indentation: indentation.value,
    preserveComments: preserveComments.value,
    preserveBlankLines: preserveBlankLines.value,
    luaNormalizeIndentation: normalizeIndentation.value,
  }),
);
const parseError = computed(() => result.value.error);
const formattedOutput = computed(() => result.value.output);
const indentationOptions: Array<{ label: string; value: CodeIndentation }> = [
  { label: '2 spaces', value: '2-spaces' },
  { label: '4 spaces', value: '4-spaces' },
  { label: 'Tabs', value: 'tabs' },
];
</script>

<template>
  <section class="formatter-tool">
    <ToolToolbar>
      <AppSelect v-model="indentation" label="Indent" :options="indentationOptions" />
      <AppToggle v-model="preserveComments" label="Preserve comments" description="Keep Lua line and block comments in formatted output." />
      <AppToggle v-model="preserveBlankLines" label="Preserve blank lines" description="Keep intentional blank lines where possible in formatted output." />
      <AppToggle v-model="normalizeIndentation" label="Normalize indentation" description="Rewrite leading indentation around Lua block keywords using the selected indent style." />
      <template #badge>
        <ToolbarStatusBadge v-if="parseError" variant="error" :label="parseError" />
        <ToolbarStatusBadge v-else label="Valid Lua" />
      </template>
    </ToolToolbar>
    <div class="formatter-tool__editors">
      <TextEditor v-model="input" label="Input" language="lua" placeholder="Paste Lua here" />
      <TextEditor :model-value="formattedOutput" label="Formatted Output" language="lua" readonly placeholder="Formatted Lua will appear here" />
    </div>
  </section>
</template>
