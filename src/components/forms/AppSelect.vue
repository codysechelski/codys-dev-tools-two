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
    group?: string;
    leadingText?: string;
    description?: string;
    keywords?: string[];
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
const selectedOption = computed(
  () => props.options.find((option) => option.value === props.modelValue) ?? { label: props.modelValue, value: props.modelValue },
);
const longestOptionLength = computed(() => Math.max(...props.options.map((option) => option.label.length), props.label.length));
const minimumWidth = computed(
  () => `${Math.max(10.5, Math.min(props.options.some((option) => option.description) ? 24 : Infinity, longestOptionLength.value * 0.58 + 3.5))}rem`,
);
const filteredOptions = computed(() => {
  const normalizedQuery = searchQuery.value.trim().toLowerCase();
  if (!normalizedQuery) return props.options;

  const metadataMatches = props.options.filter((option) =>
    [option.group, option.description, ...(option.keywords ?? [])].some((text) => text?.toLowerCase() === normalizedQuery),
  );
  if (metadataMatches.length) return metadataMatches;

  return props.options.filter((option) => {
    return [option.label, option.value, option.group, option.description, ...(option.keywords ?? [])].some((text) =>
      text?.toLowerCase().includes(normalizedQuery),
    );
  });
});
const optionGroups = computed(() => {
  const groups: Array<{ label?: string; options: Array<{ option: (typeof props.options)[number]; index: number }> }> = [];
  filteredOptions.value.forEach((option, index) => {
    let group = groups.at(-1);
    if (!group || group.label !== option.group) {
      group = { label: option.group, options: [] };
      groups.push(group);
    }
    group.options.push({ option, index });
  });
  return groups;
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
  activeIndex.value = Math.max(
    0,
    props.options.findIndex((option) => option.value === props.modelValue),
  );
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
  <div
    ref="root"
    class="form-select"
    :class="{ 'form-select--open': isOpen, 'form-select--above': opensAbove, 'form-control--label-hidden': hideLabel }"
    :style="{ '--select-min-width': minimumWidth }"
  >
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
      <span class="form-select__selection"
        ><span v-if="selectedOption.leadingText" class="form-select__leading" aria-hidden="true">{{ selectedOption.leadingText }}</span
        ><span class="form-select__selection-label"
          >{{ selectedOption.label }}<template v-if="selectedOption.description"> · {{ selectedOption.description }}</template></span
        ></span
      >
      <span class="form-select__chevron" aria-hidden="true" />
    </button>
    <div v-if="isOpen" class="form-select__menu" role="listbox">
      <div v-if="searchQuery" class="form-select__search-hint">{{ searchQuery }}</div>
      <div
        v-for="(group, groupIndex) in optionGroups"
        :key="groupIndex"
        :role="group.label ? 'group' : undefined"
        :aria-label="group.label"
        class="form-select__group"
      >
        <div v-if="group.label" class="form-select__group-label" aria-hidden="true">{{ group.label }}</div>
        <button
          v-for="{ option, index } in group.options"
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
          <span v-if="option.leadingText" class="form-select__leading" aria-hidden="true">{{ option.leadingText }}</span>
          <span class="form-select__option-content"
            ><span>{{ option.label }}</span
            ><span v-if="option.description" class="form-select__description">{{ option.description }}</span></span
          >
        </button>
      </div>
      <div v-if="!filteredOptions.length" class="form-select__empty">No matching options</div>
    </div>
  </div>
</template>
