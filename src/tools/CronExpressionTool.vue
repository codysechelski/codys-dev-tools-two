<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AppButton from '@/components/AppButton.vue';
import DataList from '@/components/DataList.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppTextInput from '@/components/forms/AppTextInput.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { buildCronExpression, parseCronExpression } from './cronExpression';

type CronPreset = 'custom' | 'every-minute' | 'hourly' | 'weekdays-9' | 'monthly';

const expression = ref('*/15 9-17 * * mon-fri');
const preset = ref<CronPreset>('custom');
const minute = ref('*/15');
const hour = ref('9-17');
const dayOfMonth = ref('*');
const month = ref('*');
const dayOfWeek = ref('mon-fri');
const copiedExpression = ref(false);
let isSyncingFields = false;
let isApplyingPreset = false;

const parsed = computed(() => parseCronExpression(expression.value));
const nextRuns = computed(() => parsed.value.nextRuns.map((date) => formatRunDate(date)));
const presetOptions: Array<{ label: string; value: CronPreset }> = [
  { label: 'Custom', value: 'custom' },
  { label: 'Every minute', value: 'every-minute' },
  { label: 'Hourly', value: 'hourly' },
  { label: 'Weekdays at 9', value: 'weekdays-9' },
  { label: 'Monthly', value: 'monthly' },
];
const presetExpressions: Record<Exclude<CronPreset, 'custom'>, string> = {
  'every-minute': '* * * * *',
  hourly: '0 * * * *',
  'weekdays-9': '0 9 * * mon-fri',
  monthly: '0 0 1 * *',
};
const dayOfMonthOptions = [
  { label: 'Every day', value: '*' },
  ...Array.from({ length: 31 }, (_, index) => {
    const day = index + 1;
    return { label: getOrdinalDay(day), value: day.toString() };
  }),
];
const monthOptions = [
  { label: 'Every month', value: '*' },
  { label: 'January', value: 'jan' },
  { label: 'February', value: 'feb' },
  { label: 'March', value: 'mar' },
  { label: 'April', value: 'apr' },
  { label: 'May', value: 'may' },
  { label: 'June', value: 'jun' },
  { label: 'July', value: 'jul' },
  { label: 'August', value: 'aug' },
  { label: 'September', value: 'sep' },
  { label: 'October', value: 'oct' },
  { label: 'November', value: 'nov' },
  { label: 'December', value: 'dec' },
];
const dayOfWeekOptions = [
  { label: 'Every day', value: '*' },
  { label: 'Weekdays', value: 'mon-fri' },
  { label: 'Weekends', value: 'sat,sun' },
  { label: 'Sunday', value: 'sun' },
  { label: 'Monday', value: 'mon' },
  { label: 'Tuesday', value: 'tue' },
  { label: 'Wednesday', value: 'wed' },
  { label: 'Thursday', value: 'thu' },
  { label: 'Friday', value: 'fri' },
  { label: 'Saturday', value: 'sat' },
];

watch(expression, (value) => {
  if (isSyncingFields) return;
  if (!isApplyingPreset) preset.value = 'custom';
  const parts = value.trim().replace(/\s+/g, ' ').split(' ');
  if (parts.length !== 5) return;

  [minute.value, hour.value, dayOfMonth.value, month.value, dayOfWeek.value] = parts;
});

watch([minute, hour, dayOfMonth, month, dayOfWeek], () => {
  isSyncingFields = true;
  if (!isApplyingPreset) preset.value = 'custom';
  expression.value = buildCronExpression([minute.value, hour.value, dayOfMonth.value, month.value, dayOfWeek.value]);
  window.setTimeout(() => {
    isSyncingFields = false;
  });
});

watch(preset, (value) => {
  if (value === 'custom') return;
  isApplyingPreset = true;
  expression.value = presetExpressions[value];
  window.setTimeout(() => {
    isApplyingPreset = false;
  });
});

function formatRunDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

async function copyExpression(): Promise<void> {
  if (!parsed.value.expression) return;

  await navigator.clipboard.writeText(parsed.value.expression);
  copiedExpression.value = true;
  window.setTimeout(() => {
    copiedExpression.value = false;
  }, 1200);
}

function getOrdinalDay(day: number): string {
  const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  return `${day}${suffix}`;
}
</script>

<template>
  <section class="cron-tool">
    <ToolToolbar class="cron-tool__toolbar">
      <AppSelect v-model="preset" label="Preset" :options="presetOptions" />
      <template #badge>
        <DataList class="cron-tool__status cron-tool__status-list">
          <ToolbarStatusBadge v-if="parsed.error" class="data-list__row" variant="error" :label="parsed.error" />
          <ToolbarStatusBadge v-else class="data-list__row" label="Valid cron" />
        </DataList>
      </template>
    </ToolToolbar>

    <div class="cron-tool__workspace">
      <section class="cron-tool__builder">
        <AppTextInput v-model="expression" label="Cron expression" placeholder="minute hour day month weekday" :error="parsed.error" />

        <div class="cron-field-grid">
          <AppTextInput v-model="minute" label="Minute" placeholder="0-59, */15" />
          <AppTextInput v-model="hour" label="Hour" placeholder="0-23, 9-17" />
          <AppSelect v-model="dayOfMonth" label="Day of month" :options="dayOfMonthOptions" />
          <AppSelect v-model="month" label="Month" :options="monthOptions" />
          <AppSelect v-model="dayOfWeek" label="Day of week" :options="dayOfWeekOptions" />
        </div>

        <p class="cron-tool__syntax-note">
          Five fields: minute, hour, day of month, month, weekday. Supports <code>*</code>, <code>1,15</code>, <code>9-17</code>, <code>*/10</code>, and month/day names.
        </p>
      </section>

      <section class="cron-tool__results">
        <DataList class="cron-summary-panel">
          <article class="data-list__row cron-summary-panel__copy-row">
            <div>
              <span>Expression</span>
              <code>{{ parsed.expression || 'None' }}</code>
            </div>
            <AppButton variant="muted" icon="copy" :disabled="!parsed.expression" @click="copyExpression">
              {{ copiedExpression ? 'Copied' : 'Copy' }}
            </AppButton>
          </article>
          <article class="data-list__row">
            <span>Summary</span>
            <strong>{{ parsed.summary }}</strong>
          </article>
          <article v-for="field in parsed.fields" :key="field.label" class="data-list__row">
            <span>{{ field.label }}</span>
            <strong>{{ field.description }}</strong>
          </article>
        </DataList>

        <DataList header class="cron-runs-panel">
          <template #header>
            <span>Next Runs</span>
            <span>Local time</span>
          </template>
          <article v-for="run in nextRuns" :key="run" class="data-list__row">
            <code>{{ run }}</code>
          </article>
          <p v-if="!nextRuns.length">No upcoming runs to show.</p>
        </DataList>
      </section>
    </div>
  </section>
</template>
