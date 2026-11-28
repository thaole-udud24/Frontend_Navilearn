import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type { LearningEffectivenessReport, ReportKind, SubjectOption, TopMissedQuestion, VolumeReport } from './types';

export async function listReportSubjects(): Promise<SubjectOption[]> {
  const { data } = await request.get<ApiSuccess<SubjectOption[]>>(ENDPOINTS.adminInsights.subjects);
  return data.data;
}

export async function getLearningEffectiveness(subjectId?: string): Promise<LearningEffectivenessReport> {
  const { data } = await request.get<ApiSuccess<LearningEffectivenessReport>>(
    ENDPOINTS.adminInsights.learningEffectiveness,
    { params: subjectId ? { subjectId } : undefined },
  );
  return data.data;
}

export async function getVolumeReport(days: number): Promise<VolumeReport> {
  const { data } = await request.get<ApiSuccess<VolumeReport>>(ENDPOINTS.adminInsights.volume, {
    params: { days },
  });
  return data.data;
}

export async function getTopMissedQuestions(limit = 20): Promise<TopMissedQuestion[]> {
  const { data } = await request.get<ApiSuccess<TopMissedQuestion[]>>(ENDPOINTS.adminInsights.topMissedQuestions, {
    params: { limit },
  });
  return data.data;
}

export async function exportReport(
  report: ReportKind,
  params: { subjectId?: string; days?: number; limit?: number } = {},
): Promise<Blob> {
  const { data } = await request.get<Blob>(ENDPOINTS.adminInsights.export, {
    params: { report, ...params },
    responseType: 'blob',
  });
  return data;
}
