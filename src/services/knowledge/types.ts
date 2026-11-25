import type { RecordSource } from '@/types/api.d';

export type ConceptStatus = 'active' | 'archived';

export interface ConceptRef {
  _id: string;
  name: string;
}

export interface Concept {
  _id: string;
  owner: string;
  name: string;
  description: string;
  order: number;
  status: ConceptStatus;
  source?: RecordSource;
  parentConcept?: ConceptRef | string | null;
  prerequisites?: ConceptRef[] | string[];
  related?: ConceptRef[] | string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConceptFilters {
  page?: number;
  limit?: number;
  status?: ConceptStatus;
  /** 'null' = top-level concepts only; an id = direct children of that concept. */
  parentConcept?: string | 'null';
}

export interface CreateConceptInput {
  name: string;
  description?: string;
  order?: number;
  source?: RecordSource;
  parentConcept?: string | null;
  prerequisites?: string[];
  related?: string[];
}

export type UpdateConceptInput = Partial<CreateConceptInput>;

export interface ImportRowResult {
  createdCount: number;
  createdIds: string[];
  errorCount: number;
  errors: { row: number; message: string }[];
}
