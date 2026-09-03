<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import AppButton from '@/components/AppButton.vue';
import AppIcon from '@/components/AppIcon.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppTextInput from '@/components/forms/AppTextInput.vue';
import AppToggle from '@/components/forms/AppToggle.vue';
import TextEditor from '@/components/TextEditor.vue';
import {
  buildQrPayload,
  createDefaultQrValues,
  formatPhoneInput,
  getOutputExtension,
  isValidEmail,
  isValidPhone,
  isValidSmsRecipient,
  isValidUrl,
  renderQrCode,
  validateQrValues,
  type QrErrorCorrectionLevel,
  type QrOutputFormat,
  type QrSchema,
} from './qrGenerator';

const schema = ref<QrSchema>('text');
const outputFormat = ref<QrOutputFormat>('png-medium');
const errorCorrectionLevel = ref<QrErrorCorrectionLevel>('M');
const margin = ref('2');
const darkColor = ref('#02020a');
const lightColor = ref('#ffffff');
const values = ref(createDefaultQrValues());
const eventStartDate = ref<Date | null>(null);
const eventEndDate = ref<Date | null>(null);
const renderedQr = ref('');
const renderError = ref('');
const preview = ref<HTMLElement | null>(null);
const pngImage = ref<HTMLImageElement | null>(null);
const pngWidth = ref(0);
const pngHeight = ref(0);
const previewInnerWidth = ref(0);
const previewInnerHeight = ref(0);
let previewResizeObserver: ResizeObserver | undefined;
let isUsingResizeFallback = false;

const validationError = computed(() => validateQrValues(schema.value, values.value));
const payload = computed(() => (validationError.value ? '' : buildQrPayload(schema.value, values.value)));
const urlError = computed(() => (schema.value === 'url' && values.value.url.trim() && !isValidUrl(values.value.url) ? 'Enter a valid URL.' : ''));
const emailToError = computed(() => (schema.value === 'email' && values.value.emailTo.trim() && !isValidEmail(values.value.emailTo) ? 'Enter a valid email address.' : ''));
const smsPhoneError = computed(() =>
  schema.value === 'sms' && values.value.smsTo.trim() && !isValidSmsRecipient(values.value.smsTo) ? 'Enter a valid SMS phone number or short code.' : '',
);
const phoneError = computed(() => (schema.value === 'phone' && values.value.phoneNumber.trim() && !isValidPhone(values.value.phoneNumber) ? 'Enter a valid phone number.' : ''));
const contactPhoneError = computed(() =>
  schema.value === 'vcard' && values.value.contactPhone.trim() && !isValidPhone(values.value.contactPhone) ? 'Enter a valid contact phone number.' : '',
);
const contactEmailError = computed(() =>
  schema.value === 'vcard' && values.value.contactEmail.trim() && !isValidEmail(values.value.contactEmail) ? 'Enter a valid contact email address.' : '',
);
const canDownload = computed(() => Boolean(renderedQr.value));
const isPngOutput = computed(() => outputFormat.value !== 'svg');
const pngDimensionsText = computed(() => (pngWidth.value && pngHeight.value ? `${pngWidth.value} x ${pngHeight.value}px` : ''));
const pngPreviewScale = computed(() => {
  if (!pngWidth.value || !pngHeight.value || !previewInnerWidth.value || !previewInnerHeight.value) return 1;

  return Math.min(1, previewInnerWidth.value / pngWidth.value, previewInnerHeight.value / pngHeight.value);
});
const pngZoomPercent = computed(() => {
  return Math.round(pngPreviewScale.value * 100);
});
const isPngScaledDown = computed(() => isPngOutput.value && pngZoomPercent.value < 100);
const pngImageStyle = computed(() => ({
  width: `${Math.floor(pngWidth.value * pngPreviewScale.value)}px`,
  height: `${Math.floor(pngHeight.value * pngPreviewScale.value)}px`,
}));
const copyState = ref<'idle' | 'copied' | 'error'>('idle');
const isSaving = ref(false);

const schemaOptions: Array<{ label: string; value: QrSchema }> = [
  { label: 'Text', value: 'text' },
  { label: 'URL', value: 'url' },
  { label: 'Wi-Fi', value: 'wifi' },
  { label: 'Contact', value: 'vcard' },
  { label: 'Email', value: 'email' },
  { label: 'SMS', value: 'sms' },
  { label: 'Phone', value: 'phone' },
  { label: 'Calendar', value: 'calendar' },
];
const calendarDateTextInput = {
  format: 'MM/dd/yyyy, hh:mm aa',
  selectOnFocus: true,
  openMenu: 'open',
};
const defaultCalendarStartDate = getRoundedCalendarDefault(0);
const defaultCalendarEndDate = getRoundedCalendarDefault(30);
const calendarDateTimeConfig = { enableSeconds: false, is24: false };
const calendarStartTime = getTimeModel(defaultCalendarStartDate);
const calendarEndTime = getTimeModel(defaultCalendarEndDate);
const formatOptions: Array<{ label: string; value: QrOutputFormat }> = [
  { label: 'PNG small', value: 'png-small' },
  { label: 'PNG medium', value: 'png-medium' },
  { label: 'PNG large', value: 'png-large' },
  { label: 'PNG extra large', value: 'png-extra-large' },
  { label: 'SVG', value: 'svg' },
];
const errorCorrectionOptions: Array<{ label: string; value: QrErrorCorrectionLevel }> = [
  { label: 'Low', value: 'L' },
  { label: 'Medium', value: 'M' },
  { label: 'Quartile', value: 'Q' },
  { label: 'High', value: 'H' },
];
const encryptionOptions: Array<{ label: string; value: 'WPA' | 'WEP' | 'nopass' }> = [
  { label: 'WPA/WPA2', value: 'WPA' },
  { label: 'WEP', value: 'WEP' },
  { label: 'No password', value: 'nopass' },
];

watch(
  [payload, outputFormat, errorCorrectionLevel, margin, darkColor, lightColor],
  () => {
    void updateQrCode();
  },
  { immediate: true },
);

watch(eventStartDate, (date) => {
  values.value.eventStart = date ? formatCalendarPickerDate(date) : '';
}, { immediate: true });

watch(eventEndDate, (date) => {
  values.value.eventEnd = date ? formatCalendarPickerDate(date) : '';
}, { immediate: true });

watch(() => values.value.phoneNumber, (value) => {
  const formatted = formatPhoneInput(value);
  if (value !== formatted) values.value.phoneNumber = formatted;
});

watch(() => values.value.smsTo, (value) => {
  const formatted = formatPhoneInput(value);
  if (value !== formatted) values.value.smsTo = formatted;
});

watch(() => values.value.contactPhone, (value) => {
  const formatted = formatPhoneInput(value);
  if (value !== formatted) values.value.contactPhone = formatted;
});

onMounted(() => {
  if (!preview.value) return;

  if (typeof ResizeObserver === 'undefined') {
    isUsingResizeFallback = true;
    updatePreviewSize();
    window.addEventListener('resize', updatePreviewSize);
    return;
  }

  updatePreviewSize();
  previewResizeObserver = new ResizeObserver(updatePreviewSize);
  previewResizeObserver.observe(preview.value);
});

onBeforeUnmount(() => {
  previewResizeObserver?.disconnect();
  if (isUsingResizeFallback) {
    window.removeEventListener('resize', updatePreviewSize);
  }
});

async function updateQrCode(): Promise<void> {
  if (validationError.value) {
    renderedQr.value = '';
    renderError.value = 'Fix invalid fields to generate a QR code.';
    return;
  }

  try {
    renderError.value = '';
    renderedQr.value = await renderQrCode(payload.value, {
      format: outputFormat.value,
      errorCorrectionLevel: errorCorrectionLevel.value,
      margin: Number(margin.value),
      darkColor: darkColor.value,
      lightColor: lightColor.value,
    });
    copyState.value = 'idle';
    await nextTick();
    updatePreviewSize();
  } catch (error) {
    renderedQr.value = '';
    renderError.value = error instanceof Error ? error.message : 'Unable to generate QR code';
  }
}

function formatCalendarPickerDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = '00';

  return `${year}${month}${day}T${hour}${minute}${second}`;
}

function formatCalendarPickerDisplay(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function getRoundedCalendarDefault(addMinutes: number): Date {
  const date = new Date();
  const minutes = date.getMinutes();
  const minutesToAdd = minutes === 0 || minutes === 30 ? 0 : 30 - (minutes % 30);

  date.setMinutes(minutes + minutesToAdd + addMinutes, 0, 0);
  return date;
}

function getTimeModel(date: Date): { hours: number; minutes: number; seconds: number } {
  return {
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: 0,
  };
}

function handlePngLoad(): void {
  if (!pngImage.value) return;

  pngWidth.value = pngImage.value.naturalWidth;
  pngHeight.value = pngImage.value.naturalHeight;
  updatePreviewSize();
}

function updatePreviewSize(): void {
  if (!preview.value) return;

  const styles = window.getComputedStyle(preview.value);
  const horizontalPadding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
  const verticalPadding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);

  previewInnerWidth.value = Math.max(0, preview.value.clientWidth - horizontalPadding);
  previewInnerHeight.value = Math.max(0, preview.value.clientHeight - verticalPadding);
}

async function saveQr(): Promise<void> {
  if (!renderedQr.value) return;

  isSaving.value = true;
  const extension = getOutputExtension(outputFormat.value);

  try {
    const blob = await getRenderedQrBlob();

    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: `qr-code.${extension}`,
        types: [
          {
            description: extension === 'svg' ? 'SVG image' : 'PNG image',
            accept: { [blob.type]: [`.${extension}`] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    }

    const link = document.createElement('a');
    link.download = `qr-code.${extension}`;
    link.href = URL.createObjectURL(blob);
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      throw error;
    }
  } finally {
    isSaving.value = false;
  }
}

async function copyQr(): Promise<void> {
  if (!renderedQr.value) return;

  try {
    const blob = await getRenderedQrBlob();

    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    copyState.value = 'copied';
    window.setTimeout(() => {
      copyState.value = 'idle';
    }, 1400);
  } catch {
    copyState.value = 'error';
    window.setTimeout(() => {
      copyState.value = 'idle';
    }, 1800);
  }
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);

  return response.blob();
}

async function getRenderedQrBlob(): Promise<Blob> {
  const extension = getOutputExtension(outputFormat.value);

  if (extension === 'svg') {
    return new Blob([renderedQr.value], { type: 'image/svg+xml' });
  }

  return dataUrlToBlob(renderedQr.value);
}
</script>

<template>
  <section class="qr-tool">
    <div class="tool-options qr-tool__options">
      <AppSelect v-model="schema" label="Schema" :options="schemaOptions" />
      <AppSelect v-model="outputFormat" label="Output" :options="formatOptions" />
      <AppSelect
        v-model="errorCorrectionLevel"
        label="Error correction"
        description="Higher correction makes codes more resilient but denser. Medium is a good default."
        :options="errorCorrectionOptions"
      />
      <AppTextInput v-model="margin" label="Margin" type="number" :min="0" :max="10" />
      <div class="tool-options__actions">
        <AppButton variant="secondary" icon="copy" :disabled="!canDownload" @click="copyQr">
          {{ copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy' }}
        </AppButton>
        <AppButton variant="primary" :icon="isSaving ? 'spinner' : 'save'" :disabled="!canDownload || isSaving" @click="saveQr">
          {{ isSaving ? 'Saving' : 'Save' }}
        </AppButton>
      </div>
    </div>

    <div class="qr-tool__workspace">
      <section class="qr-tool__form-panel">
        <template v-if="schema === 'text'">
          <AppTextInput v-model="values.text" label="Text" multiline />
        </template>

        <template v-else-if="schema === 'url'">
          <AppTextInput v-model="values.url" label="URL" type="url" input-mode="url" :error="urlError" />
        </template>

        <template v-else-if="schema === 'wifi'">
          <AppTextInput v-model="values.wifiSsid" label="SSID" />
          <AppTextInput v-model="values.wifiPassword" label="Password" />
          <AppSelect v-model="values.wifiEncryption" label="Encryption" :options="encryptionOptions" />
          <AppToggle v-model="values.wifiHidden" label="Hidden network" />
        </template>

        <template v-else-if="schema === 'vcard'">
          <AppTextInput v-model="values.contactName" label="Name" />
          <AppTextInput v-model="values.contactOrg" label="Organization" />
          <AppTextInput v-model="values.contactTitle" label="Title" />
          <AppTextInput
            v-model="values.contactPhone"
            label="Phone"
            type="tel"
            input-mode="tel"
            filter="phone"
            :transform-input="formatPhoneInput"
            :error="contactPhoneError"
          />
          <AppTextInput v-model="values.contactEmail" label="Email" type="email" input-mode="email" :error="contactEmailError" />
          <AppTextInput v-model="values.contactAddress" label="Address" multiline />
        </template>

        <template v-else-if="schema === 'email'">
          <AppTextInput v-model="values.emailTo" label="To" type="email" input-mode="email" :error="emailToError" />
          <AppTextInput v-model="values.emailSubject" label="Subject" />
          <AppTextInput v-model="values.emailBody" label="Body" multiline />
        </template>

        <template v-else-if="schema === 'sms'">
          <AppTextInput
            v-model="values.smsTo"
            label="Phone"
            type="tel"
            input-mode="tel"
            filter="phone"
            :transform-input="formatPhoneInput"
            :error="smsPhoneError"
          />
          <AppTextInput v-model="values.smsBody" label="Message" multiline />
        </template>

        <template v-else-if="schema === 'phone'">
          <AppTextInput
            v-model="values.phoneNumber"
            label="Phone"
            type="tel"
            input-mode="tel"
            filter="phone"
            :transform-input="formatPhoneInput"
            :error="phoneError"
          />
        </template>

        <template v-else-if="schema === 'calendar'">
          <AppTextInput v-model="values.eventTitle" label="Title" />
          <AppTextInput v-model="values.eventLocation" label="Location" />
          <div class="timestamp-picker-row qr-calendar-picker">
            <label class="timestamp-picker-field">
              <span>Start</span>
              <VueDatePicker
                v-model="eventStartDate"
                auto-apply
                :text-input="calendarDateTextInput"
                :format="formatCalendarPickerDisplay"
                :time-config="calendarDateTimeConfig"
                :start-date="defaultCalendarStartDate"
                :start-time="calendarStartTime"
                :dark="true"
                :clearable="false"
                :teleport="false"
                :input-attrs="{ autocomplete: 'off', clearable: false }"
                placeholder="Select or type start date and time"
              >
                <template #input-icon>
                  <AppIcon name="calendar" />
                </template>
              </VueDatePicker>
            </label>
            <label class="timestamp-picker-field">
              <span>End</span>
              <VueDatePicker
                v-model="eventEndDate"
                auto-apply
                :text-input="calendarDateTextInput"
                :format="formatCalendarPickerDisplay"
                :time-config="calendarDateTimeConfig"
                :start-date="defaultCalendarEndDate"
                :start-time="calendarEndTime"
                :dark="true"
                :clearable="false"
                :teleport="false"
                :input-attrs="{ autocomplete: 'off', clearable: false }"
                placeholder="Select or type end date and time"
              >
                <template #input-icon>
                  <AppIcon name="calendar" />
                </template>
              </VueDatePicker>
            </label>
          </div>
          <AppTextInput v-model="values.eventDescription" label="Description" multiline />
        </template>
      </section>

      <section class="qr-tool__preview-panel">
        <div ref="preview" class="qr-preview">
          <div v-if="isPngOutput && renderedQr" class="qr-preview__content">
            <img ref="pngImage" :src="renderedQr" :style="pngImageStyle" alt="Generated QR code" @load="handlePngLoad" />
          </div>
          <div v-else-if="outputFormat === 'svg' && renderedQr" class="qr-preview__content qr-preview__svg" v-html="renderedQr" />
          <p v-else>{{ renderError || 'Enter content to generate a QR code.' }}</p>
          <span v-if="isPngOutput && pngDimensionsText" class="qr-preview__badge qr-preview__badge--dimensions">
            {{ pngDimensionsText }}
          </span>
          <span v-if="isPngScaledDown" class="qr-preview__badge qr-preview__badge--zoom">{{ pngZoomPercent }}% preview</span>
        </div>
        <TextEditor :model-value="payload" label="Encoded Payload" readonly />
      </section>
    </div>
  </section>
</template>
