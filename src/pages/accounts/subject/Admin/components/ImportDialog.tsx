import { useState } from 'react';
import { FileSpreadsheet, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormDialogTitle, FormField } from '@/components/DialogForm';
import type { ImportManifestRow, ImportReport, Subject } from '@/services/subject';
import { FilePicker } from '../../shared/FilePicker';
import {
  MAX_IMPORT_FILES,
  parseManifestCsv,
  validateDocumentFile,
} from '../../shared/documentUtils';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  importing: boolean;
  onImport: (input: { files: File[]; subjectId: string; manifest: ImportManifestRow[] }) => Promise<ImportReport>;
}

function ImportForm({
  subjects,
  importing,
  onImport,
  onClose,
}: Omit<ImportDialogProps, 'open' | 'onOpenChange'> & { onClose: () => void }) {
  const [subjectId, setSubjectId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<ImportManifestRow[]>([]);
  const [manifestName, setManifestName] = useState('');
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);

  const pickFiles = (picked: File[]) => {
    const invalid = picked.find((f) => validateDocumentFile(f));
    if (invalid) return setFileError(`${invalid.name}: ${validateDocumentFile(invalid)}`);
    if (picked.length > MAX_IMPORT_FILES) return setFileError(`Tối đa ${MAX_IMPORT_FILES} tệp mỗi lần nhập`);
    setFileError(null);
    return setFiles(picked);
  };

  const pickManifest = async (file: File | undefined) => {
    if (!file) return;
    const parsed = parseManifestCsv(await file.text());
    setManifestError(parsed.error);
    setManifest(parsed.error ? [] : parsed.rows);
    setManifestName(parsed.error ? '' : file.name);
  };

  const submit = async () => {
    try {
      setReport(await onImport({ files, subjectId, manifest }));
    } catch {
      // The mutation already showed the error toast.
    }
  };

  return (
    <>
      <DialogHeader>
        <FormDialogTitle icon={Upload}>Nhập tài liệu hàng loạt</FormDialogTitle>
      </DialogHeader>

      {report ? (
        <div className="grid gap-3 text-sm">
          <p>
            Đã nhập <strong>{report.createdCount}</strong> tài liệu
            {report.errorCount > 0 && (
              <>
                , <strong className="text-danger">{report.errorCount}</strong> tệp lỗi
              </>
            )}
            .
          </p>
          {report.errors.length > 0 && (
            <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-control border border-border p-2">
              {report.errors.map((err) => (
                <li key={`${err.row}-${err.file}`}>
                  <span className="font-medium">{err.file}</span>
                  <span className="text-danger">: {err.message}</span>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button onClick={onClose}>Đóng</Button>
          </DialogFooter>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            <FormField label="Môn học mặc định" required>
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
            <FormField label="Tệp tài liệu" required>
              <FilePicker multiple files={files} onPick={pickFiles} error={fileError} />
            </FormField>
            <FormField label="Bảng phân loại (CSV, không bắt buộc)">
              <div className="flex flex-col gap-1 font-normal">
                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-control border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
                  <FileSpreadsheet className="h-4 w-4" />
                  {manifestName || 'Chọn tệp CSV'}
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      void pickManifest(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
                <span className="text-xs text-muted-foreground">
                  Hàng đầu là tiêu đề: <code>file</code> (bắt buộc, trùng tên tệp), <code>name</code>,{' '}
                  <code>description</code>, <code>tags</code>, <code>important</code>, <code>chapter</code>,{' '}
                  <code>topic</code>, <code>concept</code>.
                </span>
                {manifestName && <span className="text-xs">Đã đọc {manifest.length} dòng phân loại.</span>}
                {manifestError && (
                  <span role="alert" className="text-xs text-danger">
                    {manifestError}
                  </span>
                )}
              </div>
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button disabled={!subjectId || files.length === 0 || importing} onClick={() => void submit()}>
              Nhập {files.length > 0 ? `${files.length} tệp` : ''}
            </Button>
          </DialogFooter>
        </>
      )}
    </>
  );
}

/** FE-ADM-22: import several documents at once, optionally with a CSV classification table. */
export function ImportDialog({ open, onOpenChange, ...rest }: ImportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <ImportForm {...rest} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
