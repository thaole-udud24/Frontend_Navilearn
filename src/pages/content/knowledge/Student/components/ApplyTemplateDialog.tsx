import { useState } from 'react';
import { LayoutTemplate } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormDialogFooter, FormDialogTitle, FormField } from '@/components/DialogForm';
import type { KnowledgeTree } from '@/services/knowledge/types';
import { useSampleStructures } from '../hooks/useKnowledgeStructure';

interface ApplyTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: KnowledgeTree['subject'] | null;
  applying?: boolean;
  /** `conceptId` is omitted when the course already has its own sample structure. */
  onApply: (conceptId?: string) => void;
}

function ApplyForm({
  subject,
  applying,
  onApply,
  onCancel,
}: {
  subject: KnowledgeTree['subject'];
  applying?: boolean;
  onApply: (conceptId?: string) => void;
  onCancel: () => void;
}) {
  const ownTemplate = !!subject.conceptId;
  const samples = useSampleStructures(!ownTemplate);
  const [conceptId, setConceptId] = useState('');

  return (
    <>
      <DialogHeader>
        <FormDialogTitle icon={LayoutTemplate}>Áp dụng cấu trúc kiến thức mẫu</FormDialogTitle>
      </DialogHeader>
      {ownTemplate ? (
        <p className="text-sm text-muted-foreground">
          Sao chép cấu trúc mẫu của môn «<strong>{subject.title}</strong>» vào cấu trúc của bạn. Các nút trùng tên
          được giữ nguyên, nội dung bạn đã tự thêm không bị xóa.
        </p>
      ) : (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            Môn «<strong>{subject.title}</strong>» là môn tự tạo. Hãy chọn một cấu trúc mẫu để sao chép vào môn này.
          </p>
          <FormField label="Cấu trúc mẫu" required>
            <Select value={conceptId} onValueChange={setConceptId}>
              <SelectTrigger>
                <SelectValue placeholder={samples.isLoading ? 'Đang tải…' : 'Chọn cấu trúc mẫu'} />
              </SelectTrigger>
              <SelectContent>
                {(samples.data?.data ?? []).map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          {samples.isSuccess && samples.data.data.length === 0 && (
            <p className="text-sm text-muted-foreground">Quản trị viên chưa tạo cấu trúc mẫu nào.</p>
          )}
        </div>
      )}
      <FormDialogFooter
        onCancel={onCancel}
        submitLabel="Áp dụng"
        submitting={applying}
        disabled={!ownTemplate && !conceptId}
        onSubmit={() => onApply(ownTemplate ? undefined : conceptId)}
      />
    </>
  );
}

/** FE-STU-26: copy a sample structure into the student's own course. */
export function ApplyTemplateDialog({ open, onOpenChange, subject, applying, onApply }: ApplyTemplateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {subject && <ApplyForm subject={subject} applying={applying} onApply={onApply} onCancel={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
