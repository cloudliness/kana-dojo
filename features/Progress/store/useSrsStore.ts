'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  applySm2,
  createSrsCard,
  type RecallGrade,
  type SrsCard,
} from '@/features/Progress/lib/sm2';

interface SrsState {
  cards: Record<string, SrsCard>;
  review: (id: string, grade: RecallGrade, now?: number) => void;
  reset: () => void;
}

const useSrsStore = create<SrsState>()(
  persist(
    set => ({
      cards: {},
      review: (id, grade, now = Date.now()) =>
        set(state => {
          const current = state.cards[id] ?? createSrsCard(now);
          return {
            cards: {
              ...state.cards,
              [id]: applySm2(current, grade, now),
            },
          };
        }),
      reset: () => set({ cards: {} }),
    }),
    {
      name: 'kanadojo-srs',
      storage:
        typeof window !== 'undefined'
          ? createJSONStorage(() => localStorage)
          : undefined,
      partialize: state => ({ cards: state.cards }),
    },
  ),
);

export default useSrsStore;
