export interface WordFrequency {
  word: string;
  count: number;
  percentage: number;
}

export interface TextAnalysis {
  paragraphCount: number;
  wordCount: number;
  nonWhitespaceCharacterCount: number;
  totalCharacterCount: number;
  sentenceCount: number;
  lineCount: number;
  uniqueWordCount: number;
  averageWordsPerSentence: number;
  averageCharactersPerWord: number;
  estimatedReadingMinutes: number;
  longestWord: string;
  mostCommonWord: string;
  wordFrequency: WordFrequency[];
}

const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

export function analyzeText(input: string, caseSensitive: boolean): TextAnalysis {
  const totalCharacterCount = input.length;
  const nonWhitespaceCharacterCount = input.replace(/\s/g, '').length;
  const paragraphs = input.trim() ? input.trim().split(/(?:\r?\n){2,}/).filter((paragraph) => paragraph.trim()) : [];
  const lines = input ? input.split(/\r?\n/).length : 0;
  const rawWords = input.match(WORD_PATTERN) ?? [];
  const words = caseSensitive ? rawWords : rawWords.map((word) => word.toLocaleLowerCase());
  const wordCount = words.length;
  const sentences = input.trim() ? input.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.filter((sentence) => sentence.trim()) ?? [] : [];
  const wordFrequency = getWordFrequency(words, wordCount);
  const longestWord = rawWords.reduce((longest, word) => (word.length > longest.length ? word : longest), '');

  return {
    paragraphCount: paragraphs.length,
    wordCount,
    nonWhitespaceCharacterCount,
    totalCharacterCount,
    sentenceCount: sentences.length,
    lineCount: lines,
    uniqueWordCount: wordFrequency.length,
    averageWordsPerSentence: sentences.length ? roundToOneDecimal(wordCount / sentences.length) : 0,
    averageCharactersPerWord: wordCount ? roundToOneDecimal(rawWords.join('').length / wordCount) : 0,
    estimatedReadingMinutes: wordCount ? Math.max(1, Math.ceil(wordCount / 225)) : 0,
    longestWord,
    mostCommonWord: wordFrequency[0]?.word ?? '',
    wordFrequency,
  };
}

function getWordFrequency(words: string[], wordCount: number): WordFrequency[] {
  const counts = new Map<string, number>();

  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([word, count]) => ({
      word,
      count,
      percentage: wordCount ? roundToOneDecimal((count / wordCount) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
