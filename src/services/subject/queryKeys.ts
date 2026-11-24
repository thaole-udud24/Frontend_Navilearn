import type { CatalogFilters, DocumentFilters, SharedDocumentFilters, SubjectFilters } from './types';

export const subjectKeys = {
  all: ['subjects'] as const,
  list: (filters: SubjectFilters) => [...subjectKeys.all, 'list', filters] as const,
  detail: (id: string) => [...subjectKeys.all, 'detail', id] as const,
  documents: (id: string, filters: DocumentFilters) => [...subjectKeys.all, id, 'documents', filters] as const,
  documentsOf: (id: string) => [...subjectKeys.all, id, 'documents'] as const,
  uploads: (id: string, filters: DocumentFilters) => [...subjectKeys.all, id, 'uploads', filters] as const,
};

export const catalogKeys = {
  all: ['subjectCatalog'] as const,
  list: (filters: CatalogFilters) => [...catalogKeys.all, 'list', filters] as const,
};

export const sharedDocumentKeys = {
  all: ['sharedDocuments'] as const,
  list: (filters: SharedDocumentFilters) => [...sharedDocumentKeys.all, 'list', filters] as const,
};
