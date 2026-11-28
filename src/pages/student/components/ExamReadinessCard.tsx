import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Card } from '@/components/ui/card';
import { listAssessments } from '@/services/assessment';
import { listAssessmentConfigs } from '@/services/assessment-config';
import { listMasteries } from '@/services/mastery';
import { listPlans } from '@/services/planning';

/** S12/N4 "Mức sẵn sàng thi" (doc §6.4): ba chỉ số tách biệt — Tiến độ, Mastery, Thi thử — KHÔNG gộp
 * thành một "điểm dự đoán" (khác với chữ mockup trên wireframe S12, vốn mâu thuẫn với quy tắc này).
 * Shared by PracticeResult.tsx (S12, no goalId — first active plan) and Mastery.tsx (N4, one card
 * per active goal) so the two screens never drift into two different readiness calculations.
 * Mastery/Thi thử are student-wide (not goal-specific — no per-concept breakdown exists yet for
 * either); only Tiến độ narrows to the goal's own plan when goalId is given. */
export function useExamReadiness(goalId?: string) {
  const { data: plansRes } = useQuery({
    queryKey: ['exam-readiness-plans'],
    queryFn: () => listPlans({ status: 'active', limit: 50 }),
  });
  const plan = goalId ? plansRes?.data?.find((p) => p.goal === goalId) : plansRes?.data?.[0];

  const { data: masteryRes } = useQuery({
    queryKey: ['exam-readiness-masteries'],
    queryFn: () => listMasteries({ page: 1, limit: 100 }),
  });
  const masteries = masteryRes?.data ?? [];
  const overallMastery = masteries.length
    ? Math.round(masteries.reduce((sum, m) => sum + m.score, 0) / masteries.length)
    : null;

  const { data: mockConfigsRes } = useQuery({
    queryKey: ['exam-readiness-mock-configs'],
    queryFn: () => listAssessmentConfigs({ kind: 'mock_exam', status: 'active', limit: 100 }),
  });
  const mockConfigIds = useMemo(
    () => new Set((mockConfigsRes?.data ?? []).map((c) => c._id)),
    [mockConfigsRes],
  );

  const { data: submittedRes } = useQuery({
    queryKey: ['exam-readiness-submitted'],
    queryFn: () => listAssessments({ status: 'submitted', limit: 100 }),
    enabled: !!mockConfigsRes,
  });
  const latestMockExam = useMemo(() => {
    const attempts = (submittedRes?.data ?? [])
      .filter((a) => mockConfigIds.has(a.assessmentConfig))
      .sort((a, b) => new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime());
    return attempts[0] ?? null;
  }, [submittedRes, mockConfigIds]);

  return {
    progressPercent: plan?.coverage ? plan.coverage.percent : null,
    overallMastery,
    latestMockScore: latestMockExam ? latestMockExam.score : null,
  };
}

export function ExamReadinessCard({
  progressPercent,
  overallMastery,
  latestMockScore,
}: {
  progressPercent: number | null;
  overallMastery: number | null;
  latestMockScore: number | null;
}) {
  return (
    <Card className="rounded-card border border-border bg-card p-4 shadow-card">
      <h2 className="mb-1 font-semibold text-foreground">Mức sẵn sàng thi</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Ba chỉ số riêng biệt — không phải điểm dự đoán, không cam kết kết quả thi thật.
      </p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold text-foreground">
            {progressPercent != null ? `${progressPercent}%` : '—'}
          </div>
          <div className="text-xs text-muted-foreground">Tiến độ</div>
        </div>
        <div>
          <div className="text-lg font-bold text-foreground">
            {overallMastery != null ? `${overallMastery}%` : '—'}
          </div>
          <div className="text-xs text-muted-foreground">Mastery</div>
        </div>
        <div>
          <div className="text-lg font-bold text-foreground">
            {latestMockScore != null ? `${latestMockScore}%` : 'Chưa có'}
          </div>
          <div className="text-xs text-muted-foreground">Thi thử</div>
        </div>
      </div>
    </Card>
  );
}
