import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  CardFilters,
  CreateCardInput,
  CreateDeckInput,
  DeckFilters,
  Flashcard,
  FlashcardDeck,
  UpdateCardInput,
  UpdateDeckInput,
} from './types';

export async function listDecks(filters: DeckFilters = {}): Promise<ApiSuccess<FlashcardDeck[]>> {
  const { data } = await request.get<ApiSuccess<FlashcardDeck[]>>(ENDPOINTS.flashcardDeckItems.list, {
    params: filters,
  });
  return data;
}

export async function createDeck(input: CreateDeckInput): Promise<FlashcardDeck> {
  const { data } = await request.post<ApiSuccess<FlashcardDeck>>(ENDPOINTS.flashcardDeckItems.create, input);
  return data.data;
}

export async function updateDeck(id: string, input: UpdateDeckInput): Promise<FlashcardDeck> {
  const { data } = await request.patch<ApiSuccess<FlashcardDeck>>(
    ENDPOINTS.flashcardDeckItems.detail(id),
    input,
  );
  return data.data;
}

export async function archiveDeck(id: string): Promise<FlashcardDeck> {
  const { data } = await request.patch<ApiSuccess<FlashcardDeck>>(ENDPOINTS.flashcardDeckItems.updateStatus(id), {
    status: 'archived',
  });
  return data.data;
}

export async function activateDeck(id: string): Promise<FlashcardDeck> {
  const { data } = await request.patch<ApiSuccess<FlashcardDeck>>(ENDPOINTS.flashcardDeckItems.updateStatus(id), {
    status: 'active',
  });
  return data.data;
}

export async function removeDeck(id: string): Promise<void> {
  await request.delete(ENDPOINTS.flashcardDeckItems.detail(id));
}

export async function listCards(deckId: string, filters: CardFilters = {}): Promise<ApiSuccess<Flashcard[]>> {
  const { data } = await request.get<ApiSuccess<Flashcard[]>>(ENDPOINTS.flashcardDeckItems.cards(deckId), {
    params: filters,
  });
  return data;
}

export async function createCard(deckId: string, input: CreateCardInput): Promise<Flashcard> {
  const { data } = await request.post<ApiSuccess<Flashcard>>(ENDPOINTS.flashcardDeckItems.cards(deckId), input);
  return data.data;
}

export async function updateCard(deckId: string, id: string, input: UpdateCardInput): Promise<Flashcard> {
  const { data } = await request.patch<ApiSuccess<Flashcard>>(
    ENDPOINTS.flashcardDeckItems.card(deckId, id),
    input,
  );
  return data.data;
}

export async function removeCard(deckId: string, id: string): Promise<void> {
  await request.delete(ENDPOINTS.flashcardDeckItems.card(deckId, id));
}
