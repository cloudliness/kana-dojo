import { describe, expect, it } from 'vitest';
import { friendsAndFamilyPhrases } from '@/features/Phrases/data/friendsAndFamily';
import { buildLessonDays } from './buildLessonDays';

describe('buildLessonDays', () => {
  const days = buildLessonDays();

  it('starts with the vowel row and the five starter phrases', () => {
    expect(days[0]?.kana.map(item => item.char)).toEqual([
      'あ',
      'い',
      'う',
      'え',
      'お',
    ]);
    expect(days[0]?.kana.map(item => item.romaji)).toEqual([
      'a',
      'i',
      'u',
      'e',
      'o',
    ]);
    expect(days[0]?.phraseIds).toEqual([
      'konnichiwa',
      'arigatou',
      'ohayou',
      'oyasumi',
      'genki',
    ]);
  });

  it('continues through the hiragana chart in row order', () => {
    expect(days[1]?.kana.map(item => item.char)).toEqual([
      'か',
      'き',
      'く',
      'け',
      'こ',
    ]);
    expect(days[2]?.kana.map(item => item.char)).toEqual([
      'さ',
      'し',
      'す',
      'せ',
      'そ',
    ]);
    expect(days.some(day => day.kana.some(item => item.char === 'ん'))).toBe(
      true,
    );
    expect(days.some(day => day.kana.some(item => item.char === 'ア'))).toBe(
      false,
    );
  });

  it('introduces every friends-and-family phrase once', () => {
    const introduced = days.flatMap(day => day.phraseIds);
    expect(introduced).toHaveLength(friendsAndFamilyPhrases.length);
    expect(new Set(introduced)).toEqual(
      new Set(friendsAndFamilyPhrases.map(phrase => phrase.id)),
    );
  });

  it('pairs later days with a couple of phrases', () => {
    expect(days[1]?.phraseIds).toHaveLength(2);
    expect(days[1]?.phraseIds).not.toContain('konnichiwa');
  });
});
