import type { Flashcard, FlashcardDeck } from '@/services/flashcard/types';

export type CardStateStatus = 'new' | 'learning' | 'review';
export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

export interface DueCardState {
  _id: string;
  owner: string;
  card: Flashcard;
  deck: Pick<FlashcardDeck, '_id' | 'title'> | string;
  status: CardStateStatus;
  easeFactor: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  dueAt: string;
  lastReviewedAt: string | null;
}

export interface DueCardsFilters {
  deck?: string;
  concept?: string;
  subjectId?: string;
  limit?: number;
}

export interface CardStateStats {
  new: number;
  learning: number;
  review: number;
  due: number;
}
