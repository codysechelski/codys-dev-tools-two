import { describe, expect, it } from 'vitest';
import { buildQrPayload, createDefaultQrValues, formatPhoneInput, getOutputExtension, getPngSize, renderQrCode, validateQrValues } from './qrGenerator';

describe('qrGenerator utilities', () => {
  it('builds Wi-Fi payloads', () => {
    const values = createDefaultQrValues();
    values.wifiSsid = 'Office;Network';
    values.wifiPassword = 'pa:ss';
    values.wifiHidden = true;

    expect(buildQrPayload('wifi', values)).toBe('WIFI:T:WPA;S:Office\\;Network;P:pa\\:ss;H:true;;');
  });

  it('builds vCard payloads', () => {
    const values = createDefaultQrValues();
    values.contactName = 'Cody Sechelski';
    values.contactEmail = 'cody@example.com';

    expect(buildQrPayload('vcard', values)).toContain('BEGIN:VCARD');
    expect(buildQrPayload('vcard', values)).toContain('FN:Cody Sechelski');
    expect(buildQrPayload('vcard', values)).toContain('EMAIL:cody@example.com');
  });

  it('builds common URI payloads', () => {
    const values = createDefaultQrValues();
    values.url = 'https://example.com/docs';
    values.emailTo = 'person@example.com';
    values.emailSubject = 'Hello there';
    values.emailBody = 'Line one and two';
    values.smsTo = '+15555551212';
    values.smsBody = 'Hi there';
    values.phoneNumber = '+15555551212';

    expect(buildQrPayload('url', values)).toBe('https://example.com/docs');
    expect(buildQrPayload('email', values)).toBe('mailto:person@example.com?subject=Hello%20there&body=Line%20one%20and%20two');
    expect(buildQrPayload('sms', values)).toBe('sms:+15555551212?body=Hi%20there');
    expect(buildQrPayload('phone', values)).toBe('tel:+15555551212');
  });

  it('builds calendar payloads with minute precision', () => {
    const values = createDefaultQrValues();
    values.eventTitle = 'Demo';
    values.eventStart = '20260831T133000';
    values.eventEnd = '20260831T140000';

    const payload = buildQrPayload('calendar', values);

    expect(payload).toContain('SUMMARY:Demo');
    expect(payload).toContain('DTSTART:20260831T133000');
    expect(payload).toContain('DTEND:20260831T140000');
  });

  it('extends all-day calendar payloads to cover the full start and end days', () => {
    const values = createDefaultQrValues();
    values.eventTitle = 'Conference';
    values.eventAllDay = true;
    values.eventStart = '20260901T000000';
    values.eventEnd = '20260903T000000';

    const payload = buildQrPayload('calendar', values);

    expect(payload).toContain('DTSTART:20260901T000000');
    expect(payload).toContain('DTEND:20260903T235959');
  });

  it('validates that a calendar end date/time is not earlier than the start', () => {
    const values = createDefaultQrValues();
    values.eventStart = '20260901T133000';
    values.eventEnd = '20260901T120000';

    expect(validateQrValues('calendar', values)).toBe('End date/time must not be earlier than the start date/time.');

    values.eventEnd = '20260901T140000';
    expect(validateQrValues('calendar', values)).toBe('');
  });

  it('validates URL, email, and phone fields', () => {
    const values = createDefaultQrValues();

    values.url = 'not a url';
    expect(validateQrValues('url', values)).toBe('Enter a valid URL.');

    values.url = 'https://example.com';
    values.emailTo = 'not-email';
    expect(validateQrValues('email', values)).toBe('Enter a valid email address.');

    values.emailTo = 'person@example.com';
    values.smsTo = '1234';
    expect(validateQrValues('sms', values)).toBe('Enter a valid SMS phone number or short code.');

    values.smsTo = '12345';
    expect(validateQrValues('sms', values)).toBe('');

    values.phoneNumber = 'abc';
    expect(validateQrValues('phone', values)).toBe('Enter a valid phone number.');

    values.phoneNumber = '555-FLOWERS';
    expect(validateQrValues('phone', values)).toBe('Enter a valid phone number.');

    values.phoneNumber = '+15555551212';
    values.contactPhone = '+15555551212';
    values.contactEmail = 'bad';
    expect(validateQrValues('vcard', values)).toBe('Enter a valid contact email address.');
  });

  it('formats phone input while rejecting letters', () => {
    expect(formatPhoneInput('555abc5551212')).toBe('555-555-1212');
    expect(formatPhoneInput('+15555551212')).toBe('+1 555-555-1212');
    expect(formatPhoneInput('123456')).toBe('123-456');
  });

  it('rejects malformed URLs that URL parsing can normalize', () => {
    const values = createDefaultQrValues();
    values.url = 'https:/     ////exampdgdgle.comfsdfsdf4543@@';

    expect(validateQrValues('url', values)).toBe('Enter a valid URL.');
  });

  it('maps output formats to file extensions', () => {
    expect(getOutputExtension('png-small')).toBe('png');
    expect(getOutputExtension('png-medium')).toBe('png');
    expect(getOutputExtension('png-large')).toBe('png');
    expect(getOutputExtension('png-extra-large')).toBe('png');
    expect(getOutputExtension('svg')).toBe('svg');
  });

  it('maps PNG formats to fixed pixel sizes', () => {
    expect(getPngSize('png-small')).toBe(128);
    expect(getPngSize('png-medium')).toBe(256);
    expect(getPngSize('png-large')).toBe(512);
    expect(getPngSize('png-extra-large')).toBe(1024);
    expect(getPngSize('svg')).toBe(0);
  });

  it('renders SVG QR output', async () => {
    const output = await renderQrCode('hello', {
      format: 'svg',
      errorCorrectionLevel: 'M',
      margin: 2,
      darkColor: '#000000',
      lightColor: '#ffffff',
    });

    expect(output).toContain('<svg');
  });

  it('renders SVG QR modules as filled shapes instead of strokes', async () => {
    const output = await renderQrCode('hello', {
      format: 'svg',
      errorCorrectionLevel: 'M',
      margin: 2,
      darkColor: '#000000',
      lightColor: '#ffffff',
    });

    expect(output).toContain('fill="#000000"');
    expect(output).not.toContain('stroke=');
  });
});
