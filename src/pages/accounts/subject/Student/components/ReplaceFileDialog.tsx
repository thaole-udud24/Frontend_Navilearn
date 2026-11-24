import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { FormDialogFooter, FormDialogTitle } from '@/components/DialogForm';
import type { SubjectDocument } from '@/services/subject';
import { FilePicker } from '../../shared/FilePicker';
import { validateDocumentFile } from '../../shared/documentUtils';

interface ReplaceFileDialogProps {
  document: SubjectDocument | null;
  onOpenChange: (open: boolean) => void;
  submitting?: boolean;
  onSubmit: (file: File) => void;
}

function ReplaceForm({
  document,
  submitting,
  onSubmit,
  onCancel,
}: {
  document: SubjectDocument;
  submitting?: boolean;
  onSubmit: (file: File) => void;
  onCancel: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <DialogHeader>
        <FormDialogTitle icon={RefreshCw}>Thay thế tệp</FormDialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">
        Tệp mới sẽ thay cho <strong>{document.file.originalName}</strong> (phiên bản {document.version}) và tài liệu
        sẽ được trích xuất lại.
      </p>
      <FilePicker
        files={file ? [file] : []}
        error={error}
        onPick={([picked]) => {
          if (!picked) return;
          const problem = validateDocumentFile(picked);
          setError(problem);
          if (!problem) setFile(picked);
        }}
      />
      <FormDialogFooter
        onCancel={onCancel}
        submitLabel="Thay thế"
        submitting={submitting}
        disabled={!file}
        onSubmit={() => file && onSubmit(file)}
      />
    </>
  );
}

/** FE-STU-18: replace a document's file with a new version. */
export function ReplaceFileDialog({ document, onOpenChange, submitting, onSubmit }: ReplaceFileDialogProps) {
  return (
    <Dialog open={!!document} onOpenChange={onOpenChange}>
      <DialogContent>
        {document && (
          <ReplaceForm
            document={document}
            submitting={submitting}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
