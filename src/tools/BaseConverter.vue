<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import AppCopyButton from '@/components/AppCopyButton.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import AppTextInput from '@/components/forms/AppTextInput.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { usePersistedToolState } from '@/toolState';
import { formatInBase, isValidBase, parseInBase } from './baseConverter';

type Field = 'binary' | 'octal' | 'decimal' | 'hex' | 'base36' | 'custom';

const INITIAL_VALUE = 255n;

const uppercase = ref(true);

function caseify(text: string): string {
  return uppercase.value ? text.toUpperCase() : text;
}

const canonicalValue = ref<bigint | null>(INITIAL_VALUE);

const binaryText = ref(caseify(formatInBase(INITIAL_VALUE, 2)));
const octalText = ref(caseify(formatInBase(INITIAL_VALUE, 8)));
const decimalText = ref(caseify(formatInBase(INITIAL_VALUE, 10)));
const hexText = ref(caseify(formatInBase(INITIAL_VALUE, 16)));
const base36Text = ref(caseify(formatInBase(INITIAL_VALUE, 36)));
const customBase = ref('2');
const customText = ref(caseify(formatInBase(INITIAL_VALUE, 2)));

usePersistedToolState('base-converter', { binaryText, octalText, decimalText, hexText, base36Text, customBase, customText, uppercase });

const fieldErrors = reactive<Record<Field, string>>({
  binary: '',
  octal: '',
  decimal: '',
  hex: '',
  base36: '',
  custom: '',
});

const customBaseOptions: Array<{ label: string; value: string }> = Array.from({ length: 35 }, (_, index) => ({
  label: String(index + 2),
  value: String(index + 2),
}));

const fieldBases: Record<Field, number> = { binary: 2, octal: 8, decimal: 10, hex: 16, base36: 36, custom: 2 };
const fieldRefs: Record<Field, typeof binaryText> = {
  binary: binaryText,
  octal: octalText,
  decimal: decimalText,
  hex: hexText,
  base36: base36Text,
  custom: customText,
};

let isSyncing = false;

const badgeError = computed(() => fieldErrors.binary || fieldErrors.octal || fieldErrors.decimal || fieldErrors.hex || fieldErrors.base36 || fieldErrors.custom);

watch(binaryText, () => handleFieldInput('binary'));
watch(octalText, () => handleFieldInput('octal'));
watch(decimalText, () => handleFieldInput('decimal'));
watch(hexText, () => handleFieldInput('hex'));
watch(base36Text, () => handleFieldInput('base36'));
watch(customText, () => handleFieldInput('custom', customBaseNumber()));

watch(customBase, () => {
  const base = customBaseNumber();
  if (!isValidBase(base)) {
    fieldErrors.custom = 'Base must be a whole number between 2 and 36.';
    return;
  }

  fieldErrors.custom = '';
  fieldBases.custom = base;
  if (canonicalValue.value === null || isSyncing) return;

  isSyncing = true;
  customText.value = caseify(formatInBase(canonicalValue.value, base));
  window.setTimeout(() => {
    isSyncing = false;
  });
});

watch(uppercase, () => {
  syncFields(null);
});

function customBaseNumber(): number {
  return Number(customBase.value);
}

function handleFieldInput(field: Field, baseOverride?: number): void {
  if (isSyncing) return;

  const base = baseOverride ?? fieldBases[field];
  const text = fieldRefs[field].value.trim();

  if (!text) {
    fieldErrors[field] = '';
    return;
  }

  if (!isValidBase(base)) return;

  const parsed = parseInBase(text, base);
  if (parsed === null) {
    fieldErrors[field] = `Enter a valid base ${base} number using ${allowedDigitsLabel(base)}.`;
    return;
  }

  fieldErrors[field] = '';
  canonicalValue.value = parsed;
  syncFields(field);
}

function syncFields(except: Field | null): void {
  const value = canonicalValue.value;
  if (value === null) return;

  isSyncing = true;
  if (except !== 'binary') binaryText.value = caseify(formatInBase(value, 2));
  if (except !== 'octal') octalText.value = caseify(formatInBase(value, 8));
  if (except !== 'decimal') decimalText.value = caseify(formatInBase(value, 10));
  if (except !== 'hex') hexText.value = caseify(formatInBase(value, 16));
  if (except !== 'base36') base36Text.value = caseify(formatInBase(value, 36));
  if (except !== 'custom') customText.value = caseify(formatInBase(value, fieldBases.custom));
  window.setTimeout(() => {
    isSyncing = false;
  });
}

function allowedDigitsLabel(base: number): string {
  const highestDigit = '0123456789abcdefghijklmnopqrstuvwxyz'[base - 1];
  return base <= 10 ? `0-${highestDigit}` : `0-9 and A-${highestDigit.toUpperCase()}`;
}
</script>

<template>
  <section class="base-converter-tool">
    <ToolToolbar>
      <AppToggle v-model="uppercase" label="Uppercase letters" description="Display A-F and beyond using uppercase letters in hexadecimal, base 36, and custom-base output." />
      <template #badge>
        <ToolbarStatusBadge v-if="badgeError" variant="error" :label="badgeError" />
        <ToolbarStatusBadge v-else label="Ready" />
      </template>
    </ToolToolbar>

    <div class="base-converter-tool__rows">
      <div class="base-converter-row">
        <AppTextInput v-model="binaryText" label="Binary (base 2)" placeholder="0" :error="fieldErrors.binary" />
        <AppCopyButton :value="binaryText" :disabled="!binaryText" />
      </div>
      <div class="base-converter-row">
        <AppTextInput v-model="octalText" label="Octal (base 8)" placeholder="0" :error="fieldErrors.octal" />
        <AppCopyButton :value="octalText" :disabled="!octalText" />
      </div>
      <div class="base-converter-row">
        <AppTextInput v-model="decimalText" label="Decimal (base 10)" placeholder="0" :error="fieldErrors.decimal" />
        <AppCopyButton :value="decimalText" :disabled="!decimalText" />
      </div>
      <div class="base-converter-row">
        <AppTextInput v-model="hexText" label="Hexadecimal (base 16)" placeholder="0" :error="fieldErrors.hex" />
        <AppCopyButton :value="hexText" :disabled="!hexText" />
      </div>
      <div class="base-converter-row">
        <AppTextInput v-model="base36Text" label="Base 36" placeholder="0" :error="fieldErrors.base36" />
        <AppCopyButton :value="base36Text" :disabled="!base36Text" />
      </div>
      <div class="base-converter-row">
        <AppTextInput v-model="customText" label="Custom" placeholder="0" :error="fieldErrors.custom" />
        <AppSelect v-model="customBase" label="Base" class="base-converter-row__base-field" :options="customBaseOptions" />
        <AppCopyButton :value="customText" :disabled="!customText" />
      </div>
    </div>
  </section>
</template>
