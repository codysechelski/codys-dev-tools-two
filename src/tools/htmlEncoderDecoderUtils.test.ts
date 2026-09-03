import { describe, expect, it } from 'vitest';
import { decodeHtmlEntities, encodeHtmlEntities, transformHtmlEntities } from './htmlEncoderDecoder';

describe('htmlEncoderDecoder utilities', () => {
  it('encodes only HTML-sensitive characters by default', () => {
    expect(encodeHtmlEntities('<p title="Cody & friends">\'Hi\'</p>', false)).toBe(
      '&lt;p title=&quot;Cody &amp; friends&quot;&gt;&#39;Hi&#39;&lt;/p&gt;',
    );
  });

  it('encodes every Unicode character when requested', () => {
    expect(encodeHtmlEntities('A😀', true)).toBe('&#x41;&#x1F600;');
  });

  it('decodes common named and numeric entities', () => {
    expect(decodeHtmlEntities('&lt;p&gt;A&amp;B &#x1F600; &#65;&lt;/p&gt;')).toBe('<p>A&B 😀 A</p>');
  });

  it('uses mode to transform values', () => {
    expect(transformHtmlEntities('&lt;', 'decode', false)).toBe('<');
    expect(transformHtmlEntities('<', 'encode', false)).toBe('&lt;');
  });
});
