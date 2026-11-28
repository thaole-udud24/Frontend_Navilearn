export interface RetentionCollectionStat {
  key: string;
  label: string;
  active: number;
  archived: number;
  total: number;
}

export interface RetentionStats {
  collections: RetentionCollectionStat[];
  totals: { active: number; archived: number };
}

export interface AbandonedAssessment {
  id: string;
  owner: { email: string; fullName: string } | null;
  conceptName: string | null;
  startedAt: string;
}

export interface StaleArchivedRow {
  key: string;
  label: string;
  count: number;
}

export interface StaleRecords {
  cutoffDays: number;
  abandonedAssessments: AbandonedAssessment[];
  staleArchived: StaleArchivedRow[];
}

export interface StudentDataExport {
  exportedAt: string;
  student: { id: string; email: string; fullName: string; memberSince: string };
  mastery: unknown[];
  wrongItems: unknown[];
  assessments: unknown[];
  subjects: unknown[];
}

export interface DataActivityLogEntry {
  id: string;
  action: string;
  actor: { email: string; fullName: string } | null;
  meta: Record<string, unknown>;
  createdAt: string;
}
