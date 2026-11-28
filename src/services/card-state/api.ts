import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { CardStateStats, DueCardsFilters, DueCardState, ReviewGrade } from './types';

export async function listDueCards(filters: DueCardsFilters = {}): Promise<DueCardState[]> {
  const { data } = await request.get<ApiSuccess<DueCardState[]>>(ENDPOINTS.cardStates.due, {
    params: filters,
  });
  return data.data;
}

export async function reviewCard(cardId: string, grade: ReviewGrade): Promise<DueCardState> {
  const { data } = await request.post<ApiSuccess<DueCardState>>(ENDPOINTS.cardStates.review(cardId), { grade });
  return data.data;
}

export async function getCardStateStats(deck?: string, subjectId?: string): Promise<CardStateStats> {
  const { data } = await request.get<ApiSuccess<CardStateStats>>(ENDPOINTS.cardStates.stats, {
    params: { deck, ...(subjectId ? { subjectId } : {}) },
  });
  return data.data;
}
