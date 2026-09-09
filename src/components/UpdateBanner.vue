<script setup lang="ts">
import AppButton from '@/components/AppButton.vue';
import AppIcon from '@/components/AppIcon.vue';

defineProps<{
  notice: UpdateNotice;
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
      <strong>{{ notice.action === 'install' ? 'Update ready' : 'Update available' }}</strong>
      <span v-if="notice.action === 'install'">Version {{ notice.version }} has been downloaded.</span>
      <span v-else>Version {{ notice.version }} is available — download it and reinstall to update.</span>
    </div>
    <div class="update-banner__actions">
      <AppButton v-if="notice.action === 'install'" variant="primary" size="sm" @click="emit('install')">Restart &amp; Update</AppButton>
      <a v-else class="app-button app-button--primary app-button--size-sm" :href="notice.releasesUrl" target="_blank" rel="noopener noreferrer">
        View Release
      </a>
      <AppButton variant="ghost" size="sm" icon="times" icon-only aria-label="Dismiss update notification" @click="emit('dismiss')" />
    </div>
  </div>
</template>
