import { describe, expect, it } from 'vitest';
import {
  DAY_ONE_PHRASE_IDS,
  friendsAndFamilyPhrases,
  getPhraseById,
} from './friendsAndFamily';

const KANA_PATTERN = /^[\u3040-\u30ff？?]+$/;

describe('friends and family phrases', () => {
  it('stays in the everyday deck size and uses unique ids', () => {
    expect(friendsAndFamilyPhrases.length).toBeGreaterThanOrEqual(30);
    expect(friendsAndFamilyPhrases.length).toBeLessThanOrEqual(50);
    expect(new Set(friendsAndFamilyPhrases.map(phrase => phrase.id)).size).toBe(
      friendsAndFamilyPhrases.length,
    );
  });

  it('includes the day-one phrases Brian needs first', () => {
    for (const id of DAY_ONE_PHRASE_IDS) {
      const phrase = getPhraseById(id);
      expect(phrase, id).toBeDefined();
      expect(phrase?.english.length).toBeGreaterThan(0);
      expect(phrase?.kana).toMatch(KANA_PATTERN);
      expect(phrase?.speech.length).toBeGreaterThan(0);
    }

    expect(getPhraseById('genki')?.kanji).toBe('元気？');
    expect(getPhraseById('konnichiwa')?.kana).toBe('こんにちは');
    expect(getPhraseById('arigatou')?.politeNote).toContain(
      'ありがとうございます',
    );
    expect(getPhraseById('ohayou')?.politeNote).toContain('おはようございます');
    expect(getPhraseById('oyasumi')?.politeNote).toContain('おやすみなさい');
  });

  it('keeps kana, romaji, english, and speech on every card', () => {
    for (const phrase of friendsAndFamilyPhrases) {
      expect(phrase.kana).toMatch(KANA_PATTERN);
      expect(phrase.romaji.trim().length).toBeGreaterThan(0);
      expect(phrase.english.trim().length).toBeGreaterThan(0);
      expect(phrase.speech).not.toMatch(/[？?]/);
      if (phrase.kanji) {
        expect(phrase.kanji).toMatch(/[\u4e00-\u9fff]/);
      }
      if (phrase.politeNote) {
        expect(phrase.politeNote.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
