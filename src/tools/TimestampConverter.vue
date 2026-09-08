<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import AppButton from '@/components/AppButton.vue';
import AppCopyButton from '@/components/AppCopyButton.vue';
import DataList from '@/components/DataList.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppTextInput from '@/components/forms/AppTextInput.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import ToolbarStatusBadge from '@/components/ToolbarStatusBadge.vue';
import { usePersistedToolState } from '@/toolState';
import {
  createDateFromParts,
  formatIcalendarDateTime,
  getDateParts,
  getParseFormatLabel,
  getTimestampOutputs,
  parseTimestamp,
  type DateParts,
  type TimestampDisplayZone,
  type TimestampParseFormat,
} from './timestampConverter';

const now = new Date();
const initialParts = getDateParts(now, 'local');

const selectedDate = ref(new Date(now));
const displayZone = ref<TimestampDisplayZone>('local');
const parseFormat = ref<TimestampParseFormat>('auto');
const parseInput = ref(Math.floor(now.getTime() / 1000).toString());
const pickerDate = ref<Date | null>(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
const pickerTime = ref({ hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds() });
const pickerMillisecond = ref(now.getMilliseconds().toString());
const year = ref(initialParts.year.toString());
const month = ref(initialParts.month.toString());
const day = ref(initialParts.day.toString());
const hour = ref(initialParts.hour.toString());
const minute = ref(initialParts.minute.toString());
const second = ref(initialParts.second.toString());
const millisecond = ref(initialParts.millisecond.toString());
const activeError = ref('');
let isSyncing = false;

// Only the display preferences persist; the date/time being edited always starts at "now" —
// restoring a stale in-progress date, plus the Date-valued refs above not being JSON-safe,
// made restoring the full builder/picker state more trouble than it's worth here.
usePersistedToolState('timestamp-converter', { displayZone, parseFormat });

const zoneOptions: Array<{ label: string; value: TimestampDisplayZone }> = [
  { label: 'Local', value: 'local' },
  { label: 'UTC', value: 'utc' },
];
const parseFormatOptions: Array<{ label: string; value: TimestampParseFormat }> = [
  { label: 'Auto', value: 'auto' },
  { label: 'Unix seconds', value: 'unix-seconds' },
  { label: 'Unix milliseconds', value: 'unix-milliseconds' },
  { label: 'ISO 8601', value: 'iso-8601' },
  { label: 'RFC 5545 (iCalendar)', value: 'rfc-5545' },
];
const datePickerTextInput = {
  format: 'yyyy-MM-dd',
  selectOnFocus: true,
  openMenu: 'open',
};
const uses24HourTime = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12 === false;
const timePickerTextInput = {
  format: uses24HourTime ? 'HH:mm:ss' : 'hh:mm:ss aa',
  selectOnFocus: true,
  openMenu: 'open',
};
const datePickerTimeConfig = { enableTimePicker: false };
const timePickerConfig = { enableSeconds: true, is24: uses24HourTime };
const monthOptions = [
  { label: 'January', value: '1' },
  { label: 'February', value: '2' },
  { label: 'March', value: '3' },
  { label: 'April', value: '4' },
  { label: 'May', value: '5' },
  { label: 'June', value: '6' },
  { label: 'July', value: '7' },
  { label: 'August', value: '8' },
  { label: 'September', value: '9' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];

const dateParts = computed<DateParts>(() => ({
  year: Number(year.value),
  month: Number(month.value),
  day: Number(day.value),
  hour: Number(hour.value),
  minute: Number(minute.value),
  second: Number(second.value),
  millisecond: Number(millisecond.value),
}));
const builtDate = computed(() => createDateFromParts(dateParts.value, displayZone.value));
const pickerDateValue = computed(() => {
  if (!pickerDate.value) return null;

  const pickedParts = getDateParts(pickerDate.value, 'local');
  return createDateFromParts(
    {
      year: pickedParts.year,
      month: pickedParts.month,
      day: pickedParts.day,
      hour: Number(pickerTime.value.hours),
      minute: Number(pickerTime.value.minutes),
      second: Number(pickerTime.value.seconds ?? 0),
      millisecond: Number(pickerMillisecond.value),
    },
    displayZone.value,
  );
});
const parsed = computed(() => parseTimestamp(parseInput.value, parseFormat.value));
const builderError = computed(() => validateDateParts(dateParts.value, builtDate.value, displayZone.value));
const pickerError = computed(() => {
    const hours = Number(pickerTime.value.hours);
    const minutes = Number(pickerTime.value.minutes);
    const seconds = Number(pickerTime.value.seconds ?? 0);
    const milliseconds = Number(pickerMillisecond.value);

    if (!pickerDate.value) return 'Choose a date.';
    if (![hours, minutes, seconds, milliseconds].every(Number.isFinite)) return 'Enter a valid time.';
    if (hours < 0 || hours > 23) return 'Hour must be between 0 and 23.';
    if (minutes < 0 || minutes > 59) return 'Minute must be between 0 and 59.';
    if (seconds < 0 || seconds > 59) return 'Second must be between 0 and 59.';
    if (milliseconds < 0 || milliseconds > 999) return 'Millisecond must be between 0 and 999.';
    if (!pickerDateValue.value || Number.isNaN(pickerDateValue.value.getTime())) return 'Choose a valid date and time.';

    return '';
});
const error = computed(() => activeError.value);
const outputs = computed(() => {
  if (!selectedDate.value) return [];

  const values = getTimestampOutputs(selectedDate.value, displayZone.value);
  if (!error.value) return values;

  return values.map((item) => ({ ...item, value: '' }));
});
const detectedLabel = computed(() => (parsed.value.detectedFormat !== 'auto' && !parsed.value.error ? getParseFormatLabel(parsed.value.detectedFormat) : ''));
const parseAllowedCharacters = computed(() => {
  if (parseFormat.value === 'unix-seconds' || parseFormat.value === 'unix-milliseconds') return /^[-\d]$/;
  if (parseFormat.value === 'rfc-5545') return /^[\dTZ]$/;

  return /^[\dTtZz:\-+. ]$/;
});
const parseInputMode = computed(() => (parseFormat.value === 'unix-seconds' || parseFormat.value === 'unix-milliseconds' ? 'numeric' : 'text'));

watch(displayZone, (zone) => {
  syncInputsFromDate(selectedDate.value, zone);
  activeError.value = '';
});

watch(parseFormat, () => {
  syncInputsFromDate(selectedDate.value, displayZone.value);
  activeError.value = '';
});

watch(pickerDate, (date) => {
  if (!date) return;

  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (date.getTime() !== normalized.getTime()) pickerDate.value = normalized;
});

watch([year, month, day, hour, minute, second, millisecond], () => {
  if (isSyncing) return;
  activeError.value = builderError.value;
  if (builderError.value) return;
  setSelectedDate(builtDate.value, 'builder');
});

watch([pickerDate, pickerTime, pickerMillisecond], () => {
  if (isSyncing) return;
  activeError.value = pickerError.value;
  if (pickerError.value || !pickerDateValue.value) return;
  setSelectedDate(pickerDateValue.value, 'picker');
});

watch([parseInput, parseFormat], () => {
  if (isSyncing) return;
  activeError.value = parsed.value.error;
  if (parsed.value.error || !parsed.value.date) return;
  setSelectedDate(parsed.value.date, 'parse');
});

function setToNow(): void {
  setSelectedDate(new Date());
}

function setBuilderParts(parts: DateParts): void {
  year.value = parts.year.toString();
  month.value = parts.month.toString();
  day.value = parts.day.toString();
  hour.value = parts.hour.toString();
  minute.value = parts.minute.toString();
  second.value = parts.second.toString();
  millisecond.value = parts.millisecond.toString();
}

function setSelectedDate(date: Date, source?: 'builder' | 'picker' | 'parse'): void {
  selectedDate.value = date;
  activeError.value = '';
  syncInputsFromDate(date, displayZone.value, source);
}

function syncInputsFromDate(date: Date, zone: TimestampDisplayZone, source?: 'builder' | 'picker' | 'parse'): void {
  isSyncing = true;
  const parts = getDateParts(date, zone);

  if (source !== 'builder') setBuilderParts(parts);
  if (source !== 'picker') {
    pickerDate.value = new Date(parts.year, parts.month - 1, parts.day);
    pickerTime.value = { hours: parts.hour, minutes: parts.minute, seconds: parts.second };
    pickerMillisecond.value = parts.millisecond.toString();
  }
  if (source !== 'parse') parseInput.value = formatParseInput(date);

  window.setTimeout(() => {
    isSyncing = false;
  });
}

function validateDateParts(parts: DateParts, date: Date, zone: TimestampDisplayZone): string {
  if (Object.values(parts).some((value) => !Number.isFinite(value))) return 'Enter valid numeric date parts.';
  if (parts.month < 1 || parts.month > 12) return 'Month must be between 1 and 12.';
  if (parts.day < 1 || parts.day > 31) return 'Day must be between 1 and 31.';
  if (parts.hour < 0 || parts.hour > 23) return 'Hour must be between 0 and 23.';
  if (parts.minute < 0 || parts.minute > 59) return 'Minute must be between 0 and 59.';
  if (parts.second < 0 || parts.second > 59) return 'Second must be between 0 and 59.';
  if (parts.millisecond < 0 || parts.millisecond > 999) return 'Millisecond must be between 0 and 999.';
  if (Number.isNaN(date.getTime())) return 'Enter a valid date.';

  const normalized = getDateParts(date, zone);
  if (normalized.year !== parts.year || normalized.month !== parts.month || normalized.day !== parts.day) return 'Enter a valid calendar date.';

  return '';
}

function formatParseInput(date: Date): string {
  if (parseFormat.value === 'unix-milliseconds') return date.getTime().toString();
  if (parseFormat.value === 'iso-8601') return date.toISOString();
  if (parseFormat.value === 'rfc-5545') return formatIcalendarDateTime(date, displayZone.value);

  return Math.floor(date.getTime() / 1000).toString();
}

function transformParseInput(value: string): string {
  return [...value].filter((character) => parseAllowedCharacters.value.test(character)).join('');
}

function formatPickerDate(date: Date): string {
  return [date.getFullYear(), padDatePart(date.getMonth() + 1), padDatePart(date.getDate())].join('-');
}

function formatPickerTime(time: { hours: number | string; minutes: number | string; seconds?: number | string }): string {
  const hours = Number(time.hours);
  const minutes = padDatePart(Number(time.minutes));
  const seconds = padDatePart(Number(time.seconds ?? 0));

  if (uses24HourTime) return `${padDatePart(hours)}:${minutes}:${seconds}`;

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes}:${seconds} ${period}`;
}

function padDatePart(value: number): string {
  return value.toString().padStart(2, '0');
}
</script>

<template>
  <section class="timestamp-tool">
    <ToolToolbar class="timestamp-tool__toolbar">
      <AppSelect v-model="displayZone" label="Display time zone" :options="zoneOptions" />
      <AppButton variant="field" icon="clock" @click="setToNow">Now</AppButton>
      <template #badge>
        <ToolbarStatusBadge v-if="error" variant="error" :label="error" />
        <ToolbarStatusBadge v-else :label="detectedLabel || 'Ready'" />
      </template>
    </ToolToolbar>

    <div class="timestamp-tool__workspace">
      <section class="timestamp-tool__input-panel">
        <section class="timestamp-input-section timestamp-parse-list">
          <h4>Parse Timestamp</h4>
          <div class="timestamp-parse-row">
            <AppTextInput
              v-model="parseInput"
              label="Timestamp"
              placeholder="Unix seconds, milliseconds, or ISO 8601"
              description="Auto detects Unix seconds, Unix milliseconds, ISO 8601, and RFC 5545 (iCalendar). Choose a specific input format when needed."
              :allowed-characters="parseAllowedCharacters"
              :input-mode="parseInputMode"
              :transform-input="transformParseInput"
            />
            <AppSelect v-model="parseFormat" label="Input format" :options="parseFormatOptions" />
          </div>
        </section>

        <section class="timestamp-input-section timestamp-picker-list">
          <h4>Date Picker</h4>
          <div class="timestamp-picker-row">
            <label class="timestamp-picker-field">
              <span>Date</span>
              <VueDatePicker
                v-model="pickerDate"
                auto-apply
                :text-input="datePickerTextInput"
                :format="formatPickerDate"
                :time-config="datePickerTimeConfig"
                :dark="true"
                :clearable="false"
                :teleport="false"
                :input-attrs="{ autocomplete: 'off', clearable: false }"
                placeholder="Select or type a date"
              />
            </label>
            <label class="timestamp-picker-field">
              <span>Time</span>
              <VueDatePicker
                v-model="pickerTime"
                auto-apply
                :text-input="timePickerTextInput"
                time-picker
                :time-config="timePickerConfig"
                :format="formatPickerTime"
                :dark="true"
                :clearable="false"
                :teleport="false"
                :input-attrs="{ autocomplete: 'off', clearable: false }"
                placeholder="Select or type a time"
              />
            </label>
            <AppTextInput v-model="pickerMillisecond" label="Millisecond" type="number" :min="0" :max="999" :step="1" />
          </div>
        </section>

        <section class="timestamp-input-section timestamp-builder">
          <h4>Date Builder</h4>
          <div class="timestamp-builder__group">
            <h4>Date</h4>
            <div class="timestamp-builder__row timestamp-builder__row--date">
              <AppTextInput v-model="year" label="Year" type="number" :step="1" />
              <AppSelect v-model="month" label="Month" :options="monthOptions" />
              <AppTextInput v-model="day" label="Day" type="number" :min="1" :max="31" :step="1" />
            </div>
          </div>

          <div class="timestamp-builder__group">
            <h4>Time</h4>
            <div class="timestamp-builder__row timestamp-builder__row--time">
              <AppTextInput v-model="hour" label="Hour (24)" type="number" :min="0" :max="23" :step="1" />
              <AppTextInput v-model="minute" label="Minute" type="number" :min="0" :max="59" :step="1" />
              <AppTextInput v-model="second" label="Second" type="number" :min="0" :max="59" :step="1" />
              <AppTextInput v-model="millisecond" label="Millisecond" type="number" :min="0" :max="999" :step="1" />
            </div>
          </div>
        </section>
      </section>

      <section class="timestamp-tool__output-panel">
        <DataList scrollable class="timestamp-output-list">
          <article v-for="item in outputs" :key="item.label" class="data-list__row timestamp-output-row">
            <div>
              <span>{{ item.label }}</span>
              <code>{{ item.value }}</code>
            </div>
            <AppCopyButton :value="item.value" :disabled="!item.value" />
          </article>
        </DataList>
      </section>
    </div>
  </section>
</template>
