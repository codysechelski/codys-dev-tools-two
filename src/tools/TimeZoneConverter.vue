<script setup lang="ts">
import { computed, ref } from 'vue';
import AppButton from '@/components/AppButton.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppTextInput from '@/components/forms/AppTextInput.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import {
  canonicalZone,
  composeZones,
  formatTime,
  getZoneOptions,
  resolveWallTime,
  stepWallTime,
  zonedParts,
  zoneDisplay,
  zoneTimeline,
} from './timeZoneConverter';

const ownZone = canonicalZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
const initial = zonedParts(Date.now(), ownZone);
const date = ref(initial.date);
const time = ref(formatTime(initial.minutes));
const localZone = ref(ownZone);
const addedZones = ref<string[]>([]);
const zoneOptions = getZoneOptions(ownZone);
const addZone = ref(zoneOptions.find(({ value }) => !composeZones(ownZone).some(({ zone }) => canonicalZone(zone) === value))?.value ?? 'UTC');
const result = computed(() => resolveWallTime(date.value, time.value, localZone.value));
const zones = computed(() => composeZones(ownZone, addedZones.value));
const availableZones = computed(() => zoneOptions.filter(({ value }) => !zones.value.some(({ zone }) => canonicalZone(zone) === value)));
const rows = computed(() =>
  result.value.instant === null
    ? []
    : zones.value.map((zone) => ({
        ...zone,
        ...zoneDisplay(result.value.instant!, zone.zone, date.value),
        timeline: zoneTimeline(result.value.instant!, zone.zone),
      })),
);

function step(direction: -1 | 1): void {
  const next = stepWallTime(date.value, time.value, direction);
  if (!next) return;
  date.value = next.date;
  time.value = next.time;
}

function add(): void {
  const zone = availableZones.value.find(({ value }) => value === addZone.value)?.value ?? availableZones.value[0]?.value;
  if (!zone) return;
  addedZones.value = [...addedZones.value, zone];
  addZone.value = availableZones.value[0]?.value ?? 'UTC';
}

function now(): void {
  const parts = zonedParts(Date.now(), localZone.value);
  date.value = parts.date;
  time.value = formatTime(parts.minutes);
}
</script>

<template>
  <div class="time-zone-converter">
    <ToolToolbar>
      <AppTextInput v-model="date" label="Date" placeholder="YYYY-MM-DD" />
      <AppSelect v-model="localZone" label="Local zone" :options="zoneOptions" />
      <AppButton variant="field" @click="now">Now</AppButton>
    </ToolToolbar>

    <div class="time-zone-converter__primary">
      <AppButton variant="field" icon-only aria-label="Back 15 minutes" :disabled="!stepWallTime(date, time, -1)" @click="step(-1)">←</AppButton>
      <AppTextInput v-model="time" class="time-zone-converter__time" label="Time" placeholder="HH:mm" :error="result.error" />
      <AppButton variant="field" icon-only aria-label="Forward 15 minutes" :disabled="!stepWallTime(date, time, 1)" @click="step(1)">→</AppButton>
    </div>
    <p class="time-zone-converter__context">{{ localZone.replaceAll('_', ' ') }} · 24-hour time or h:mm AM/PM · arrows step 15 minutes</p>
    <p v-if="result.error" class="time-zone-converter__error" role="alert">{{ result.error }}</p>
    <p v-else-if="result.ambiguous" role="status">This time occurs twice when clocks move back. Showing the earlier occurrence.</p>

    <div v-if="rows.length" class="time-zone-converter__rows">
      <p class="time-zone-converter__legend">24-hour window · center line is the selected time · vertical date labels mark midnight</p>
      <article v-for="row in rows" :key="row.zone" class="time-zone-converter__row">
        <div class="time-zone-converter__details">
          <div>
            <strong>{{ row.label }}</strong
            ><span v-if="row.current" class="time-zone-converter__current">Current zone</span>
          </div>
          <span class="time-zone-converter__context">{{ row.zone }} · {{ row.abbreviation }}</span>
        </div>
        <div class="time-zone-converter__reading">
          <strong>{{ row.time }}</strong>
          <span>{{ row.date }} · {{ row.dayLabel }}</span>
        </div>
        <AppButton
          v-if="row.removable"
          variant="ghost"
          icon="times"
          icon-only
          :aria-label="`Remove ${row.label}`"
          @click="addedZones = addedZones.filter((zone) => zone !== row.zone)"
        />
        <div class="time-zone-converter__timeline" :aria-label="`24-hour timeline for ${row.label}`">
          <span v-for="tick in row.timeline.ticks" :key="tick.position" class="time-zone-converter__tick" :style="{ left: `${tick.position * 100}%` }">{{
            tick.time
          }}</span>
          <span
            v-for="boundary in row.timeline.boundaries"
            :key="boundary.position"
            class="time-zone-converter__boundary"
            :style="{ left: `${boundary.position * 100}%` }"
            ><span>{{ boundary.date.slice(5) }}</span></span
          >
          <span class="time-zone-converter__selected" aria-hidden="true" />
        </div>
      </article>
    </div>
    <div class="time-zone-converter__add">
      <AppSelect v-if="availableZones.length" v-model="addZone" label="Add time zone" :options="availableZones" />
      <AppButton variant="field" :disabled="!availableZones.length" aria-label="Add selected time zone" @click="add">+ Add zone</AppButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.time-zone-converter {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
  --zone-muted: color-mix(in srgb, var(--app-text) 65%, transparent);
  --zone-border: color-mix(in srgb, var(--app-text) 18%, transparent);
  &__primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    padding-top: var(--space-6);
  }
  &__time {
    width: var(--zone-time-width);
  }
  & &__time :deep(input) {
    font: var(--zone-time-size) var(--zone-font-code);
    text-align: center;
    height: var(--zone-time-height);
    padding: var(--space-3);
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
    margin: 0 0 var(--space-3);
  }
  &__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: var(--space-2) var(--space-3);
    padding: var(--space-4) 0;
    border-top: var(--border-hairline) solid var(--zone-border);
  }
  &__details {
    display: grid;
    gap: var(--space-1);
    overflow-wrap: anywhere;
  }
  &__details > div {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  &__current {
    color: var(--app-text);
    background: var(--row-hover-background);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-pill);
    font-size: var(--zone-small-text);
  }
  &__reading {
    display: grid;
    gap: var(--space-1);
    text-align: right;
  }
  &__reading strong {
    font-family: var(--zone-font-code);
    font-size: var(--space-6);
  }
  &__reading span {
    font-size: var(--zone-small-text);
  }
  &__timeline {
    grid-column: 1 / -1;
    position: relative;
    height: var(--zone-timeline-height);
    margin-top: var(--space-2);
    background: var(--editor-background);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }
  &__tick {
    position: absolute;
    top: var(--space-2);
    transform: translateX(-50%);
    font: var(--zone-small-text) var(--zone-font-code);
    color: var(--zone-muted);
  }
  &__boundary {
    position: absolute;
    inset-block: 0;
    border-left: var(--border-hairline) solid var(--zone-muted);
  }
  &__boundary span {
    position: absolute;
    bottom: var(--space-1);
    left: var(--space-1);
    white-space: nowrap;
    font: var(--zone-small-text) var(--zone-font-code);
    color: var(--app-text);
  }
  &__boundary:nth-last-child(2) span {
    transform: translateX(-50%);
  }
  &__selected {
    position: absolute;
    left: 50%;
    inset-block: 0;
    border-left: var(--border-heavy) solid var(--app-text);
  }
  &__add {
    display: flex;
    align-items: end;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
  :deep(.form-select) {
    min-width: 0;
    max-width: 100%;
  }
}
</style>
