import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  CreateMasteryItemInput,
  Mastery,
  MasteryFilters,
  MasteryItem,
  MasteryItemFilters,
  MasteryReportEntry,
  MasteryTrendPoint,
} from './types';

export async function listMasteryItems(filters: MasteryItemFilters): Promise<ApiSuccess<MasteryItem[]>> {
  const { data } = await request.get<ApiSuccess<MasteryItem[]>>(ENDPOINTS.masteryItems.list, { params: filters });
  return data;
}

export async function listMasteries(filters: MasteryFilters): Promise<ApiSuccess<Mastery[]>> {
  const { data } = await request.get<ApiSuccess<Mastery[]>>(ENDPOINTS.masteryItems.list, { params: filters });
  return data;
}

export async function createMasteryItem(input: CreateMasteryItemInput): Promise<MasteryItem> {
  const { data } = await request.post<ApiSuccess<MasteryItem>>(ENDPOINTS.masteryItems.create, input);
  return data.data;
}

export async function getMastery(id: string): Promise<Mastery> {
  const { data } = await request.get<ApiSuccess<Mastery>>(ENDPOINTS.masteryItems.detail(id));
  return data.data;
}

export async function getMasteryTrend(
  id: string,
  range?: { from?: string; to?: string },
): Promise<{ concept: Mastery['concept']; points: MasteryTrendPoint[] }> {
  const { data } = await request.get<ApiSuccess<{ concept: Mastery['concept']; points: MasteryTrendPoint[] }>>(
    ENDPOINTS.masteryItems.trend(id),
    { params: range },
  );
  return data.data;
}

export async function setMasteryGoal(id: string, goalScore: number): Promise<Mastery> {
  const { data } = await request.patch<ApiSuccess<Mastery>>(ENDPOINTS.masteryItems.goal(id), { goalScore });
  return data.data;
}

export async function markContentComplete(concept: string, contentRef: string): Promise<Mastery> {
  const { data } = await request.post<ApiSuccess<Mastery>>(ENDPOINTS.masteryItems.complete, {
    concept,
    contentRef,
  });
  return data.data;
}

export async function exportMasteryReport(filters: {
  concept?: string;
  from?: string;
  to?: string;
}): Promise<MasteryReportEntry[]> {
  const { data } = await request.get<ApiSuccess<MasteryReportEntry[]>>(ENDPOINTS.masteryItems.export, {
    params: filters,
  });
  return data.data;
}
