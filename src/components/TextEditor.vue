<script setup lang="ts">
import { indentWithTab } from '@codemirror/commands';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { python } from '@codemirror/lang-python';
import { xml } from '@codemirror/lang-xml';
import { HighlightStyle, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { StreamLanguage } from '@codemirror/language';
import { EditorState, StateEffect, StateField } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, keymap, lineNumbers, placeholder } from '@codemirror/view';
import { lua } from '@codemirror/legacy-modes/mode/lua';
import { sql } from '@codemirror/legacy-modes/mode/sql';
import { yaml } from '@codemirror/legacy-modes/mode/yaml';
import { tags } from '@lezer/highlight';
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import AppButton from '@/components/AppButton.vue';
import AppCopyButton from '@/components/AppCopyButton.vue';
import AppIcon from '@/components/AppIcon.vue';
import AppModal from '@/components/AppModal.vue';
import HelpPopover from '@/components/HelpPopover.vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    description?: string;
    language?: 'css' | 'html' | 'javascript' | 'json' | 'lua' | 'python' | 'sql' | 'xml' | 'yaml' | 'text';
    readonly?: boolean;
    placeholder?: string;
    /** Character ranges (offsets into modelValue) to visually highlight, e.g. regex matches or diff word changes. */
    highlightRanges?: Array<{ from: number; to: number; className?: string }>;
    /** Full-width line backgrounds to apply, e.g. added/removed rows in the diff tool. */
    highlightLines?: Array<{ line: number; className: string }>;
  }>(),
  {
    language: 'text',
    readonly: false,
    placeholder: '',
    highlightRanges: () => [],
    highlightLines: () => [],
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const editorRoot = ref<HTMLDivElement | null>(null);
const view = shallowRef<EditorView | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isLoadFileModalOpen = ref(false);
const isDragOver = ref(false);
const fileLoadError = ref('');
const hasNativeFilePicker = Boolean(window.codyDevTools?.isElectron && window.codyDevTools.loadTextFile);

const codeHighlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier, tags.operatorKeyword, tags.controlKeyword, tags.definitionKeyword], color: 'var(--syntax-keyword)', fontWeight: '700' },
  { tag: [tags.atom, tags.bool, tags.null, tags.standard(tags.variableName), tags.self], color: 'var(--syntax-atom)' },
  { tag: [tags.number, tags.integer, tags.float], color: 'var(--syntax-number)' },
  { tag: [tags.string, tags.character, tags.regexp, tags.special(tags.string)], color: 'var(--syntax-string)' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment, tags.docComment], color: 'var(--syntax-comment)', fontStyle: 'italic' },
  { tag: [tags.variableName, tags.local(tags.variableName)], color: 'var(--syntax-variable)' },
  { tag: [tags.definition(tags.variableName), tags.function(tags.variableName), tags.function(tags.definition(tags.variableName))], color: 'var(--syntax-function)' },
  { tag: [tags.className, tags.definition(tags.className), tags.typeName], color: 'var(--syntax-class)' },
  { tag: [tags.propertyName, tags.definition(tags.propertyName), tags.attributeName], color: 'var(--syntax-property)' },
  { tag: [tags.tagName, tags.angleBracket], color: 'var(--syntax-tag)' },
  { tag: [tags.heading, tags.strong], color: 'var(--syntax-heading)', fontWeight: '800' },
  { tag: tags.emphasis, color: 'var(--syntax-heading)', fontStyle: 'italic' },
  { tag: [tags.link, tags.url], color: 'var(--syntax-link)', textDecoration: 'underline' },
  { tag: [tags.operator, tags.compareOperator, tags.arithmeticOperator, tags.logicOperator, tags.derefOperator], color: 'var(--syntax-operator)' },
  { tag: [tags.punctuation, tags.separator, tags.brace, tags.squareBracket, tags.paren], color: 'var(--syntax-punctuation)' },
  { tag: tags.invalid, color: 'var(--syntax-invalid)' },
]);

// A generic ANSI SQL keyword set extended with the SOQL (Salesforce) clauses the SQL Formatter
// tool needs to round-trip: WITH SECURITY_ENFORCED, USING SCOPE, FOR VIEW/REFERENCE, TYPEOF.
const SQL_KEYWORDS =
  'select from where and or not in like between is null nulls first last as distinct case when then else end exists ' +
  'group by order having limit offset union all insert into values update set delete with returning ' +
  'join inner left right full outer cross on using scope for view reference typeof security_enforced ' +
  'asc desc top default create alter drop table truncate cascade primary key foreign references constraint database schema';
const SQL_ATOMS = 'true false';
const SQL_BUILTINS = 'count sum avg min max upper lower trim coalesce cast convert now current_date current_timestamp';

function wordSet(words: string): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const word of words.split(' ')) result[word] = true;
  return result;
}

const sqlMode = sql({ keywords: wordSet(SQL_KEYWORDS), atoms: wordSet(SQL_ATOMS), builtin: wordSet(SQL_BUILTINS) });

const LINE_FLASH_HOLD_MS = 1000; // keep in sync with --duration-flash-hold in src/styles/_tokens.scss
const LINE_FLASH_FADE_MS = 900; // keep in sync with --duration-flash in src/styles/_tokens.scss
let lineFlashHoldTimeout: number | undefined;
let lineFlashFadeTimeout: number | undefined;

const lineFlashMark = Decoration.line({ attributes: { class: 'cm-line-flash' } });
const lineFlashFadingMark = Decoration.line({ attributes: { class: 'cm-line-flash cm-line-flash--fading' } });
const setLineFlash = StateEffect.define<{ pos: number; fading: boolean } | null>();
const lineFlashField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(setLineFlash)) {
        decorations =
          effect.value === null ? Decoration.none : Decoration.set([(effect.value.fading ? lineFlashFadingMark : lineFlashMark).range(effect.value.pos)]);
      }
    }
    return decorations;
  },
  provide: (field) => EditorView.decorations.from(field),
});

const setHighlightRanges = StateEffect.define<Array<{ from: number; to: number; className?: string }>>();
const highlightRangesField = StateField.define<DecorationSet>({
  create(state) {
    return buildHighlightDecorations(props.highlightRanges, state.doc.length);
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(setHighlightRanges)) {
        decorations = buildHighlightDecorations(effect.value, tr.state.doc.length);
      }
    }
    return decorations;
  },
  provide: (field) => EditorView.decorations.from(field),
});

function buildHighlightDecorations(ranges: Array<{ from: number; to: number; className?: string }>, docLength: number): DecorationSet {
  const marks = ranges
    .filter((range) => range.to > range.from && range.from >= 0 && range.to <= docLength)
    .sort((a, b) => a.from - b.from)
    .map((range) => Decoration.mark({ class: range.className ?? 'cm-highlight-range' }).range(range.from, range.to));

  return Decoration.set(marks, true);
}

const setHighlightLines = StateEffect.define<Array<{ line: number; className: string }>>();
const highlightLinesField = StateField.define<DecorationSet>({
  create(state) {
    return buildLineDecorations(props.highlightLines, state);
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(setHighlightLines)) {
        decorations = buildLineDecorations(effect.value, tr.state);
      }
    }
    return decorations;
  },
  provide: (field) => EditorView.decorations.from(field),
});

function buildLineDecorations(entries: Array<{ line: number; className: string }>, state: EditorState): DecorationSet {
  const totalLines = state.doc.lines;
  const marks = entries
    .filter((entry) => entry.line >= 1 && entry.line <= totalLines)
    .sort((a, b) => a.line - b.line)
    .map((entry) => Decoration.line({ class: entry.className }).range(state.doc.line(entry.line).from));

  return Decoration.set(marks, true);
}

onMounted(() => {
  if (!editorRoot.value) return;

  view.value = new EditorView({
    parent: editorRoot.value,
    state: createEditorState(),
  });
});

onBeforeUnmount(() => {
  window.clearTimeout(lineFlashHoldTimeout);
  window.clearTimeout(lineFlashFadeTimeout);
  view.value?.destroy();
});

watch(
  () => props.modelValue,
  (nextValue) => {
    const editor = view.value;
    if (!editor || editor.state.doc.toString() === nextValue) return;

    editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: nextValue,
      },
    });
  },
);

watch(
  () => props.highlightRanges,
  (ranges) => {
    view.value?.dispatch({ effects: setHighlightRanges.of(ranges) });
  },
  { deep: true },
);

watch(
  () => props.highlightLines,
  (lines) => {
    view.value?.dispatch({ effects: setHighlightLines.of(lines) });
  },
  { deep: true },
);

function scrollToRange(from: number, to: number): void {
  const editor = view.value;
  if (!editor) return;

  const docLength = editor.state.doc.length;
  const clampedFrom = Math.min(Math.max(from, 0), docLength);
  const clampedTo = Math.min(Math.max(to, clampedFrom), docLength);

  editor.dispatch({
    selection: { anchor: clampedFrom, head: clampedTo },
    scrollIntoView: true,
  });
  editor.focus();
}

function scrollToLine(lineNumber: number): void {
  const editor = view.value;
  if (!editor) return;

  const clampedLine = Math.min(Math.max(lineNumber, 1), editor.state.doc.lines);
  const line = editor.state.doc.line(clampedLine);

  editor.dispatch({
    selection: { anchor: line.from, head: line.from },
    scrollIntoView: true,
    effects: setLineFlash.of({ pos: line.from, fading: false }),
  });
  editor.focus();

  window.clearTimeout(lineFlashHoldTimeout);
  window.clearTimeout(lineFlashFadeTimeout);
  lineFlashHoldTimeout = window.setTimeout(() => {
    view.value?.dispatch({ effects: setLineFlash.of({ pos: line.from, fading: true }) });

    lineFlashFadeTimeout = window.setTimeout(() => {
      view.value?.dispatch({ effects: setLineFlash.of(null) });
    }, LINE_FLASH_FADE_MS);
  }, LINE_FLASH_HOLD_MS);
}

defineExpose({ scrollToLine, scrollToRange });

function clearContents(): void {
  if (props.readonly || !props.modelValue) return;

  emit('update:modelValue', '');
  view.value?.focus();
}

function openLoadFile(): void {
  fileLoadError.value = '';
  isDragOver.value = false;
  isLoadFileModalOpen.value = true;
}

function closeLoadFileModal(): void {
  isLoadFileModalOpen.value = false;
  fileLoadError.value = '';
  isDragOver.value = false;
}

function browseForFile(): void {
  if (hasNativeFilePicker && window.codyDevTools?.loadTextFile) {
    void loadFromNativePicker(window.codyDevTools.loadTextFile);
    return;
  }

  fileInputRef.value?.click();
}

async function loadFromNativePicker(loadTextFile: NonNullable<Window['codyDevTools']>['loadTextFile']): Promise<void> {
  const result = await loadTextFile();
  if (!result) return;

  if (result.content === undefined) {
    fileLoadError.value = result.error ?? 'Unable to read that file.';
    return;
  }

  emit('update:modelValue', result.content);
  closeLoadFileModal();
}

function handleFileInputChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';

  if (file) void loadBrowserFile(file);
}

function handleFileDrop(event: DragEvent): void {
  isDragOver.value = false;
  const file = event.dataTransfer?.files?.[0];

  if (file) void loadBrowserFile(file);
}

async function loadBrowserFile(file: File): Promise<void> {
  fileLoadError.value = '';

  const buffer = await file.arrayBuffer();
  if (looksLikeBinary(buffer)) {
    fileLoadError.value = `"${file.name}" doesn't look like a text file.`;
    return;
  }

  emit('update:modelValue', new TextDecoder('utf-8').decode(buffer));
  closeLoadFileModal();
}

function looksLikeBinary(buffer: ArrayBuffer): boolean {
  return new Uint8Array(buffer.slice(0, 8000)).includes(0);
}

function createEditorState(): EditorState {
  return EditorState.create({
    doc: props.modelValue,
    extensions: [
      lineNumbers(),
      keymap.of([indentWithTab]),
      indentUnit.of('  '),
      placeholder(props.placeholder),
      lineFlashField,
      highlightRangesField,
      highlightLinesField,
      syntaxHighlighting(codeHighlightStyle),
      EditorState.readOnly.of(props.readonly),
      EditorView.editable.of(!props.readonly),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) return;

        emit('update:modelValue', update.state.doc.toString());
      }),
      props.language === 'json' ? json() : [],
      props.language === 'css' ? css() : [],
      props.language === 'html' ? html() : [],
      props.language === 'javascript' ? javascript() : [],
      props.language === 'lua' ? StreamLanguage.define(lua) : [],
      props.language === 'python' ? python() : [],
      props.language === 'sql' ? StreamLanguage.define(sqlMode) : [],
      props.language === 'xml' ? xml() : [],
      props.language === 'yaml' ? StreamLanguage.define(yaml) : [],
    ],
  });
}
</script>

<template>
  <section class="text-editor" :class="{ 'text-editor--readonly': readonly }">
    <header class="text-editor__toolbar">
      <span class="text-editor__label-row">
        <strong>{{ label }}</strong>
        <HelpPopover v-if="description" :text="description" :label="`${label} help`" />
      </span>
      <div class="text-editor__actions">
        <AppButton v-if="!readonly" variant="muted" size="sm" icon="fileUpload" @click="openLoadFile">Load File</AppButton>
        <slot name="toolbar" />
        <AppButton v-if="!readonly" variant="muted" size="sm" icon="eraser" :disabled="!modelValue" @click="clearContents">
          Clear
        </AppButton>
        <AppCopyButton :value="modelValue" size="sm" :disabled="!modelValue" />
      </div>
    </header>

    <div ref="editorRoot" class="text-editor__body" />

    <AppModal
      v-if="!readonly"
      :open="isLoadFileModalOpen"
      title="Load File"
      subtitle="Load the contents of a text file into this editor."
      icon="fileUpload"
      @close="closeLoadFileModal"
    >
      <div
        class="text-editor-file-drop"
        :class="{ 'text-editor-file-drop--active': isDragOver }"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop.prevent="handleFileDrop"
      >
        <AppIcon name="fileUpload" />
        <p>Drag and drop a text file here</p>
        <AppButton variant="secondary" @click="browseForFile">Browse Files</AppButton>
        <input v-if="!hasNativeFilePicker" ref="fileInputRef" type="file" class="text-editor-file-drop__input" @change="handleFileInputChange" />
      </div>
      <p v-if="fileLoadError" class="form-text-input__error">{{ fileLoadError }}</p>
    </AppModal>
  </section>
</template>
