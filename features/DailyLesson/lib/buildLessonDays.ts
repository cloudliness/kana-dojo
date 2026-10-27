import { kana } from '@/entities/kana';
import {
  DAY_ONE_PHRASE_IDS,
  friendsAndFamilyPhrases,
  type Phrase,
} from '@/features/Phrases/data/friendsAndFamily';

export interface LessonKana {
  char: string;
  romaji: string;
}

export interface LessonDay {
  dayNumber: number;
  kana: LessonKana[];
  phraseIds: string[];
}

const PHRASES_PER_LATER_DAY = 2;

/**
 * One hiragana row per day, in chart order, plus phrases from the
 * Friends & Family deck. Day 1 is the vowel row and the five starter phrases.
 */
export const buildLessonDays = (
  phrases: Phrase[] = friendsAndFamilyPhrases,
): LessonDay[] => {
  const hiraganaRows = kana.filter(group => group.groupName.startsWith('h.'));
  const knownIds = new Set(phrases.map(phrase => phrase.id));
  const dayOneIds = DAY_ONE_PHRASE_IDS.filter(id => knownIds.has(id));
  const dayOneSet = new Set<string>(dayOneIds);
  const remaining = phrases
    .map(phrase => phrase.id)
    .filter(id => !dayOneSet.has(id));

  let cursor = 0;
  const days = hiraganaRows.map((group, index) => {
    const phraseIds =
      index === 0
        ? [...dayOneIds]
        : remaining.slice(cursor, cursor + PHRASES_PER_LATER_DAY);
    if (index > 0) cursor += phraseIds.length;

    return {
      dayNumber: index + 1,
      kana: group.kana.map((char, charIndex) => ({
        char,
        romaji: group.romanji[charIndex] ?? '',
      })),
      phraseIds,
    };
  });

  while (cursor < remaining.length) {
    const phraseIds = remaining.slice(cursor, cursor + PHRASES_PER_LATER_DAY);
    cursor += phraseIds.length;
    days.push({
      dayNumber: days.length + 1,
      kana: [],
      phraseIds,
    });
  }

  return days;
};

export const kanaCardId = (char: string): string => `kana:${char}`;
export const phraseCardId = (phraseId: string): string => `phrase:${phraseId}`;

export const lessonPracticeIds = (day: LessonDay): string[] => [
  ...day.kana.map(item => kanaCardId(item.char)),
  ...day.phraseIds.map(phraseCardId),
];
