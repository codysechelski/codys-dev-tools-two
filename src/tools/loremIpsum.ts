export type LoremUnit = 'words' | 'paragraphs' | 'ordered-list-items' | 'unordered-list-items' | 'definition-list-items';
export type CountMode = 'about' | 'exactly';

export interface LoremOptions {
  unitCount: number;
  unit: LoremUnit;
  sentenceCountMode: CountMode;
  sentenceCount: number;
  wordCountMode: CountMode;
  wordCount: number;
  termWordCountMode: CountMode;
  termWordCount: number;
  varyEndingPunctuation: boolean;
  varySentencePunctuation: boolean;
  includeCommonHtmlTags: boolean;
  random?: () => number;
}

const WORDS = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
  'enim',
  'ad',
  'minim',
  'veniam',
  'quis',
  'nostrud',
  'exercitation',
  'ullamco',
  'laboris',
  'nisi',
  'aliquip',
  'ex',
  'ea',
  'commodo',
  'consequat',
  'duis',
  'aute',
  'irure',
  'reprehenderit',
  'voluptate',
  'velit',
  'esse',
  'cillum',
  'eu',
  'fugiat',
  'nulla',
  'pariatur',
  'excepteur',
  'sint',
  'occaecat',
  'cupidatat',
  'proident',
  'sunt',
  'culpa',
  'officia',
  'deserunt',
  'mollit',
  'anim',
  'id',
  'est',
  'laborum',
];

export function generateLoremIpsum(options: LoremOptions): string {
  const random = options.random ?? Math.random;
  const unitCount = clampCount(options.unitCount, 1, 100);

  if (options.unit === 'words') return generateWords(resolveCount(unitCount, 'exactly', random), random).join(' ');

  const items = Array.from({ length: unitCount }, () => {
    if (options.unit === 'definition-list-items') return generateDefinitionItem(options, random);
    return generateSentenceGroup(options, random);
  });

  if (options.unit === 'paragraphs') return items.map((item) => `<p>${item}</p>`).join('\n\n');
  if (options.unit === 'ordered-list-items') return `<ol>\n${items.map((item) => `  <li>${item}</li>`).join('\n')}\n</ol>`;
  if (options.unit === 'unordered-list-items') return `<ul>\n${items.map((item) => `  <li>${item}</li>`).join('\n')}\n</ul>`;

  return `<dl>\n${items.join('\n')}\n</dl>`;
}

export function stripHtml(markup: string): string {
  return markup
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<\/li>\s*<li>/gi, '\n')
    .replace(/<\/d[td]>\s*<d[td]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function generateDefinitionItem(options: LoremOptions, random: () => number): string {
  const termWordCount = resolveCount(options.termWordCount, options.termWordCountMode, random);
  const term = titleCase(generateWords(termWordCount, random).join(' '));
  const definition = generateSentenceGroup(options, random);

  return `  <dt>${term}</dt>\n  <dd>${definition}</dd>`;
}

function generateSentenceGroup(options: LoremOptions, random: () => number): string {
  const sentenceCount = resolveCount(options.sentenceCount, options.sentenceCountMode, random);
  return Array.from({ length: sentenceCount }, () => generateSentence(options, random)).join(' ');
}

function generateSentence(options: LoremOptions, random: () => number): string {
  const wordCount = resolveCount(options.wordCount, options.wordCountMode, random);
  const words = generateWords(wordCount, random);
  const punctuated = options.varySentencePunctuation ? addSentencePunctuation(words, random) : words;
  const tagged = options.includeCommonHtmlTags ? addCommonHtmlTags(punctuated, random) : punctuated;
  const sentence = capitalize(tagged.join(' '));

  return `${sentence}${getEndingPunctuation(options.varyEndingPunctuation, random)}`;
}

function generateWords(count: number, random: () => number): string[] {
  return Array.from({ length: clampCount(count, 1, 120) }, () => WORDS[Math.floor(random() * WORDS.length)] ?? WORDS[0]);
}

function addSentencePunctuation(words: string[], random: () => number): string[] {
  const result = [...words];
  for (let index = 2; index < result.length - 2; index += 1) {
    const roll = random();
    if (roll < 0.1) result[index] += ',';
    else if (roll < 0.112) result[index] += ';';
    else if (roll < 0.12) result[index] += ':';
  }

  if (result.length > 7 && random() < 0.08) {
    const start = 2 + Math.floor(random() * Math.max(1, result.length - 5));
    const end = Math.min(result.length - 2, start + 1 + Math.floor(random() * 3));
    result[start] = `(${result[start]}`;
    result[end] = `${result[end]})`;
  }

  if (result.length > 6 && random() < 0.12) {
    const start = 1 + Math.floor(random() * Math.max(1, result.length - 4));
    const end = Math.min(result.length - 2, start + 1 + Math.floor(random() * 3));
    result[start] = `"${result[start]}`;
    result[end] = `${result[end]}"`;
  }

  return result;
}

function addCommonHtmlTags(words: string[], random: () => number): string[] {
  const result = [...words];
  const tags = [
    ['em', 0.1],
    ['strong', 0.07],
    ['a', 0.05],
  ] as const;

  for (const [tag, chance] of tags) {
    if (result.length < 4 || random() >= chance) continue;
    const index = 1 + Math.floor(random() * (result.length - 2));
    if (tag === 'a') result[index] = `<a href="#">${result[index]}</a>`;
    else result[index] = `<${tag}>${result[index]}</${tag}>`;
  }

  return result;
}

function getEndingPunctuation(vary: boolean, random: () => number): string {
  if (!vary) return '.';
  const roll = random();
  if (roll < 0.07) return '?';
  if (roll < 0.12) return '!';
  return '.';
}

function resolveCount(value: number, mode: CountMode, random: () => number): number {
  const count = clampCount(value, 1, 120);
  if (mode === 'exactly') return count;

  const jitter = Math.max(1, Math.round(count * 0.18));
  const offset = Math.round((random() * 2 - 1) * jitter);
  return clampCount(count + offset, 1, 120);
}

function clampCount(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
