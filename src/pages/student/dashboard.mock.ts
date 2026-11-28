import type { MasteryDashboard } from '@/services/mastery/dashboard.api';
import type { MasteryReportEntry } from '@/services/mastery/types';
import type { Goal, Plan } from '@/services/planning/types';
import type { NextBestAction } from '@/services/adaptive/types';

export const dashboardMockEnabled =
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get('mock') === '1';

function dateAt(dayOffset: number, hour = 9): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export const mockMasteryDashboard: MasteryDashboard = {
  summary: {
    trackedConcepts: 9,
    assessedConcepts: 8,
    averageMastery: 67,
    masteredConcepts: 3,
    decayRiskConcepts: 1,
  },
  stateCounts: {
    LEARNING: 2,
    PRACTICING: 3,
    UNDERSTOOD: 2,
    APPLIED: 1,
    DECAY_RISK: 1,
  },
  trend: [48, 51, 53, 57, 60, 63, 67].map((score, index) => ({
    date: dateAt(index - 6).slice(0, 10),
    averageMastery: score,
  })),
  weakConcepts: [
    { conceptId: 'mock-c1', name: 'Đạo hàm hàm hợp', score: 42, learningState: 'PRACTICING' },
    { conceptId: 'mock-c2', name: 'Tích phân từng phần', score: 55, learningState: 'LEARNING' },
    { conceptId: 'mock-c3', name: 'Giới hạn dãy số', score: 68, learningState: 'DECAY_RISK' },
  ],
};

export const mockReportEntries: MasteryReportEntry[] = [
  {
    concept: { _id: 'mock-c1', name: 'Đạo hàm hàm hợp' },
    score: 42,
    level: 'developing',
    attemptsCount: 3,
    history: [
      { score: 35, level: 'novice', reason: 'initial_grading', at: dateAt(-4) },
      { score: 42, level: 'developing', reason: 'regrade', at: dateAt(-1) },
    ],
  },
  {
    concept: { _id: 'mock-c2', name: 'Tích phân từng phần' },
    score: 55,
    level: 'developing',
    attemptsCount: 2,
    history: [
      { score: 55, level: 'developing', reason: 'initial_grading', at: dateAt(-2) },
      { score: 55, level: 'developing', reason: 'content_completed', at: dateAt(-1) },
    ],
  },
];

export const mockPlan: Plan = {
  _id: 'mock-plan',
  owner: 'mock-student',
  title: 'Kế hoạch ôn tập Giải tích',
  status: 'active',
  goal: 'mock-goal-1',
  replaces: null,
  createdAt: dateAt(-5),
  updatedAt: dateAt(-1),
  sessions: [
    {
      _id: 'mock-session-1',
      concept: 'mock-c1',
      title: 'Ôn đạo hàm',
      startAt: dateAt(-1, 8),
      durationMin: 45,
      status: 'done',
    },
    {
      _id: 'mock-session-2',
      concept: 'mock-c2',
      title: 'Luyện tích phân',
      startAt: dateAt(0, 15),
      durationMin: 60,
      status: 'planned',
    },
    {
      _id: 'mock-session-3',
      concept: 'mock-c3',
      title: 'Ôn giới hạn',
      startAt: dateAt(2, 9),
      durationMin: 45,
      status: 'planned',
    },
  ],
};

export const mockGoals: Goal[] = [
  {
    _id: 'mock-goal-1',
    owner: 'mock-student',
    concept: { _id: 'mock-c2', name: 'Tích phân từng phần' },
    title: 'Đạt Mastery 75% môn Giải tích',
    deadline: dateAt(3, 18),
    importance: 4,
    targetScore: 75,
    createdAt: dateAt(-4),
    updatedAt: dateAt(-4),
  },
];

export const mockNextBestAction: NextBestAction = {
  concept: { id: 'mock-c1', name: 'Đạo hàm hàm hợp' },
  priority: 0.9,
  reason: 'Mastery đang thấp và nội dung này cần cho buổi luyện tập tiếp theo.',
};
