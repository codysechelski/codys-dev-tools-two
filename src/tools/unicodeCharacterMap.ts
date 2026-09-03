import { unicodeName } from 'unicode-name';
import { getCategory } from 'unicode-properties';
import { unicodeBlocks } from './unicodeBlocks.generated';

export { unicodeBlocks };

export const ALL_UNICODE_BLOCK_VALUE = 'all';
export const MAX_ALL_SEARCH_RESULTS = 500;

export interface UnicodeBlock {
  label: string;
  value: string;
  start: number;
  end: number;
}

export interface UnicodeCharacterInfo {
  codePoint: number;
  character: string;
  displayCharacter: string;
  code: string;
  name: string;
  block: string;
  category: string;
  categoryLabel: string;
  htmlCode: string;
  cssCode: string;
  binary: string;
  decimal: string;
  octal: string;
  hexadecimal: string;
}

const categoryLabels: Record<string, string> = {
  Cc: 'Control',
  Cf: 'Format',
  Co: 'Private Use',
  Cs: 'Surrogate',
  Ll: 'Lowercase Letter',
  Lm: 'Modifier Letter',
  Lo: 'Other Letter',
  Lt: 'Titlecase Letter',
  Lu: 'Uppercase Letter',
  Mc: 'Spacing Mark',
  Me: 'Enclosing Mark',
  Mn: 'Nonspacing Mark',
  Nd: 'Decimal Number',
  Nl: 'Letter Number',
  No: 'Other Number',
  Pc: 'Connector Punctuation',
  Pd: 'Dash Punctuation',
  Pe: 'Close Punctuation',
  Pf: 'Final Punctuation',
  Pi: 'Initial Punctuation',
  Po: 'Other Punctuation',
  Ps: 'Open Punctuation',
  Sc: 'Currency Symbol',
  Sk: 'Modifier Symbol',
  Sm: 'Math Symbol',
  So: 'Other Symbol',
  Zl: 'Line Separator',
  Zp: 'Paragraph Separator',
  Zs: 'Space Separator',
};

const displayCharacters: Record<number, string> = {
  0x0000: 'NUL',
  0x0009: 'TAB',
  0x000a: 'LF',
  0x000d: 'CR',
  0x0020: 'SP',
  0x007f: 'DEL',
  0x00a0: 'NBSP',
};

export function getCharactersForBlock(blockValue: string): UnicodeCharacterInfo[] {
  const block = unicodeBlocks.find((item) => item.value === blockValue) ?? unicodeBlocks[0];
  const characters: UnicodeCharacterInfo[] = [];

  for (let codePoint = block.start; codePoint <= block.end; codePoint += 1) {
    if (codePoint >= 0xd800 && codePoint <= 0xdfff) continue;
    characters.push(getUnicodeCharacterInfo(codePoint, block));
  }

  return characters;
}

export interface UnicodeSearchResult {
  characters: UnicodeCharacterInfo[];
  matchedBlockValues: string[];
}

export function searchUnicodeCharacters(query: string, blockValue = ALL_UNICODE_BLOCK_VALUE): UnicodeSearchResult {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return { characters: [], matchedBlockValues: [] };

  const exactCodePoint = parseSearchCodePoint(query);
  if (exactCodePoint !== undefined) {
    const block = getBlockForCodePoint(exactCodePoint);
    if (!block || (blockValue !== ALL_UNICODE_BLOCK_VALUE && block.value !== blockValue)) {
      return { characters: [], matchedBlockValues: [] };
    }

    return { characters: [getUnicodeCharacterInfo(exactCodePoint, block)], matchedBlockValues: [block.value] };
  }

  const blocks = blockValue === ALL_UNICODE_BLOCK_VALUE ? unicodeBlocks : unicodeBlocks.filter((block) => block.value === blockValue);
  const characters: UnicodeCharacterInfo[] = [];
  const matchedBlockValues = new Set<string>();

  for (const block of blocks) {
    for (let codePoint = block.start; codePoint <= block.end; codePoint += 1) {
      if (codePoint >= 0xd800 && codePoint <= 0xdfff) continue;

      const character = getUnicodeCharacterInfo(codePoint, block);
      if (!matchesSearch(character, normalizedQuery)) continue;

      matchedBlockValues.add(block.value);
      if (characters.length < MAX_ALL_SEARCH_RESULTS) characters.push(character);
    }
  }

  return { characters, matchedBlockValues: [...matchedBlockValues] };
}

export function getUnicodeCharacterInfo(codePoint: number, block = getBlockForCodePoint(codePoint)): UnicodeCharacterInfo {
  const character = String.fromCodePoint(codePoint);
  const code = formatCodePoint(codePoint);
  const category = getCategory(codePoint);

  return {
    codePoint,
    character,
    displayCharacter: getDisplayCharacter(codePoint, character, category),
    code,
    name: unicodeName(codePoint) ?? `UNASSIGNED ${code}`,
    block: block?.label ?? 'Unknown',
    category,
    categoryLabel: categoryLabels[category] ?? category,
    htmlCode: `&#x${toHex(codePoint)};`,
    cssCode: `\\${toHex(codePoint)} `,
    binary: `0b${codePoint.toString(2)}`,
    decimal: codePoint.toString(10),
    octal: `0o${codePoint.toString(8)}`,
    hexadecimal: `0x${toHex(codePoint)}`,
  };
}

export function formatCodePoint(codePoint: number): string {
  return `U+${toHex(codePoint).padStart(4, '0')}`;
}

function getBlockForCodePoint(codePoint: number): UnicodeBlock | undefined {
  return unicodeBlocks.find((block) => codePoint >= block.start && codePoint <= block.end);
}

function matchesSearch(character: UnicodeCharacterInfo, query: string): boolean {
  return character.name.toLowerCase().includes(query) || character.code.toLowerCase().includes(query) || character.character === query;
}

function parseSearchCodePoint(query: string): number | undefined {
  const trimmed = query.trim();
  const codeMatch = trimmed.match(/^U\+([0-9a-f]{1,6})$/i) ?? trimmed.match(/^0x([0-9a-f]{1,6})$/i);
  const hex = codeMatch?.[1];
  const parsed = hex ? Number.parseInt(hex, 16) : [...trimmed].length === 1 ? trimmed.codePointAt(0) : undefined;

  if (parsed === undefined || parsed < 0 || parsed > 0x10ffff || (parsed >= 0xd800 && parsed <= 0xdfff)) return undefined;

  return parsed;
}

function getDisplayCharacter(codePoint: number, character: string, category: string): string {
  if (displayCharacters[codePoint]) return displayCharacters[codePoint];
  if (category.startsWith('C') || category.startsWith('Z')) return '□';

  return character;
}

function toHex(codePoint: number): string {
  return codePoint.toString(16).toUpperCase();
}
