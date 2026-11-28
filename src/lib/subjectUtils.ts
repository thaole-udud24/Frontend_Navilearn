import type { StudentSubject } from '@/services/student-subject/types';

/** Safely extracts a string ID from a populated Concept object or raw string ID. */
export function toConceptId(concept: unknown): string | null {
  if (!concept) return null;
  if (typeof concept === 'string') return concept;
  if (typeof concept === 'object' && concept !== null && '_id' in concept) {
    const id = (concept as { _id?: unknown })._id;
    return id ? String(id) : null;
  }
  return null;
}

/** Returns the underlying Concept root ID for catalog subjects, or null for custom-only subjects. */
export function getSubjectId(subject: StudentSubject): string | null {
  return toConceptId(subject.concept);
}

/** Returns a human-readable display name for a StudentSubject entry. */
export function getSubjectLabel(subject: StudentSubject): string {
  if (subject.concept && typeof subject.concept === 'object' && subject.concept.name) {
    return subject.concept.name;
  }
  return subject.customTitle || 'Môn học chưa đặt tên';
}

export function getSubjectDescription(subject: StudentSubject): string | undefined {
  if (subject.concept && typeof subject.concept === 'object' && subject.concept.description) {
    return subject.concept.description;
  }
  return subject.customDescription;
}

export function isCatalogSubject(subject: StudentSubject): boolean {
  return Boolean(getSubjectId(subject));
}
