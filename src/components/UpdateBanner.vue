<script setup lang="ts">
import AppButton from '@/components/AppButton.vue';
import AppIcon from '@/components/AppIcon.vue';

defineProps<{
  version: string;
}>();

const emit = defineEmits<{
  install: [];
  dismiss: [];
}>();
</script>

<template>
  <div class="update-banner" role="status">
    <AppIcon name="syncAlt" class="update-banner__icon" />
    <div class="update-banner__text">
      <strong>Update ready</strong>
      <span>Version {{ version }} has been downloaded.</span>
    </div>
    <div class="update-banner__actions">
      <AppButton variant="primary" size="sm" @click="emit('install')">Restart &amp; Update</AppButton>
      <AppButton variant="ghost" size="sm" icon="times" icon-only aria-label="Dismiss update notification" @click="emit('dismiss')" />
    </div>
  </div>
</template>
