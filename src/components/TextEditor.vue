<script setup lang="ts">
import { indentWithTab } from '@codemirror/commands';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { python } from '@codemirror/lang-python';
import { HighlightStyle, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { StreamLanguage } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, placeholder } from '@codemirror/view';
import { lua } from '@codemirror/legacy-modes/mode/lua';
import { tags } from '@lezer/highlight';
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import AppButton from '@/components/AppButton.vue';
import HelpPopover from '@/components/HelpPopover.vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    description?: string;
    language?: 'css' | 'html' | 'javascript' | 'json' | 'lua' | 'python' | 'text';
    readonly?: boolean;
    placeholder?: string;
  }>(),
  {
    language: 'text',
    readonly: false,
    placeholder: '',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const editorRoot = ref<HTMLDivElement | null>(null);
const view = shallowRef<EditorView | null>(null);
const copyState = ref<'idle' | 'copied'>('idle');

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

async function copyContents(): Promise<void> {
  if (!props.modelValue) return;

  await navigator.clipboard.writeText(props.modelValue);
  copyState.value = 'copied';

  window.setTimeout(() => {
    copyState.value = 'idle';
  }, 1200);
}

function clearContents(): void {
  if (props.readonly || !props.modelValue) return;

  emit('update:modelValue', '');
}

function createEditorState(): EditorState {
  return EditorState.create({
    doc: props.modelValue,
    extensions: [
      lineNumbers(),
      keymap.of([indentWithTab]),
      indentUnit.of('  '),
      placeholder(props.placeholder),
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
        <slot name="toolbar" />
        <AppButton v-if="!readonly" class="text-editor__button" variant="muted" icon="eraser" :disabled="!modelValue" @click="clearContents">
          Clear
        </AppButton>
        <AppButton class="text-editor__button" variant="muted" icon="copy" :disabled="!modelValue" @click="copyContents">
          {{ copyState === 'copied' ? 'Copied' : 'Copy' }}
        </AppButton>
      </div>
    </header>

    <div ref="editorRoot" class="text-editor__body" />
  </section>
</template>
