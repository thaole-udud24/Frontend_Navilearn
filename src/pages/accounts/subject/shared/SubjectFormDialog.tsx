import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormDialogFooter, FormDialogTitle, FormField } from '@/components/DialogForm';

export interface SubjectInput {
  name: string;
  description?: string;
}

interface SubjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Item being edited (a personal Subject or a root Concept); omit to create. */
  subject?: { name: string; description: string } | null;
  /** Noun used in the title, e.g. "môn học" or "môn học chung". */
  noun?: string;
  submitting?: boolean;
  onSubmit: (input: SubjectInput) => void;
}

function SubjectForm({
  subject,
  noun,
  submitting,
  onCancel,
  onSubmit,
}: Omit<SubjectFormDialogProps, 'open' | 'onOpenChange'> & { onCancel: () => void }) {
  const [name, setName] = useState(subject?.name ?? '');
  const [description, setDescription] = useState(subject?.description ?? '');
  const editing = !!subject;

  return (
    <>
      <DialogHeader>
        <FormDialogTitle icon={editing ? Pencil : Plus}>
          {editing ? `Chỉnh sửa ${noun}` : `Thêm mới ${noun}`}
        </FormDialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        <FormField label="Tên môn học" required>
          <Input
            value={name}
            maxLength={120}
            autoFocus
            placeholder="Ví dụ: Giải tích 1"
            onChange={(e) => setName(e.target.value)}
          />
        </FormField>
        <FormField label="Mô tả">
          <textarea
            className="min-h-24 rounded-control border border-input bg-card p-3 text-sm font-normal"
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
      </div>
      <FormDialogFooter
        onCancel={onCancel}
        submitLabel={editing ? 'Lưu lại' : 'Thêm mới'}
        submitting={submitting}
        disabled={!name.trim()}
        onSubmit={() => onSubmit({ name: name.trim(), description: description.trim() })}
      />
    </>
  );
}

/** Create/edit form shared by the student's personal subjects and the admin's shared catalog. */
export function SubjectFormDialog({
  open,
  onOpenChange,
  noun = 'môn học',
  ...rest
}: SubjectFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Mounted only while open, so the fields reset every time the dialog opens. */}
        <SubjectForm {...rest} noun={noun} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
