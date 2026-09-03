import { describe, expect, it } from 'vitest';
import { formatCodePoint, getCharactersForBlock, getUnicodeCharacterInfo, searchUnicodeCharacters, unicodeBlocks } from './unicodeCharacterMap';

describe('unicodeCharacterMap utilities', () => {
  it('formats code points with Unicode notation', () => {
    expect(formatCodePoint(0x41)).toBe('U+0041');
    expect(formatCodePoint(0x1f600)).toBe('U+1F600');
  });

  it('builds copyable character attributes', () => {
    const character = getUnicodeCharacterInfo(0x41);

    expect(character.character).toBe('A');
    expect(character.name).toBe('LATIN CAPITAL LETTER A');
    expect(character.htmlCode).toBe('&#x41;');
    expect(character.cssCode).toBe('\\41 ');
    expect(character.binary).toBe('0b1000001');
    expect(character.decimal).toBe('65');
    expect(character.octal).toBe('0o101');
    expect(character.hexadecimal).toBe('0x41');
  });

  it('returns characters for a block', () => {
    const characters = getCharactersForBlock('basic-latin');

    expect(characters[0]?.code).toBe('U+0000');
    expect(characters.some((character) => character.character === 'A')).toBe(true);
  });

  it('includes the full Unicode block list', () => {
    expect(unicodeBlocks.length).toBeGreaterThan(300);
    expect(unicodeBlocks.some((block) => block.value === 'cjk-unified-ideographs-extension-j')).toBe(true);
  });

  it('searches all blocks by pasted character', () => {
    const result = searchUnicodeCharacters('😀');

    expect(result.characters[0]?.code).toBe('U+1F600');
    expect(result.matchedBlockValues).toEqual(['emoticons']);
  });
});
