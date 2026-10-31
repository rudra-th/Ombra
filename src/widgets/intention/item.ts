import { storage } from 'wxt/utils/storage';
import { nextStreak } from './store';
import { todayKey } from '../../state/day';

/** Whatever the day's stone said the last time it was written. */
export interface IntentionRecord {
  text: string;
  /** `YYYY-MM-DD` the record belongs to. */
  key: string;
  streak: number;
  lastKey: string | null;
}

export const EMPTY_INTENTION: IntentionRecord = {
  text: '',
  key: '',
  streak: 0,
  lastKey: null,
};

export const intentionItem = storage.defineItem<IntentionRecord>(
  'local:intention',
  { fallback: EMPTY_INTENTION },
);

/** Empty text erases today's line but keeps a streak already earned today. */
export function commitIntention(
  prev: IntentionRecord,
  text: string,
  today: string,
): IntentionRecord {
  const trimmed = text.trim();
  if (!trimmed) {
    return prev.key === today ? { ...prev, text: '' } : EMPTY_INTENTION;
  }
  return {
    text: trimmed,
    key: today,
    streak: nextStreak({ streak: prev.streak, lastKey: prev.lastKey }, today, today),
    lastKey: today,
  };
}
