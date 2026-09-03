export type HtmlTransformMode = 'encode' | 'decode';

const safeEntityMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const namedEntityMap: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
  nbsp: '\u00a0',
};

export function transformHtmlEntities(input: string, mode: HtmlTransformMode, encodeAllCharacters: boolean): string {
  if (mode === 'decode') return decodeHtmlEntities(input);

  return encodeHtmlEntities(input, encodeAllCharacters);
}

export function encodeHtmlEntities(input: string, encodeAllCharacters: boolean): string {
  if (encodeAllCharacters) {
    return Array.from(input)
      .map((character) => `&#x${character.codePointAt(0)?.toString(16).toUpperCase()};`)
      .join('');
  }

  return input.replace(/[&<>"']/g, (character) => safeEntityMap[character]);
}

export function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi, (entity, body: string) => {
    const normalizedBody = body.toLowerCase();

    if (normalizedBody.startsWith('#x')) {
      return decodeCodePoint(Number.parseInt(normalizedBody.slice(2), 16), entity);
    }

    if (normalizedBody.startsWith('#')) {
      return decodeCodePoint(Number.parseInt(normalizedBody.slice(1), 10), entity);
    }

    return namedEntityMap[normalizedBody] ?? entity;
  });
}

function decodeCodePoint(codePoint: number, fallback: string): string {
  if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) {
    return fallback;
  }

  return String.fromCodePoint(codePoint);
}
