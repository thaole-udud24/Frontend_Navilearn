import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';

export type DashboardLearningState =
  | 'LEARNING'
  | 'PRACTICING'
  | 'UNDERSTOOD'
  | 'APPLIED'
  | 'DECAY_RISK';

export interface MasteryDashboard {
  summary: {
    trackedConcepts: number;
    assessedConcepts: number;
    averageMastery: number | null;
    masteredConcepts: number;
    decayRiskConcepts: number;
  };
  stateCounts: Record<DashboardLearningState, number>;
  trend: Array<{ date: string; averageMastery: number | null }>;
  weakConcepts: Array<{
    conceptId: string;
    name: string;
    score: number;
    learningState: DashboardLearningState;
  }>;
}

export async function getMasteryDashboard(): Promise<MasteryDashboard> {
  const { data } = await request.get<ApiSuccess<MasteryDashboard>>(
    ENDPOINTS.masteryItems.dashboard,
  );
  return data.data;
}