import type { ReactNode } from 'react';
import { Star } from 'lucide-react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { SubjectDocument } from '@/services/subject/types';
import { ProcessingBadge } from './ProcessingBadge';
import { formatFileSize } from './documentUtils';

export interface DocumentAction {
  key: string;
  label: string;
  icon: ReactNode;
  danger?: boolean;
  onSelect: (document: SubjectDocument) => void;
}

interface DocumentTableProps {
  documents: SubjectDocument[];
  actions: DocumentAction[];
  showProcessing?: boolean;
  /** Adds a "Môn học" column, e.g. in the shared library. */
  subjectName?: (document: SubjectDocument) => string;
  onOpen: (document: SubjectDocument) => void;
}

const ACTION_BASE =
  'flex h-8 w-8 items-center justify-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4';
const ACTION_NORMAL = `${ACTION_BASE} text-muted-foreground hover:bg-muted hover:text-foreground`;
const ACTION_DANGER = `${ACTION_BASE} text-danger hover:bg-danger/10`;

const classificationOf = (doc: SubjectDocument) =>
  [doc.classification.chapter, doc.classification.topic, doc.classification.concept].filter(Boolean).join(' / ');

/** Presentational list of documents with a row of icon actions. */
export function DocumentTable({ documents, actions, showProcessing, subjectName, onOpen }: DocumentTableProps) {
  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tài liệu</TableHead>
            {subjectName && <TableHead>Môn học</TableHead>}
            <TableHead>Phân loại</TableHead>
            <TableHead>Tệp</TableHead>
            {showProcessing && <TableHead>Trạng thái</TableHead>}
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="max-w-xs">
                <button
                  type="button"
                  onClick={() => onOpen(doc)}
                  className="flex items-center gap-1.5 text-left font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {doc.important && (
                    <Star className="h-4 w-4 shrink-0 fill-warning text-warning" aria-label="Quan trọng" />
                  )}
                  <span className="truncate">{doc.name}</span>
                </button>
                {doc.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {doc.tags.map((tag) => (
                      <span key={tag} className="rounded-badge bg-primary-soft px-2 py-0.5 text-xs text-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </TableCell>
              {subjectName && <TableCell>{subjectName(doc)}</TableCell>}
              <TableCell className="text-sm text-muted-foreground">{classificationOf(doc) || '—'}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                <span className="block max-w-48 truncate" title={doc.file.originalName}>
                  {doc.file.originalName}
                </span>
                {formatFileSize(doc.file.size)} · v{doc.version}
              </TableCell>
              {showProcessing && (
                <TableCell>
                  <ProcessingBadge status={doc.processingStatus} />
                </TableCell>
              )}
              <TableCell>
                <div className="flex justify-end gap-1">
                  {actions.map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      title={action.label}
                      aria-label={`${action.label}: ${doc.name}`}
                      onClick={() => action.onSelect(doc)}
                      className={action.danger ? ACTION_DANGER : ACTION_NORMAL}
                    >
                      {action.icon}
                    </button>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
