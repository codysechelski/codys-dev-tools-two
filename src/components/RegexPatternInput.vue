<script setup lang="ts">
import { EditorState, StateField } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView, keymap, placeholder } from '@codemirror/view';
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import AppButton from '@/components/AppButton.vue';
import AppCopyButton from '@/components/AppCopyButton.vue';
import HelpPopover from '@/components/HelpPopover.vue';
import { REGEX_TOKEN_CLASS_NAMES, tokenizeRegexPattern } from '@/tools/regexPatternTokens';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    description?: string;
    placeholder?: string;
    invalid?: boolean;
  }>(),
  {
    label: 'Regular Expression',
    description: undefined,
    placeholder: '',
    invalid: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const editorRoot = ref<HTMLDivElement | null>(null);
const view = shallowRef<EditorView | null>(null);

const patternHighlightField = StateField.define<DecorationSet>({
  create(state) {
    return buildPatternDecorations(state.doc.toString());
  },
  update(decorations, tr) {
    return tr.docChanged ? buildPatternDecorations(tr.state.doc.toString()) : decorations.map(tr.changes);
  },
  provide: (field) => EditorView.decorations.from(field),
});

function buildPatternDecorations(pattern: string): DecorationSet {
  const marks = tokenizeRegexPattern(pattern)
    .filter((token) => REGEX_TOKEN_CLASS_NAMES[token.type])
    .map((token) => Decoration.mark({ class: REGEX_TOKEN_CLASS_NAMES[token.type] }).range(token.from, token.to));

  return Decoration.set(marks, true);
}

function stripNewlines(value: string): string {
  return value.replace(/[\r\n]+/g, '');
}

onMounted(() => {
  if (!editorRoot.value) return;

  view.value = new EditorView({
    parent: editorRoot.value,
    state: createEditorState(),
  });
});

onBeforeUnmount(() => {
  view.value?.destroy();
});

watch(
  () => props.modelValue,
  (nextValue) => {
    const editor = view.value;
    if (!editor) return;

    const sanitized = stripNewlines(nextValue);
    if (editor.state.doc.toString() === sanitized) return;

    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: sanitized },
    });
  },
);

function clearContents(): void {
  const editor = view.value;
  if (!editor || !props.modelValue) return;

  editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: '' } });
  editor.focus();
}

/** Inserts a snippet at the cursor (replacing any selection), then selects the given offset range within it. */
function insertSnippet(snippet: string, selectStart?: number, selectEnd?: number): void {
  const editor = view.value;
  if (!editor) return;

  const cleaned = stripNewlines(snippet);
  const { from, to } = editor.state.selection.main;
  const anchorOffset = selectStart ?? cleaned.length;
  const headOffset = selectEnd ?? anchorOffset;

  editor.dispatch({
    changes: { from, to, insert: cleaned },
    selection: { anchor: from + anchorOffset, head: from + headOffset },
    scrollIntoView: true,
  });
  editor.focus();
}

defineExpose({ insertSnippet });

function createEditorState(): EditorState {
  return EditorState.create({
    doc: stripNewlines(props.modelValue),
    extensions: [
      keymap.of([
        { key: 'Enter', run: () => true },
        { key: 'Mod-Enter', run: () => true },
      ]),
      EditorView.domEventHandlers({
        paste(event, editorView) {
          const text = event.clipboardData?.getData('text/plain');
          if (text === undefined || !/[\r\n]/.test(text)) return false;

          event.preventDefault();
          editorView.dispatch(editorView.state.replaceSelection(stripNewlines(text)));
          return true;
        },
      }),
      placeholder(props.placeholder),
      patternHighlightField,
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) return;

        emit('update:modelValue', update.state.doc.toString());
      }),
    ],
  });
}
</script>

<template>
  <section class="regex-pattern-input text-editor" :class="{ 'regex-pattern-input--invalid': invalid }">
    <header class="text-editor__toolbar">
      <span class="text-editor__label-row">
        <strong>{{ label }}</strong>
        <HelpPopover v-if="description" :text="description" :label="`${label} help`" />
      </span>
      <div class="text-editor__actions">
        <AppButton variant="muted" size="sm" icon="eraser" :disabled="!modelValue" @click="clearContents">Clear</AppButton>
        <AppCopyButton :value="modelValue" size="sm" :disabled="!modelValue" />
      </div>
    </header>

    <div ref="editorRoot" class="text-editor__body regex-pattern-input__body" />

    <footer v-if="$slots.footer" class="regex-pattern-input__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>
