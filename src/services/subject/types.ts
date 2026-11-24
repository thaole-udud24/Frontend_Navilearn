export type SubjectScope = 'personal' | 'shared';
/** Personal subjects are active/archived; shared catalog subjects are active/inactive. */
export type SubjectStatus = 'active' | 'archived' | 'inactive';
export type ProcessingStatus = 'pending' | 'processed' | 'error';

export interface Subject {
  id: string;
  scope: SubjectScope;
  name: string;
  description: string;
  status: SubjectStatus;
  pinned: boolean;
  order: number;
  /** Id of the shared catalog subject this one was copied from, if any. */
  catalogSubject: string | null;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentClassification {
  chapter: string;
  topic: string;
  concept: string;
}

export interface SubjectDocument {
  id: string;
  scope: SubjectScope;
  subject: string;
  name: string;
  description: string;
  tags: string[];
  important: boolean;
  classification: DocumentClassification;
  file: { originalName: string; mimeType: string; size: number };
  version: number;
  processingStatus: ProcessingStatus;
  processingError: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectInput {
  name: string;
  description?: string;
}

export interface SubjectFilters {
  page?: number;
  limit?: number;
  status?: 'active' | 'archived';
  q?: string;
}

export interface CatalogFilters {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive';
  q?: string;
}

/** Editable document fields. Sent as multipart fields on upload, as JSON on update. */
export interface DocumentMetaInput {
  name?: string;
  description?: string;
  tags?: string[];
  important?: boolean;
  chapter?: string;
  topic?: string;
  concept?: string;
}

export interface DocumentFilters {
  page?: number;
  limit?: number;
  q?: string;
  tag?: string;
  important?: boolean;
  chapter?: string;
  topic?: string;
  concept?: string;
  processingStatus?: ProcessingStatus;
}

export interface SharedDocumentFilters extends DocumentFilters {
  subjectId?: string;
}

export interface ImportRowError {
  row: number;
  file: string;
  message: string;
}

export interface ImportReport {
  createdCount: number;
  createdIds: string[];
  errorCount: number;
  errors: ImportRowError[];
}

/** One line of the classification table sent with a bulk import. */
export interface ImportManifestRow extends DocumentMetaInput {
  file: string;
  subjectId?: string;
}
