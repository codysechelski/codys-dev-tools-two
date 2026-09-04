import QRCode from 'qrcode';

export type QrSchema = 'text' | 'url' | 'wifi' | 'vcard' | 'email' | 'sms' | 'phone' | 'calendar';
export type QrOutputFormat = 'png-small' | 'png-medium' | 'png-large' | 'png-extra-large' | 'svg';
export type QrErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrFormValues {
  text: string;
  url: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiEncryption: 'WPA' | 'WEP' | 'nopass';
  wifiHidden: boolean;
  contactName: string;
  contactOrg: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  smsTo: string;
  smsBody: string;
  phoneNumber: string;
  eventTitle: string;
  eventLocation: string;
  eventStart: string;
  eventEnd: string;
  eventAllDay: boolean;
  eventDescription: string;
}

export interface QrRenderOptions {
  format: QrOutputFormat;
  errorCorrectionLevel: QrErrorCorrectionLevel;
  margin: number;
  darkColor: string;
  lightColor: string;
}

export function buildQrPayload(schema: QrSchema, values: QrFormValues): string {
  const validationError = validateQrValues(schema, values);
  if (validationError) return '';

  if (schema === 'url') {
    return values.url.trim();
  }

  if (schema === 'wifi') {
    return `WIFI:T:${values.wifiEncryption};S:${escapeWifiValue(values.wifiSsid)};P:${escapeWifiValue(values.wifiPassword)};H:${values.wifiHidden ? 'true' : 'false'};;`;
  }

  if (schema === 'vcard') {
    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      values.contactName ? `FN:${values.contactName}` : '',
      values.contactOrg ? `ORG:${values.contactOrg}` : '',
      values.contactTitle ? `TITLE:${values.contactTitle}` : '',
      values.contactPhone ? `TEL:${values.contactPhone}` : '',
      values.contactEmail ? `EMAIL:${values.contactEmail}` : '',
      values.contactAddress ? `ADR:;;${values.contactAddress.replaceAll('\n', ' ')};;;;` : '',
      'END:VCARD',
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (schema === 'email') {
    const params = [
      values.emailSubject ? `subject=${encodeURIComponent(values.emailSubject)}` : '',
      values.emailBody ? `body=${encodeURIComponent(values.emailBody)}` : '',
    ].filter(Boolean);
    const query = params.join('&');

    return `mailto:${values.emailTo}${query ? `?${query}` : ''}`;
  }

  if (schema === 'sms') {
    const body = values.smsBody ? `?body=${encodeURIComponent(values.smsBody)}` : '';
    return `sms:${values.smsTo}${body}`;
  }

  if (schema === 'phone') {
    return `tel:${values.phoneNumber}`;
  }

  if (schema === 'calendar') {
    const eventEnd = values.eventAllDay && values.eventEnd ? `${values.eventEnd.slice(0, 8)}T235959` : values.eventEnd;

    return [
      'BEGIN:VEVENT',
      values.eventTitle ? `SUMMARY:${values.eventTitle}` : '',
      values.eventLocation ? `LOCATION:${values.eventLocation}` : '',
      values.eventStart ? `DTSTART:${formatCalendarDate(values.eventStart)}` : '',
      eventEnd ? `DTEND:${formatCalendarDate(eventEnd)}` : '',
      values.eventDescription ? `DESCRIPTION:${values.eventDescription.replaceAll('\n', '\\n')}` : '',
      'END:VEVENT',
    ]
      .filter(Boolean)
      .join('\n');
  }

  return values.text;
}

export function validateQrValues(schema: QrSchema, values: QrFormValues): string {
  if (schema === 'url' && values.url.trim() && !isValidUrl(values.url)) return 'Enter a valid URL.';
  if (schema === 'email' && values.emailTo.trim() && !isValidEmail(values.emailTo)) return 'Enter a valid email address.';
  if (schema === 'sms' && values.smsTo.trim() && !isValidSmsRecipient(values.smsTo)) return 'Enter a valid SMS phone number or short code.';
  if (schema === 'phone' && values.phoneNumber.trim() && !isValidPhone(values.phoneNumber)) return 'Enter a valid phone number.';

  if (schema === 'vcard') {
    if (values.contactPhone.trim() && !isValidPhone(values.contactPhone)) return 'Enter a valid contact phone number.';
    if (values.contactEmail.trim() && !isValidEmail(values.contactEmail)) return 'Enter a valid contact email address.';
  }

  if (schema === 'calendar' && values.eventStart && values.eventEnd && values.eventEnd < values.eventStart) {
    return 'End date/time must not be earlier than the start date/time.';
  }

  return '';
}

export function formatPhoneInput(value: string): string {
  const trimmed = value.trimStart();
  const hasLeadingPlus = trimmed.startsWith('+');
  const digits = value.replace(/\D/g, '').slice(0, 15);
  if (!digits) return hasLeadingPlus ? '+' : '';

  const prefix = hasLeadingPlus ? '+' : '';
  if (digits.length <= 3) return `${prefix}${digits}`;
  if (digits.length <= 6) return `${prefix}${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10) return `${prefix}${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;

  const countryCode = digits.slice(0, digits.length - 10);
  const local = `${digits.slice(-10, -7)}-${digits.slice(-7, -4)}-${digits.slice(-4)}`;
  return `${prefix}${countryCode} ${local}`;
}

export async function renderQrCode(payload: string, options: QrRenderOptions): Promise<string> {
  if (!payload.trim()) return '';

  const qrOptions = {
    errorCorrectionLevel: options.errorCorrectionLevel,
    margin: options.margin,
    color: {
      dark: options.darkColor,
      light: options.lightColor,
    },
  };

  if (options.format === 'svg') {
    return renderQrSvg(payload, options);
  }

  return QRCode.toDataURL(payload, { ...qrOptions, type: 'image/png', width: getPngSize(options.format) });
}

export function getOutputExtension(format: QrOutputFormat): 'png' | 'svg' {
  return format === 'svg' ? 'svg' : 'png';
}

export function createDefaultQrValues(): QrFormValues {
  return {
    text: "Cody's Dev Tools",
    url: 'https://example.com',
    wifiSsid: '',
    wifiPassword: '',
    wifiEncryption: 'WPA',
    wifiHidden: false,
    contactName: '',
    contactOrg: '',
    contactTitle: '',
    contactPhone: '',
    contactEmail: '',
    contactAddress: '',
    emailTo: '',
    emailSubject: '',
    emailBody: '',
    smsTo: '',
    smsBody: '',
    phoneNumber: '',
    eventTitle: '',
    eventLocation: '',
    eventStart: '',
    eventEnd: '',
    eventAllDay: false,
    eventDescription: '',
  };
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (!/^\+?[0-9\s-]+$/.test(trimmed)) return false;
  return digits.length >= 7 && digits.length <= 15;
}

export function isValidSmsRecipient(value: string): boolean {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (!/^\+?[0-9\s-]+$/.test(trimmed)) return false;
  return (digits.length >= 5 && digits.length <= 6) || (digits.length >= 7 && digits.length <= 15);
}

export function isValidUrl(value: string): boolean {
  const trimmed = value.trim();
  if (/\s/.test(trimmed)) return false;
  if (!/^https?:\/\//i.test(trimmed)) return false;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (!url.hostname || url.hostname !== url.hostname.toLowerCase()) return false;
    if (url.username || url.password) return false;
    if (url.hostname.includes('..')) return false;

    return /^(localhost|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}|(?:\d{1,3}\.){3}\d{1,3})$/i.test(url.hostname);
  } catch {
    return false;
  }
}

function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

function formatCalendarDate(value: string): string {
  return value.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function renderQrSvg(payload: string, options: QrRenderOptions): string {
  const qr = QRCode.create(payload, { errorCorrectionLevel: options.errorCorrectionLevel });
  const moduleCount = qr.modules.size;
  const margin = Number.isFinite(options.margin) ? Math.max(0, options.margin) : 0;
  const size = moduleCount + margin * 2;
  const darkModules: string[] = [];

  qr.modules.data.forEach((enabled, index) => {
    if (!enabled) return;

    const x = (index % moduleCount) + margin;
    const y = Math.floor(index / moduleCount) + margin;
    darkModules.push(`M${x} ${y}h1v1h-1z`);
  });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`,
    `<path fill="${escapeSvgAttribute(options.lightColor)}" d="M0 0h${size}v${size}H0z"/>`,
    `<path fill="${escapeSvgAttribute(options.darkColor)}" d="${darkModules.join('')}"/>`,
    '</svg>',
  ].join('');
}

function escapeSvgAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function getPngSize(format: QrOutputFormat): number {
  if (format === 'png-small') return 128;
  if (format === 'png-medium') return 256;
  if (format === 'png-large') return 512;
  if (format === 'png-extra-large') return 1024;
  return 0;
}
