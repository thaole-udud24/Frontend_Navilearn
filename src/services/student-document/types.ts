export const DOCUMENT_ROLES = [
  'SYLLABUS',
  'TEXTBOOK',
  'SLIDES',
  'PAST_EXAM',
  'EXERCISES',
  'SUPPLEMENT',
  'ANSWER_KEY',
] as const;

export type DocumentRole = (typeof DOCUMENT_ROLES)[number];

export type ProcessingStatus = 'UPLOADED' | 'EXTRACTING' | 'READY' | 'FAILED_NO_TEXT';

export interface StudentDocument {
  _id: string;
  owner: string;
  title: string;
  documentRole: DocumentRole;
  fileUrl: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  description?: string;
  tags: string[];
  status: 'active' | 'removed';
  /** Subject tag (BR-20) — nullable, populated to `{_id, name}` by the list/get endpoints. */
  concept?: { _id: string; name: string } | string | null;
  processingStatus?: ProcessingStatus;
  extractedSummary?: string;
  detectedTopics?: string[];
  suggestedConcepts?: Array<{ _id: string; name: string } | string>;
  analyzedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentDocumentFilters {
  page?: number;
  limit?: number;
  documentRole?: DocumentRole;
  concept?: string;
  subjectId?: string;
}

export interface UploadStudentDocumentInput {
  file: File;
  title: string;
  documentRole?: DocumentRole;
  description?: string;
  tags?: string[];
  concept?: string;
}

export interface UpdateStudentDocumentInput {
  title?: string;
  documentRole?: DocumentRole;
  description?: string;
  tags?: string[];
  /** '' clears the subject tag — the validation layer treats '' the same as null (see student-document.validation.js). */
  concept?: string;
}
