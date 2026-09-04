<script setup lang="ts">
import { computed, ref } from 'vue';
import HelpPopover from '@/components/HelpPopover.vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    description?: string;
    type?: 'text' | 'number' | 'tel' | 'email' | 'url';
    multiline?: boolean;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    error?: string;
    hideLabel?: boolean;
    inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'url';
    transformInput?: (value: string) => string;
    allowedCharacters?: RegExp;
    filter?: 'phone';
  }>(),
  {
    type: 'text',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();
const showError = ref(false);
const displayedError = computed(() => (showError.value ? props.error : ''));

function handleInput(event: Event): void {
  showError.value = false;
  const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  emit('update:modelValue', props.transformInput ? props.transformInput(value) : value);
}

function handleBlur(): void {
  showError.value = Boolean(props.error);
}

function handleChange(): void {
  showError.value = false;
}

function handleBeforeInput(event: Event): void {
  const inputEvent = event as InputEvent;
  if (!inputEvent.data || !inputEvent.inputType.startsWith('insert')) return;

  if (props.allowedCharacters) {
    if ([...inputEvent.data].every((character) => isAllowedCharacter(character))) return;

    event.preventDefault();
    return;
  }

  if (props.filter !== 'phone') return;
  if (/^\d+$/.test(inputEvent.data)) return;

  const input = event.target as HTMLInputElement;
  if (inputEvent.data === '+' && input.selectionStart === 0 && !input.value.includes('+')) return;

  event.preventDefault();
}

function isAllowedCharacter(character: string): boolean {
  if (!props.allowedCharacters) return true;

  props.allowedCharacters.lastIndex = 0;
  return props.allowedCharacters.test(character);
}
</script>

<template>
  <label class="form-text-input" :class="{ 'form-text-input--invalid': displayedError, 'form-control--label-hidden': hideLabel }">
    <span class="form-control__label-row" :class="{ 'form-control__label-row--hidden': hideLabel }">
      <span class="form-control__label-text">{{ label }}</span>
      <HelpPopover v-if="description" :text="description" :label="`${label} help`" />
    </span>
    <textarea
      v-if="multiline"
      :value="modelValue"
      rows="3"
      :aria-invalid="displayedError ? 'true' : undefined"
      @blur="handleBlur"
      @change="handleChange"
      @input="handleInput"
    />
    <input
      v-else
      :type="type"
      :min="min"
      :max="max"
      :step="step"
      :inputmode="inputMode"
      :placeholder="placeholder"
      :value="modelValue"
      :aria-label="hideLabel ? label : undefined"
      :aria-invalid="displayedError ? 'true' : undefined"
      @beforeinput="handleBeforeInput"
      @blur="handleBlur"
      @change="handleChange"
      @input="handleInput"
    />
    <span v-if="displayedError" class="form-text-input__error">{{ displayedError }}</span>
  </label>
</template>
