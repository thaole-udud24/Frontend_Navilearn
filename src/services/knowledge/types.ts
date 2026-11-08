export type ConceptStatus = 'active' | 'archived';

export interface Concept {
  _id: string;
  name: string;
  description: string;
  order: number;
  status: ConceptStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ConceptFilters {
  page?: number;
  limit?: number;
  status?: ConceptStatus;
}

export interface CreateConceptInput {
  name: string;
  description?: string;
  order?: number;
}
