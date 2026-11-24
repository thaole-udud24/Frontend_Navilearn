import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DetailRow } from '@/components/DialogForm';
import type { SubjectDocument } from '@/services/subject/types';
import { ProcessingBadge } from './ProcessingBadge';
import { formatFileSize } from './documentUtils';

interface DocumentDetailDialogProps {
  document: SubjectDocument | null;
  onOpenChange: (open: boolean) => void;
  onDownload: (document: SubjectDocument) => void;
  /** Show the extraction status (hidden from students in the shared library). */
  showProcessing?: boolean;
}

const classificationOf = (doc: SubjectDocument) =>
  [doc.classification.chapter, doc.classification.topic, doc.classification.concept].filter(Boolean).join(' / ');

/** FE-STU-19 / FE-STU-22: document information with a download button. */
export function DocumentDetailDialog({
  document,
  onOpenChange,
  onDownload,
  showProcessing,
}: DocumentDetailDialogProps) {
  return (
    <Dialog open={!!document} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        {document && (
          <>
            <DialogHeader>
              <DialogTitle>{document.name}</DialogTitle>
            </DialogHeader>
            <div>
              <DetailRow label="Mô tả">{document.description || '—'}</DetailRow>
              <DetailRow label="Tệp">
                {document.file.originalName} · {formatFileSize(document.file.size)} · phiên bản {document.version}
              </DetailRow>
              <DetailRow label="Chương / Chủ đề / Khái niệm">{classificationOf(document) || '—'}</DetailRow>
              <DetailRow label="Thẻ">{document.tags.length ? document.tags.join(', ') : '—'}</DetailRow>
              <DetailRow label="Quan trọng">{document.important ? 'Có' : 'Không'}</DetailRow>
              {showProcessing && (
                <DetailRow label="Trạng thái xử lý">
                  <ProcessingBadge status={document.processingStatus} />
                  {document.processingError && <span className="ml-2 text-danger">{document.processingError}</span>}
                </DetailRow>
              )}
              <DetailRow label="Tải lên lúc">{new Date(document.createdAt).toLocaleString('vi-VN')}</DetailRow>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
              <Button onClick={() => onDownload(document)}>
                <Download />
                Tải xuống
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
