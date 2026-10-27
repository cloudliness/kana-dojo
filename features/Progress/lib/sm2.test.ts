import { describe, expect, it } from 'vitest';
import {
  SM2_AGAIN_DELAY_MS,
  SM2_DAY_MS,
  SM2_DEFAULT_EASE,
  SM2_MIN_EASE,
  applySm2,
  countDueCards,
  createSrsCard,
  listDueIds,
} from './sm2';

describe('applySm2', () => {
  const now = 1_700_000_000_000;

  it('schedules a miss ten minutes later and resets the ladder', () => {
    const next = applySm2(createSrsCard(now), 'again', now);

    expect(next.repetitions).toBe(0);
    expect(next.intervalDays).toBe(0);
    expect(next.dueAt).toBe(now + SM2_AGAIN_DELAY_MS);
    expect(next.ease).toBeCloseTo(SM2_DEFAULT_EASE - 0.2);
    expect(next.lastReviewedAt).toBe(now);
  });

  it('gives the first successful recall a one-day interval', () => {
    const next = applySm2(createSrsCard(now), 'good', now);

    expect(next.repetitions).toBe(1);
    expect(next.intervalDays).toBe(1);
    expect(next.ease).toBe(SM2_DEFAULT_EASE);
    expect(next.dueAt).toBe(now + SM2_DAY_MS);
  });

  it('uses the six-day step on the second successful recall', () => {
    const first = applySm2(createSrsCard(now), 'good', now);
    const second = applySm2(first, 'good', now + SM2_DAY_MS);

    expect(second.repetitions).toBe(2);
    expect(second.intervalDays).toBe(6);
    expect(second.ease).toBe(SM2_DEFAULT_EASE);
  });

  it('multiplies the interval by ease after the card has graduated', () => {
    const graduated = {
      ...createSrsCard(now),
      repetitions: 2,
      intervalDays: 6,
      ease: SM2_DEFAULT_EASE,
      lastReviewedAt: now,
    };
    const next = applySm2(graduated, 'good', now);

    expect(next.intervalDays).toBe(15);
    expect(next.repetitions).toBe(3);
  });

  it('lengthens an easy first recall and raises ease', () => {
    const next = applySm2(createSrsCard(now), 'easy', now);

    expect(next.intervalDays).toBe(4);
    expect(next.ease).toBeCloseTo(2.6);
  });

  it('keeps ease at or above the SM-2 floor', () => {
    let card = { ...createSrsCard(now), ease: SM2_MIN_EASE };
    card = applySm2(card, 'again', now);
    card = applySm2(card, 'again', now);

    expect(card.ease).toBe(SM2_MIN_EASE);
  });
});

describe('due counts', () => {
  const now = 1_700_000_000_000;

  it('ignores cards that have never been reviewed', () => {
    const cards = { 'kana:あ': createSrsCard(now - 1000) };

    expect(countDueCards(cards, now)).toBe(0);
    expect(listDueIds(cards, now)).toEqual([]);
  });

  it('counts reviewed cards whose due time has arrived', () => {
    const due = applySm2(
      createSrsCard(now - SM2_DAY_MS),
      'good',
      now - SM2_DAY_MS,
    );
    const later = applySm2(createSrsCard(now), 'good', now);
    const cards = { 'phrase:arigatou': due, 'kana:あ': later };

    expect(countDueCards(cards, now)).toBe(1);
    expect(listDueIds(cards, now)).toEqual(['phrase:arigatou']);
  });
});
