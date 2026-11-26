import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { RefreshCcw } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { PATHS } from '@/routes/paths';
import {
  getMasteryDashboard,
  type DashboardLearningState,
} from '@/services/mastery/dashboard.api';

import { dashboardMockEnabled, mockMasteryDashboard } from '../dashboard.mock';

const STATE_LABELS: Record<DashboardLearningState, string> = {
  LEARNING: 'Đang học',
  PRACTICING: 'Đang luyện tập',
  UNDERSTOOD: 'Đã hiểu',
  APPLIED: 'Đã áp dụng',
  DECAY_RISK: 'Cần ôn lại',
};

export function DashboardMasteryOverview() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-mastery-overview', dashboardMockEnabled],
    queryFn: () =>
        dashboardMockEnabled
        ? Promise.resolve(mockMasteryDashboard)
        : getMasteryDashboard(),
});
    
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Đang tải tổng quan học tập…</p>;
  }

  if (isError || !data) {
    return <p role="alert" className="text-sm text-destructive">Không tải được số liệu Mastery.</p>;
  }

  const { summary, stateCounts, trend, weakConcepts } = data;
  const states = Object.entries(STATE_LABELS) as Array<
    [DashboardLearningState, string]
  >;

  return (
    <section className="space-y-4" aria-label="Tổng quan Mastery">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Tổng quan học tập</h2>
        <button
          type="button"
          onClick={() => void queryClient.invalidateQueries()}
          className="inline-flex items-center gap-2 rounded-control border border-border px-3 py-2 text-sm"
        >
          <RefreshCcw className="h-4 w-4" />
          Làm mới số liệu
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-card border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Mastery trung bình</p>
          <p className="mt-1 text-2xl font-bold">
            {summary.averageMastery === null ? '—' : `${summary.averageMastery}%`}
          </p>
          <p className="text-xs text-muted-foreground">
            Trên {summary.assessedConcepts} khái niệm đã được đánh giá
          </p>
        </div>
        <div className="rounded-card border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Đã nắm vững</p>
          <p className="mt-1 text-2xl font-bold">{summary.masteredConcepts}</p>
          <p className="text-xs text-muted-foreground">Đã hiểu hoặc đã áp dụng</p>
        </div>
        <div className="rounded-card border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Có nguy cơ quên</p>
          <p className="mt-1 text-2xl font-bold">{summary.decayRiskConcepts}</p>
          <p className="text-xs text-muted-foreground">Cần ôn lại</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-card border border-border bg-card p-4">
          <h3 className="font-semibold">Trạng thái kiến thức đã theo dõi</h3>
          <div className="mt-4 space-y-3">
            {states.map(([state, label]) => {
              const count = stateCounts[state];
              const percent = summary.trackedConcepts
                ? Math.round((count / summary.trackedConcepts) * 100)
                : 0;

              return (
                <div key={state}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{label}</span>
                    <span>{count} ({percent}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-card border border-border bg-card p-4">
          <h3 className="font-semibold">Xu hướng Mastery 7 ngày</h3>
          {trend.every((point) => point.averageMastery === null) ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Chưa có kết quả đánh giá để vẽ xu hướng.
            </p>
          ) : (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(5)} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="averageMastery"
                    name="Mastery trung bình"
                    stroke="#2563eb"
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-card border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Kiến thức yếu cần củng cố</h3>
          <button
            type="button"
            onClick={() => navigate(PATHS.student.mastery)}
            className="text-sm font-medium text-primary"
          >
            Xem Mastery
          </button>
        </div>
        {weakConcepts.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Chưa có khái niệm yếu từ kết quả đánh giá.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {weakConcepts.map((item) => (
              <li key={item.conceptId} className="flex justify-between gap-3 py-2 text-sm">
                <span>{item.name}</span>
                <span className="shrink-0">
                  {item.score}% · {STATE_LABELS[item.learningState]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
