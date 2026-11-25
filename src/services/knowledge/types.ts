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
  /** Case-insensitive search on the name. */
  q?: string;
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

// ---------- student: personal knowledge structure ----------
export type NodeLevel = 'chapter' | 'topic' | 'concept';
export type NodeSource = 'manual' | 'template' | 'ai';

export interface KnowledgeNode {
  id: string;
  subject: string;
  parentNode: string | null;
  level: NodeLevel;
  name: string;
  description: string;
  order: number;
  status: ConceptStatus;
  examFocus: boolean;
  prerequisites: string[];
  source: NodeSource;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeTree {
  subject: { id: string; title: string; conceptId: string | null };
  nodes: KnowledgeNode[];
}

export interface TreeFilters {
  includeArchived?: boolean;
  examFocus?: boolean;
}

export interface SearchResult extends KnowledgeNode {
  /** Names of the ancestors, outermost first. */
  path: string[];
}

export interface CreateNodeInput {
  name: string;
  description?: string;
  parentNode?: string | null;
  prerequisites?: string[];
  examFocus?: boolean;
  order?: number;
}

export type UpdateNodeInput = Partial<CreateNodeInput>;

export interface ApplyTemplateResult {
  created: number;
  reused: number;
  skipped: number;
  prerequisitesCopied: number;
  prerequisitesSkippedForCycle: boolean;
}

export interface ConceptNote {
  id: string;
  personalConcept: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type ProposalStatus = 'pending' | 'confirmed' | 'rejected';

export interface ProposalNode {
  ref: string;
  parentRef: string | null;
  level: NodeLevel;
  name: string;
  description: string;
}

export interface KnowledgeProposal {
  id: string;
  subject: string;
  summary: string;
  status: ProposalStatus;
  nodes: ProposalNode[];
  createdNodeCount: number;
  decidedAt: string | null;
  createdAt: string;
}

// ---------- admin: sample structures ----------
export interface StructureIssue {
  code: string;
  message: string;
  nodeId?: string;
}

export interface StructureReport {
  rootId: string;
  valid: boolean;
  errors: StructureIssue[];
  warnings: StructureIssue[];
  stats: { chapters: number; topics: number; concepts: number; total: number };
}

export interface CopyStructureResult {
  rootId: string;
  name: string;
  nodeCount: number;
  relationsCopied: number;
  relationsDropped: number;
}

export interface StructureStatusResult {
  rootId: string;
  status: ConceptStatus;
  changedCount: number;
}
