'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type LessonPhase = 'overview' | 'practice' | 'review';

interface DailyLessonState {
  dayIndex: number;
  phase: LessonPhase;
  queue: string[];
  queueIndex: number;
  /** Review that continues a practice session should finish the day. */
  chainedReview: boolean;
  beginPractice: (ids: string[]) => void;
  beginReview: (ids: string[], chained: boolean) => void;
  advanceQueue: (requeueId?: string) => void;
  completeDay: () => void;
  returnToOverview: () => void;
}

const useDailyLessonStore = create<DailyLessonState>()(
  persist(
    set => ({
      dayIndex: 0,
      phase: 'overview',
      queue: [],
      queueIndex: 0,
      chainedReview: false,
      beginPractice: ids =>
        set({
          phase: 'practice',
          queue: ids,
          queueIndex: 0,
          chainedReview: false,
        }),
      beginReview: (ids, chained) =>
        set({
          phase: 'review',
          queue: ids,
          queueIndex: 0,
          chainedReview: chained,
        }),
      advanceQueue: requeueId =>
        set(state => {
          const queue = requeueId ? [...state.queue, requeueId] : state.queue;
          return {
            queue,
            queueIndex: state.queueIndex + 1,
          };
        }),
      completeDay: () =>
        set(state => ({
          dayIndex: state.dayIndex + 1,
          phase: 'overview',
          queue: [],
          queueIndex: 0,
          chainedReview: false,
        })),
      returnToOverview: () =>
        set({
          phase: 'overview',
          queue: [],
          queueIndex: 0,
          chainedReview: false,
        }),
    }),
    {
      name: 'kanadojo-daily-lesson',
      storage:
        typeof window !== 'undefined'
          ? createJSONStorage(() => localStorage)
          : undefined,
      partialize: state => ({
        dayIndex: state.dayIndex,
        phase: state.phase,
        queue: state.queue,
        queueIndex: state.queueIndex,
        chainedReview: state.chainedReview,
      }),
    },
  ),
);

export default useDailyLessonStore;
