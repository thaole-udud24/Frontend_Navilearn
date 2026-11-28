export type FlashcardStatus = 'active' | 'archived';

export interface FlashcardDeck {
  _id: string;
  title: string;
  concept: { _id: string; name: string } | string;
  description?: string;
  status: FlashcardStatus;
  /** Real count of non-deleted cards in the deck, computed server-side — never fabricated. */
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeckFilters {
  page?: number;
  limit?: number;
  concept?: string;
  subjectId?: string;
  status?: FlashcardStatus;
}

export interface CreateDeckInput {
  title: string;
  concept: string;
  description?: string;
}

export type UpdateDeckInput = Partial<CreateDeckInput>;

export interface Flashcard {
  _id: string;
  deck: string;
  front: string;
  back: string;
  status: FlashcardStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CardFilters {
  page?: number;
  limit?: number;
  status?: FlashcardStatus;
}

export interface CreateCardInput {
  front: string;
  back: string;
}

export type UpdateCardInput = Partial<CreateCardInput>;
