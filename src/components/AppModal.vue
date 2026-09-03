<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import AppButton from '@/components/AppButton.vue';
import AppIcon from '@/components/AppIcon.vue';
import type { IconName } from '@/icons';

const props = defineProps<{
  open: boolean;
  title: string;
  subtitle?: string;
  icon?: IconName;
}>();

const emit = defineEmits<{
  close: [];
}>();

const titleId = computed(() => `modal-title-${props.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});

function handleKeydown(event: KeyboardEvent): void {
  if (props.open && event.key === 'Escape') emit('close');
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="$emit('close')">
      <section class="modal" role="dialog" aria-modal="true" :aria-labelledby="titleId">
        <header class="modal__header">
          <span v-if="icon" class="modal__icon"><AppIcon :name="icon" /></span>
          <div class="modal__heading">
            <h2 :id="titleId">{{ title }}</h2>
            <p v-if="subtitle">{{ subtitle }}</p>
          </div>
          <AppButton class="modal__close" variant="ghost" icon="times" aria-label="Close modal" @click="$emit('close')" />
        </header>

        <div class="modal__body">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="modal__footer">
          <slot name="footer" />
        </footer>
      </section>
    </div>
  </Teleport>
</template>
