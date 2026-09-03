import { describe, expect, it } from 'vitest';
import { analyzeText } from './textAnalyzer';

describe('textAnalyzer utilities', () => {
  it('counts paragraphs, words, and characters', () => {
    const analysis = analyzeText('Hello world.\n\nSecond paragraph!', false);

    expect(analysis.paragraphCount).toBe(2);
    expect(analysis.wordCount).toBe(4);
    expect(analysis.nonWhitespaceCharacterCount).toBe(27);
    expect(analysis.totalCharacterCount).toBe(31);
    expect(analysis.sentenceCount).toBe(2);
  });

  it('groups word frequency case-insensitively by default', () => {
    const analysis = analyzeText('Code code CODE test', false);

    expect(analysis.wordFrequency[0]).toEqual({ word: 'code', count: 3, percentage: 75 });
    expect(analysis.uniqueWordCount).toBe(2);
  });

  it('supports case-sensitive word frequency', () => {
    const analysis = analyzeText('Code code CODE', true);

    expect(analysis.wordFrequency.map((item) => item.word)).toEqual(['code', 'Code', 'CODE']);
    expect(analysis.uniqueWordCount).toBe(3);
  });

  it('returns readability-style stats', () => {
    const analysis = analyzeText('One two three. Four five.', false);

    expect(analysis.averageWordsPerSentence).toBe(2.5);
    expect(analysis.averageCharactersPerWord).toBe(3.8);
    expect(analysis.estimatedReadingMinutes).toBe(1);
    expect(analysis.longestWord).toBe('three');
    expect(analysis.mostCommonWord).toBe('five');
  });
});
