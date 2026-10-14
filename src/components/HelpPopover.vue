<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import { computeHelpPopoverPosition, type HelpPopoverPosition } from '@/components/helpPopoverPosition';

defineProps<{
  text: string;
  label?: string;
}>();

const triggerRef = ref<HTMLButtonElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const isVisible = ref(false);
const position = ref<HelpPopoverPosition | null>(null);
let revealFrame = 0;
let isHovered = false;
let isFocused = false;

// The content is promoted to the browser's top layer (Popover API) while open so
// it paints above the sidebar and escapes scroll containers that would clip it.
function show(): void {
  if (isOpen.value) return;
  isOpen.value = true;
  const content = contentRef.value;
  if (content && typeof content.showPopover === 'function' && !content.matches(':popover-open')) {
    content.showPopover();
  }
  updatePosition();
  window.addEventListener('scroll', updatePosition, true);
  window.addEventListener('resize', updatePosition);
  revealFrame = requestAnimationFrame(() => {
    isVisible.value = true;
  });
}

function hide(): void {
  if (!isOpen.value) return;
  cancelAnimationFrame(revealFrame);
  isOpen.value = false;
  isVisible.value = false;
  window.removeEventListener('scroll', updatePosition, true);
  window.removeEventListener('resize', updatePosition);
  const content = contentRef.value;
  if (content && typeof content.hidePopover === 'function' && content.matches(':popover-open')) {
    content.hidePopover();
  }
}

function updatePosition(): void {
  const trigger = triggerRef.value;
  const content = contentRef.value;
  if (!trigger || !content) return;
  const triggerRect = trigger.getBoundingClientRect();
  position.value = computeHelpPopoverPosition(
    triggerRect,
    { width: content.offsetWidth, height: content.offsetHeight },
    { width: window.innerWidth, height: window.innerHeight },
  );
}

function sync(): void {
  if (isHovered || isFocused) show();
  else hide();
}

function handleMouseEnter(): void {
  isHovered = true;
  sync();
}

function handleMouseLeave(): void {
  isHovered = false;
  sync();
}

function handleFocusIn(): void {
  isFocused = true;
  sync();
}

function handleFocusOut(event: FocusEvent): void {
  const root = event.currentTarget as HTMLElement;
  if (root.contains(event.relatedTarget as Node | null)) return;
  isFocused = false;
  sync();
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') hide();
}

onBeforeUnmount(hide);
</script>

<template>
  <span
    class="help-popover"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
    @keydown="handleKeydown"
  >
    <button
      ref="triggerRef"
      class="help-popover__trigger"
      type="button"
      :aria-label="label ?? 'More information'"
    >
      <AppIcon name="questionCircle" />
    </button>
    <span
      ref="contentRef"
      class="help-popover__content"
      :class="{
        'help-popover__content--open': isVisible,
        'help-popover__content--bottom': position?.placement === 'bottom',
      }"
      :style="position ? { top: `${position.top}px`, left: `${position.left}px` } : undefined"
      popover="manual"
      role="tooltip"
    >{{ text }}</span>
  </span>
</template>
