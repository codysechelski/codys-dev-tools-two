<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import AppButton from '@/components/AppButton.vue';
import AppModal from '@/components/AppModal.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppTextInput from '@/components/forms/AppTextInput.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import { isToolStateReady, usePersistedToolState } from '@/toolState';
import { zoneCountry } from './timeZoneCountries';
import {
  businessHoursStatus,
  canonicalZone,
  composeZones,
  formatClock,
  getZoneOptions,
  parseTime,
  prefers24Hour,
  resolveWallTime,
  relativeZoneOffset,
  stepWallTime,
  zonedParts,
  zoneDisplay,
  zoneTimeline,
} from './timeZoneConverter';

const ownZone = canonicalZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
const use24Hour = ref(prefers24Hour());
const localZone = ref(ownZone);
const addedZones = ref<string[]>([]);
const removedZones = ref<string[]>([]);

// Restore preferences before choosing "now"; never restore a stale date/time.
usePersistedToolState('time-zone-converter', { localZone, use24Hour, addedZones, removedZones });
const initial = zonedParts(Date.now(), localZone.value);
const date = ref(initial.date);
const time = ref(formatClock(initial.minutes, use24Hour.value));
// Forever state can finish loading after the tool has already mounted.
watch(isToolStateReady, (ready) => {
  if (ready) now();
});
const showAddZone = ref(false);
const zoneOptions = getZoneOptions(ownZone);
const result = computed(() => resolveWallTime(date.value, time.value, localZone.value));
const zones = computed(() =>
  composeZones(ownZone, addedZones.value).filter(({ zone, current }) => current || !removedZones.value.includes(canonicalZone(zone))),
);
const availableZones = computed(() => zoneOptions.filter(({ value }) => !zones.value.some(({ zone }) => canonicalZone(zone) === value)));
const addZone = ref(availableZones.value[0]?.value ?? 'UTC');
const rows = computed(() =>
  result.value.instant === null
    ? []
    : zones.value.map((zone) => {
        const display = zoneDisplay(result.value.instant!, zone.zone, date.value);
        return {
          ...zone,
          ...display,
          label: zone.current ? zone.zone.split('/').at(-1)!.replaceAll('_', ' ') : zone.label,
          time: formatClock(display.minutes, use24Hour.value),
          country: zoneCountry(canonicalZone(zone.zone)),
          business: businessHoursStatus(display.minutes),
          offset: relativeZoneOffset(result.value.instant!, zone.zone, localZone.value),
          timeline: zoneTimeline(result.value.instant!, zone.zone),
        };
      }),
);

watch(use24Hour, () => {
  const minutes = parseTime(time.value);
  if (minutes !== null) time.value = formatClock(minutes, use24Hour.value);
});

function step(direction: -1 | 1): void {
  const next = stepWallTime(date.value, time.value, direction);
  if (!next) return;
  date.value = next.date;
  time.value = formatClock(parseTime(next.time)!, use24Hour.value);
}

function openAdd(): void {
  addZone.value = availableZones.value[0]?.value ?? 'UTC';
  showAddZone.value = true;
}

function add(): void {
  const zone = availableZones.value.find(({ value }) => value === addZone.value)?.value;
  if (!zone) return;
  removedZones.value = removedZones.value.filter((item) => item !== zone);
  if (!addedZones.value.includes(zone)) addedZones.value = [...addedZones.value, zone];
  showAddZone.value = false;
}

function remove(zone: string): void {
  removedZones.value = [...removedZones.value, canonicalZone(zone)];
  addedZones.value = addedZones.value.filter((item) => canonicalZone(item) !== canonicalZone(zone));
}

function now(): void {
  const parts = zonedParts(Date.now(), localZone.value);
  date.value = parts.date;
  time.value = formatClock(parts.minutes, use24Hour.value);
}
</script>

<template>
  <div class="time-zone-converter">
    <ToolToolbar>
      <div class="timestamp-picker-row time-zone-converter__date">
        <label class="timestamp-picker-field">
          <span>Date</span>
          <VueDatePicker
            v-model="date"
            model-type="yyyy-MM-dd"
            :formats="{ input: 'yyyy-MM-dd' }"
            auto-apply
            :text-input="{ format: 'yyyy-MM-dd', selectOnFocus: true, openMenu: 'open', enterSubmit: true, tabSubmit: true }"
            :time-config="{ enableTimePicker: false }"
            :dark="true"
            :teleport="false"
            :aria-labels="{ input: 'Date' }"
            :input-attrs="{ autocomplete: 'off', clearable: false, hideInputIcon: true }"
            placeholder="YYYY-MM-DD"
          />
        </label>
      </div>
      <AppSelect v-model="localZone" label="Local zone" :options="zoneOptions" />
      <AppToggle v-model="use24Hour" label="24-hour time" />
      <AppButton variant="field" @click="now">Now</AppButton>
      <AppButton variant="field" :disabled="!availableZones.length" @click="openAdd">Add time zone</AppButton>
    </ToolToolbar>

    <div class="time-zone-converter__primary">
      <AppButton variant="field" icon-only aria-label="Back 15 minutes" :disabled="!stepWallTime(date, time, -1)" @click="step(-1)">←</AppButton>
      <AppTextInput v-model="time" class="time-zone-converter__time" label="Time" hide-label :placeholder="use24Hour ? 'HH:mm' : 'h:mm AM/PM'" />
      <AppButton variant="field" icon-only aria-label="Forward 15 minutes" :disabled="!stepWallTime(date, time, 1)" @click="step(1)">→</AppButton>
    </div>
    <p class="time-zone-converter__context">{{ localZone.replaceAll('_', ' ') }} · arrows step 15 minutes</p>
    <p v-if="result.error" class="time-zone-converter__error" role="alert">{{ result.error }}</p>
    <p v-else-if="result.ambiguous" role="status">This time occurs twice when clocks move back. Showing the earlier occurrence.</p>

    <div v-if="rows.length" class="time-zone-converter__rows">
      <p class="time-zone-converter__legend">
        Each bar is a day · center line is the selected time · <span class="time-zone-converter__dot time-zone-converter__dot--business" /> 8–5 ·
        <span class="time-zone-converter__dot time-zone-converter__dot--near" /> within one hour ·
        <span class="time-zone-converter__dot time-zone-converter__dot--outside" /> outside business hours
      </p>
      <article v-for="row in rows" :key="row.zone" class="time-zone-converter__row">
        <div class="time-zone-converter__details" :title="`${row.zone} · ${row.abbreviation}${row.current ? ' · Current zone' : ''}`">
          <span class="time-zone-converter__flag" role="img" :aria-label="row.country.name" :title="row.country.name">{{ row.country.flag }}</span>
          <span class="time-zone-converter__name"
            ><strong>{{ row.label }}</strong
            ><span class="time-zone-converter__context">{{ row.abbreviation }}<template v-if="row.current"> · Current zone</template></span></span
          >
        </div>
        <div class="time-zone-converter__timeline" :aria-label="`Day bars for ${row.label}`">
          <div
            v-for="segment in row.timeline.segments"
            :key="segment.position"
            class="time-zone-converter__day"
            :class="{ 'time-zone-converter__day--selected': segment.date === row.date }"
            :style="{ left: `${segment.position * 100}%`, width: `${segment.width * 100}%` }"
            :title="segment.date"
          >
            <span>{{ segment.date.slice(5) }}</span>
          </div>
          <span
            v-for="tick in row.timeline.ticks.filter((_, index) => use24Hour || index % 2 === 0)"
            :key="tick.position"
            class="time-zone-converter__tick"
            :style="{ left: `${tick.position * 100}%` }"
            >{{ formatClock(tick.minutes, use24Hour) }}</span
          >
          <span class="time-zone-converter__selected" aria-hidden="true" />
        </div>
        <div class="time-zone-converter__reading">
          <div class="time-zone-converter__row-time">
            <span
              class="time-zone-converter__dot"
              :class="`time-zone-converter__dot--${row.business.kind}`"
              role="img"
              :aria-label="row.business.label"
              :title="row.business.label"
            />
            <strong>{{ row.time }}</strong>
          </div>
          <span class="time-zone-converter__offset" :title="`Compared with ${localZone}`">{{ row.offset }}</span
          ><span>{{ row.date }} · {{ row.dayLabel }}</span>
        </div>
        <div class="time-zone-converter__remove">
          <AppButton v-if="row.removable" variant="ghost" icon="times" icon-only :aria-label="`Remove ${row.label}`" @click="remove(row.zone)" />
        </div>
      </article>
    </div>
    <AppModal
      :open="showAddZone"
      title="Add time zone"
      icon="clock"
      subtitle="Choose a region to compare alongside your current zones."
      @close="showAddZone = false"
    >
      <div class="time-zone-converter__zone-picker">
        <AppSelect v-model="addZone" class="time-zone-converter__zone-select" label="Time zone" :options="availableZones" />
      </div>
      <template #footer
        ><AppButton variant="muted" @click="showAddZone = false">Cancel</AppButton
        ><AppButton :disabled="!availableZones.length" @click="add">Add time zone</AppButton></template
      >
    </AppModal>
  </div>
</template>

<style scoped lang="scss">
.time-zone-converter {
  display: grid;
  gap: var(--space-3);
  min-width: 0;
  container-type: inline-size;
  --zone-muted: color-mix(in srgb, var(--app-text) 65%, transparent);
  --zone-border: color-mix(in srgb, var(--app-text) 18%, transparent);
  &__date {
    grid-template-columns: minmax(0, 1fr);
    width: var(--zone-date-width);
  }
  &__primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    padding-top: var(--space-4);
  }
  &__time {
    display: block;
    width: var(--zone-time-width);
    min-width: 0;
  }
  & &__time :deep(input) {
    font: var(--zone-time-size) var(--zone-font-code);
    text-align: center;
    height: var(--zone-time-height);
    line-height: 1;
    padding: var(--space-2);
  }
  &__context,
  &__legend {
    color: var(--zone-muted);
    font-size: var(--zone-small-text);
  }
  & > .time-zone-converter__context {
    text-align: center;
    margin: 0;
  }
  &__error {
    color: var(--color-danger-500);
  }
  &__rows {
    min-width: 0;
  }
  &__legend {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin: var(--space-2) 0 var(--space-3);
  }
  &__row {
    display: grid;
    grid-template-columns: var(--zone-name-width) minmax(0, 1fr) var(--zone-reading-width) var(--space-8);
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    border-top: var(--border-hairline) solid var(--zone-border);
  }
  &__details {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }
  &__flag {
    display: grid;
    place-items: center;
    flex: none;
    width: var(--space-8);
    height: var(--space-8);
    background: var(--row-hover-background);
    border: var(--border-hairline) solid var(--zone-border);
    border-radius: var(--radius-sm);
  }
  &__name {
    display: grid;
    gap: var(--space-1);
    min-width: 0;
  }
  &__name strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--zone-row-text);
  }
  &__dot {
    display: inline-block;
    width: var(--space-2);
    height: var(--space-2);
    border-radius: var(--radius-pill);
    flex: none;
  }
  &__dot--business {
    background: var(--color-success-500);
  }
  &__dot--near {
    background: var(--color-warning-500);
  }
  &__dot--outside {
    background: var(--color-danger-500);
  }
  &__reading {
    display: grid;
    gap: var(--space-1);
    text-align: right;
    min-width: 0;
  }
  &__reading strong {
    font: var(--zone-row-text) var(--zone-font-code);
  }
  &__row-time {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-2);
  }
  &__reading span {
    font-size: var(--zone-small-text);
    color: var(--zone-muted);
  }
  &__timeline {
    position: relative;
    height: var(--zone-timeline-height);
    overflow: hidden;
    border-radius: var(--radius-sm);
  }
  &__day {
    position: absolute;
    inset-block: var(--space-1);
    overflow: hidden;
    border: var(--border-hairline) solid var(--zone-border);
    border-radius: var(--radius-sm);
    background: var(--editor-background);
  }
  &__day--selected {
    background: var(--row-hover-background);
  }
  &__day > span {
    display: block;
    text-align: center;
    padding: var(--space-1);
    white-space: nowrap;
    color: var(--app-text);
    font-size: var(--zone-small-text);
  }
  &__tick {
    position: absolute;
    bottom: var(--space-2);
    transform: translateX(-50%);
    white-space: nowrap;
    font: var(--zone-tick-text) var(--zone-font-code);
    color: var(--zone-muted);
  }
  &__selected {
    position: absolute;
    left: 50%;
    inset-block: 0;
    border-left: var(--border-heavy) solid var(--app-text);
  }
  &__remove {
    display: flex;
    justify-content: center;
  }
  :deep(.form-select) {
    min-width: 0;
    max-width: 100%;
  }
}
.time-zone-converter__zone-select {
  width: 100%;
  min-width: 0;
}
.time-zone-converter__zone-picker {
  min-height: var(--zone-picker-height);
}
@container (max-width: 44rem) {
  .time-zone-converter__row {
    grid-template-columns: minmax(0, 1fr) auto var(--space-8);
    gap: var(--space-2);
  }
  .time-zone-converter__timeline {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
@container (max-width: 30rem) {
  .time-zone-converter__tick:nth-of-type(even) {
    visibility: hidden;
  }
}
</style>
