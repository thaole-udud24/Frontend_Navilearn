export interface SubjectOption {
  _id: string;
  name: string;
}

export interface LearningEffectivenessReport {
  summary: {
    goalCompletionRate: number;
    avgMasteryScore: number;
    retention7dRate: number;
  };
  bySubject: {
    subjectId: string;
    subjectName: string;
    avgScore: number;
    learnerCount: number;
  }[];
}

export interface VolumeReport {
  byDay: { date: string; attempts: number; passRate: number }[];
  totalAttempts: number;
  overallPassRate: number;
}

export interface TopMissedQuestion {
  questionId: string;
  questionText: string;
  conceptName: string | null;
  totalWrongCount: number;
  studentCount: number;
}

export type ReportKind = 'learning-effectiveness' | 'volume' | 'top-missed';
