'use client';

import { useSyncExternalStore } from 'react';
import useDailyLessonStore, {
  type LessonPhase,
} from '@/features/DailyLesson/store/useDailyLessonStore';

export interface LessonSnapshot {
  dayIndex: number;
  phase: LessonPhase;
  queue: string[];
  queueIndex: number;
  chainedReview: boolean;
}

const SERVER_SNAPSHOT: LessonSnapshot = {
  dayIndex: 0,
  phase: 'overview',
  queue: [],
  queueIndex: 0,
  chainedReview: false,
};

let cached: LessonSnapshot = SERVER_SNAPSHOT;

const readSnapshot = (): LessonSnapshot => {
  const state = useDailyLessonStore.getState();
  if (
    cached.dayIndex === state.dayIndex &&
    cached.phase === state.phase &&
    cached.queue === state.queue &&
    cached.queueIndex === state.queueIndex &&
    cached.chainedReview === state.chainedReview
  ) {
    return cached;
  }

  cached = {
    dayIndex: state.dayIndex,
    phase: state.phase,
    queue: state.queue,
    queueIndex: state.queueIndex,
    chainedReview: state.chainedReview,
  };
  return cached;
};

const subscribe = (onStoreChange: () => void) =>
  useDailyLessonStore.subscribe(() => {
    cached = SERVER_SNAPSHOT;
    onStoreChange();
  });

export const useLessonSnapshot = (): LessonSnapshot =>
  useSyncExternalStore(subscribe, readSnapshot, () => SERVER_SNAPSHOT);
