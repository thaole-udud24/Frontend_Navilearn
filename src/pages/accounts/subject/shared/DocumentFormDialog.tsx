import { useState } from 'react';
import { Pencil, Upload } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormDialogFooter, FormDialogTitle, FormField } from '@/components/DialogForm';
import type { DocumentMetaInput, Subject, SubjectDocument } from '@/services/subject/types';
import { DocumentMetaFields } from './DocumentMetaFields';
import { FilePicker } from './FilePicker';
import { emptyMeta, metaFromDocument, metaToInput, validateDocumentFile } from './documentUtils';

export interface DocumentFormPayload {
  file: File | null;
  subjectId: string;
  meta: DocumentMetaInput;
}

interface DocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Document being edited; omit to upload a new one. */
  document?: SubjectDocument | null;
  /** When given, the user must pick the target subject (admin uploading to the shared library). */
  subjects?: Subject[];
  submitting?: boolean;
  onSubmit: (payload: DocumentFormPayload) => void;
}

function DocumentForm({
  document,
  subjects,
  submitting,
  onSubmit,
  onCancel,
}: Omit<DocumentFormDialogProps, 'open' | 'onOpenChange'> & { onCancel: () => void }) {
  const editing = !!document;
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState(document?.subject ?? '');
  const [meta, setMeta] = useState(() => (document ? metaFromDocument(document) : emptyMeta()));

  const pick = ([picked]: File[]) => {
    if (!picked) return;
    const problem = validateDocumentFile(picked);
    setFileError(problem);
    if (problem) return;
    setFile(picked);
    // Suggest the file name (without extension) as the document name until the user types one.
    if (!meta.name) setMeta({ ...meta, name: picked.name.replace(/\.[^.]+$/, '') });
  };

  const needsSubject = !editing && !!subjects;
  const ready = editing || (!!file && (!needsSubject || !!subjectId));

  return (
    <>
      <DialogHeader>
        <FormDialogTitle icon={editing ? Pencil : Upload}>
          {editing ? 'Chỉnh sửa tài liệu' : 'Tải lên tài liệu'}
        </FormDialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        {needsSubject && (
          <FormField label="Môn học" required>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn môn học" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
        {!editing && (
          <FormField label="Tệp tài liệu" required>
            <FilePicker files={file ? [file] : []} onPick={pick} error={fileError} />
          </FormField>
        )}
        <DocumentMetaFields values={meta} onChange={setMeta} />
      </div>
      <FormDialogFooter
        onCancel={onCancel}
        submitLabel={editing ? 'Lưu lại' : 'Tải lên'}
        submitting={submitting}
        disabled={!ready}
        onSubmit={() => onSubmit({ file, subjectId, meta: metaToInput(meta) })}
      />
    </>
  );
}

/** Upload a new document or edit the metadata of an existing one (personal and shared). */
export function DocumentFormDialog({ open, onOpenChange, ...rest }: DocumentFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        {/* Mounted only while open, so the fields reset every time the dialog opens. */}
        <DocumentForm {...rest} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
