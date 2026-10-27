'use client';

import { useSyncExternalStore } from 'react';
import useSrsStore from '@/features/Progress/store/useSrsStore';
import { listDueIds } from '@/features/Progress/lib/sm2';

const SERVER_DUE_IDS: string[] = [];

let cachedCards: unknown = null;
let cachedIds: string[] = SERVER_DUE_IDS;
let nowMs = 0;

const markNow = () => {
  nowMs = Date.now();
};

const recompute = () => {
  const cards = useSrsStore.getState().cards;
  if (cards === cachedCards && cachedIds !== SERVER_DUE_IDS) return cachedIds;
  if (nowMs === 0) markNow();
  cachedCards = cards;
  cachedIds = listDueIds(cards, nowMs);
  return cachedIds;
};

const subscribe = (onStoreChange: () => void) => {
  markNow();
  cachedCards = null;
  const unsubscribe = useSrsStore.subscribe(() => {
    markNow();
    cachedCards = null;
    onStoreChange();
  });
  const timer = window.setInterval(() => {
    markNow();
    cachedCards = null;
    onStoreChange();
  }, 60_000);
  return () => {
    unsubscribe();
    window.clearInterval(timer);
  };
};

const getServerDueIds = () => SERVER_DUE_IDS;

export const useDueCardIds = (): string[] =>
  useSyncExternalStore(subscribe, recompute, getServerDueIds);
