<script setup lang="ts" generic="T extends string">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import HelpPopover from '@/components/HelpPopover.vue';

const props = defineProps<{
  modelValue: T;
  label: string;
  description?: string;
  hideLabel?: boolean;
  labelBadge?: string;
  labelBadgeVisible?: boolean;
  options: Array<{
    label: string;
    value: T;
  }>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: T];
}>();

const root = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const activeIndex = ref(0);
const opensAbove = ref(false);
const searchQuery = ref('');
const selectedOption = computed(() => props.options.find((option) => option.value === props.modelValue) ?? { label: props.modelValue, value: props.modelValue });
const longestOptionLength = computed(() => Math.max(...props.options.map((option) => option.label.length), props.label.length));
const minimumWidth = computed(() => `${Math.max(10.5, longestOptionLength.value * 0.58 + 3.5)}rem`);
const filteredOptions = computed(() => {
  const normalizedQuery = searchQuery.value.trim().toLowerCase();
  if (!normalizedQuery) return props.options;

  return props.options.filter((option) => {
    return option.label.toLowerCase().includes(normalizedQuery) || option.value.toLowerCase().includes(normalizedQuery);
  });
});

watch(filteredOptions, (options) => {
  if (!options.length) {
    activeIndex.value = 0;
    return;
  }

  activeIndex.value = Math.min(activeIndex.value, options.length - 1);
});

onMounted(() => {
  document.addEventListener('pointerdown', handleOutsidePointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleOutsidePointerDown);
});

function toggleOpen(): void {
  isOpen.value ? closeMenu() : openMenu();
}

function openMenu(): void {
  activeIndex.value = Math.max(0, props.options.findIndex((option) => option.value === props.modelValue));
  isOpen.value = true;
  void updateMenuPlacement();
}

function closeMenu(): void {
  isOpen.value = false;
  opensAbove.value = false;
  searchQuery.value = '';
}

function selectOption(value: T): void {
  emit('update:modelValue', value);
  closeMenu();
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeMenu();
    return;
  }

  if (isSearchKey(event)) {
    event.preventDefault();
    if (!isOpen.value) openMenu();
    searchQuery.value += event.key;
    activeIndex.value = 0;
    void updateMenuPlacement();
    return;
  }

  if (event.key === 'Backspace' && isOpen.value && searchQuery.value) {
    event.preventDefault();
    searchQuery.value = searchQuery.value.slice(0, -1);
    activeIndex.value = 0;
    void updateMenuPlacement();
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    if (!isOpen.value) {
      openMenu();
      return;
    }

    selectOption(filteredOptions.value[activeIndex.value]?.value ?? props.modelValue);
    return;
  }

  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

  event.preventDefault();
  if (!isOpen.value) openMenu();
  if (!filteredOptions.value.length) return;

  const direction = event.key === 'ArrowDown' ? 1 : -1;
  activeIndex.value = (activeIndex.value + direction + filteredOptions.value.length) % filteredOptions.value.length;
}

function isSearchKey(event: KeyboardEvent): boolean {
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  if (event.key.length !== 1) return false;

  return event.key !== ' ' || (isOpen.value && searchQuery.value.length > 0);
}

function handleOutsidePointerDown(event: PointerEvent): void {
  if (!root.value?.contains(event.target as Node)) closeMenu();
}

async function updateMenuPlacement(): Promise<void> {
  await nextTick();
  if (!root.value) return;

  const rect = root.value.getBoundingClientRect();
  const optionHeight = 34;
  const menuPadding = 16;
  const gap = 8;
  const maxMenuHeight = Math.min(320, window.innerHeight * 0.52);
  const estimatedMenuHeight = Math.min(maxMenuHeight, props.options.length * optionHeight + menuPadding);
  const spaceBelow = window.innerHeight - rect.bottom - gap;
  const spaceAbove = rect.top - gap;

  opensAbove.value = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;
}
</script>

<template>
  <div ref="root" class="form-select" :class="{ 'form-select--open': isOpen, 'form-select--above': opensAbove, 'form-control--label-hidden': hideLabel }" :style="{ '--select-min-width': minimumWidth }">
    <span class="form-control__label-row" :class="{ 'form-control__label-row--hidden': hideLabel }">
      <span class="form-control__label-text">{{ label }}</span>
      <HelpPopover v-if="description" :text="description" :label="`${label} help`" />
      <span v-if="labelBadge" class="form-control__label-badge" :class="{ 'form-control__label-badge--visible': labelBadgeVisible }">
        <AppIcon name="sparkles" />
        {{ labelBadge }}
      </span>
    </span>
    <button
      type="button"
      class="form-select__trigger"
      role="combobox"
      :aria-label="label"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="toggleOpen"
      @keydown="handleKeydown"
    >
      <span>{{ selectedOption?.label }}</span>
      <span class="form-select__chevron" aria-hidden="true" />
    </button>
    <div v-if="isOpen" class="form-select__menu" role="listbox">
      <div v-if="searchQuery" class="form-select__search-hint">{{ searchQuery }}</div>
      <button
        v-for="(option, index) in filteredOptions"
        :key="option.value"
        type="button"
        class="form-select__option"
        :class="{ 'form-select__option--selected': option.value === modelValue, 'form-select__option--active': index === activeIndex }"
        role="option"
        :aria-selected="option.value === modelValue"
        :data-value="option.value"
        @mouseenter="activeIndex = index"
        @click="selectOption(option.value)"
      >
        {{ option.label }}
      </button>
      <div v-if="!filteredOptions.length" class="form-select__empty">No matching options</div>
    </div>
  </div>
</template>
