import type { DocumentMetaInput, ImportManifestRow, SubjectDocument } from '@/services/subject/types';

export const DOCUMENT_ACCEPT =
  '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024; // BR-43: 20 MB per file
export const MAX_DOCUMENTS_PER_SUBJECT = 30; // BR-43
export const MAX_IMPORT_FILES = 20;

const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Client-side pre-check so the user gets feedback before uploading; the backend still enforces it. */
export function validateDocumentFile(file: { name: string; size: number }): string | null {
  const lower = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))) return 'Chỉ nhận tệp PDF hoặc DOCX';
  if (file.size > MAX_DOCUMENT_BYTES) return 'Tệp tối đa 20 MB';
  if (file.size === 0) return 'Tệp rỗng';
  return null;
}

/** "a, b; c" -> ["a","b","c"] (deduplicated, empty entries dropped). */
export function parseTags(text: string): string[] {
  return [...new Set(text.split(/[,;]/).map((tag) => tag.trim()).filter(Boolean))];
}

// ---- document meta form state ----
export interface DocumentMetaValues {
  name: string;
  description: string;
  tagsText: string;
  important: boolean;
  chapter: string;
  topic: string;
  concept: string;
}

export const emptyMeta = (): DocumentMetaValues => ({
  name: '',
  description: '',
  tagsText: '',
  important: false,
  chapter: '',
  topic: '',
  concept: '',
});

export const metaFromDocument = (doc: SubjectDocument): DocumentMetaValues => ({
  name: doc.name,
  description: doc.description,
  tagsText: doc.tags.join(', '),
  important: doc.important,
  chapter: doc.classification.chapter,
  topic: doc.classification.topic,
  concept: doc.classification.concept,
});

export function metaToInput(values: DocumentMetaValues): DocumentMetaInput {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    tags: parseTags(values.tagsText),
    important: values.important,
    chapter: values.chapter.trim(),
    topic: values.topic.trim(),
    concept: values.concept.trim(),
  };
}

// ---- classification table (CSV) for bulk import ----

/** Minimal RFC-4180 reader: quoted cells, "" escapes, CRLF/LF, BOM. Blank lines are skipped. */
export function parseCsv(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  const endRow = () => {
    row.push(cell);
    cell = '';
    if (row.some((c) => c.trim() !== '')) rows.push(row);
    row = [];
  };

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      endRow();
    } else cell += ch;
  }
  endRow();
  return rows;
}

const TRUE_VALUES = ['true', '1', 'x', 'yes', 'có', 'co'];

export interface ManifestParseResult {
  rows: ImportManifestRow[];
  error: string | null;
}

/** Header row (case-insensitive): file (required), name, description, tags, important, chapter, topic, concept. */
export function parseManifestCsv(text: string): ManifestParseResult {
  const table = parseCsv(text);
  if (table.length === 0) return { rows: [], error: 'Bảng phân loại trống' };
  const header = table[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  if (col('file') === -1) return { rows: [], error: 'Bảng phân loại cần có cột "file" (tên tệp)' };

  const rows: ImportManifestRow[] = [];
  table.slice(1).forEach((cells) => {
    const get = (name: string) => (col(name) === -1 ? '' : (cells[col(name)] ?? '').trim());
    const file = get('file');
    if (!file) return;
    const row: ImportManifestRow = { file };
    (['name', 'description', 'chapter', 'topic', 'concept'] as const).forEach((key) => {
      if (get(key)) row[key] = get(key);
    });
    if (get('tags')) row.tags = parseTags(get('tags'));
    if (get('important')) row.important = TRUE_VALUES.includes(get('important').toLowerCase());
    rows.push(row);
  });
  return { rows, error: null };
}
