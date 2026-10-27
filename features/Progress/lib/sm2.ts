/**
 * SM-2 spaced repetition with a short relearning step.
 *
 * Successful reviews follow the classic SM-2 interval ladder
 * (1 day, then 6 days, then interval × ease). "Again" is scheduled
 * 10 minutes out so a missed beginner card returns the same day
 * instead of disappearing until tomorrow. Ease updates use the
 * standard SM-2 formula and never drop below 1.3.
 */

export const SM2_DEFAULT_EASE = 2.5;
export const SM2_MIN_EASE = 1.3;
export const SM2_DAY_MS = 24 * 60 * 60 * 1000;
export const SM2_AGAIN_DELAY_MS = 10 * 60 * 1000;

export type RecallGrade = 'again' | 'hard' | 'good' | 'easy';

export interface SrsCard {
  ease: number;
  intervalDays: number;
  repetitions: number;
  dueAt: number;
  lastReviewedAt: number | null;
}

const QUALITY: Record<RecallGrade, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

const roundEase = (value: number): number => Math.round(value * 100) / 100;

export const createSrsCard = (now: number): SrsCard => ({
  ease: SM2_DEFAULT_EASE,
  intervalDays: 0,
  repetitions: 0,
  dueAt: now,
  lastReviewedAt: null,
});

export const applySm2 = (
  card: SrsCard,
  grade: RecallGrade,
  now: number,
): SrsCard => {
  const quality = QUALITY[grade];

  if (quality < 3) {
    return {
      ease: Math.max(SM2_MIN_EASE, roundEase(card.ease - 0.2)),
      intervalDays: 0,
      repetitions: 0,
      dueAt: now + SM2_AGAIN_DELAY_MS,
      lastReviewedAt: now,
    };
  }

  const easeDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const ease = Math.max(SM2_MIN_EASE, roundEase(card.ease + easeDelta));

  let intervalDays: number;
  if (card.repetitions <= 0) {
    intervalDays = grade === 'easy' ? 4 : 1;
  } else if (card.repetitions === 1) {
    intervalDays = grade === 'hard' ? 4 : grade === 'easy' ? 7 : 6;
  } else {
    const multiplier =
      grade === 'hard' ? 1.2 : grade === 'easy' ? ease * 1.3 : ease;
    intervalDays = Math.max(1, Math.round(card.intervalDays * multiplier));
  }

  return {
    ease,
    intervalDays,
    repetitions: card.repetitions + 1,
    dueAt: now + intervalDays * SM2_DAY_MS,
    lastReviewedAt: now,
  };
};

export const isCardDue = (card: SrsCard, now: number): boolean =>
  card.lastReviewedAt !== null && card.dueAt <= now;

export const countDueCards = (
  cards: Record<string, SrsCard>,
  now: number,
): number => Object.values(cards).filter(card => isCardDue(card, now)).length;

export const listDueIds = (
  cards: Record<string, SrsCard>,
  now: number,
): string[] =>
  Object.entries(cards)
    .filter(([, card]) => isCardDue(card, now))
    .map(([id]) => id)
    .sort();
