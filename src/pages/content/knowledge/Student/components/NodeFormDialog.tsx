import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormDialogFooter, FormDialogTitle, FormField } from '@/components/DialogForm';
import type { KnowledgeNode } from '@/services/knowledge/types';
import { CHILD_LEVEL, LEVEL_LABEL } from '../treeUtils';

export interface NodeFormValues {
  name: string;
  description: string;
  examFocus: boolean;
}

interface NodeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Node being edited. Omit to create a child of `parent`. */
  node?: KnowledgeNode | null;
  /** Parent of the node to create (null = a new chapter). */
  parent?: KnowledgeNode | null;
  submitting?: boolean;
  onSubmit: (values: NodeFormValues) => void;
}

function NodeForm({
  node,
  parent,
  submitting,
  onSubmit,
  onCancel,
}: Omit<NodeFormDialogProps, 'open' | 'onOpenChange'> & { onCancel: () => void }) {
  const editing = !!node;
  const level = editing ? node.level : parent ? CHILD_LEVEL[parent.level] : 'chapter';
  const label = level ? LEVEL_LABEL[level] : 'nút';
  const [name, setName] = useState(node?.name ?? '');
  const [description, setDescription] = useState(node?.description ?? '');
  const [examFocus, setExamFocus] = useState(node?.examFocus ?? false);

  return (
    <>
      <DialogHeader>
        <FormDialogTitle icon={editing ? Pencil : Plus}>
          {editing ? `Chỉnh sửa ${label.toLowerCase()}` : `Thêm ${label.toLowerCase()}`}
        </FormDialogTitle>
      </DialogHeader>
      {!editing && parent && (
        <p className="text-sm text-muted-foreground">
          Thêm vào «<strong>{parent.name}</strong>».
        </p>
      )}
      <div className="grid gap-4">
        <FormField label={`Tên ${label.toLowerCase()}`} required>
          <Input value={name} maxLength={200} autoFocus onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Mô tả">
          <textarea
            className="min-h-24 rounded-control border border-input bg-card p-3 text-sm font-normal"
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
        <label className="flex items-center gap-2 text-sm font-medium">
          <Checkbox checked={examFocus} onCheckedChange={(checked) => setExamFocus(checked === true)} />
          Đánh dấu trọng tâm kỳ thi
        </label>
      </div>
      <FormDialogFooter
        onCancel={onCancel}
        submitLabel={editing ? 'Lưu lại' : 'Thêm mới'}
        submitting={submitting}
        disabled={!name.trim()}
        onSubmit={() => onSubmit({ name: name.trim(), description: description.trim(), examFocus })}
      />
    </>
  );
}

/** FE-STU-24 (add chapter/topic/concept) and FE-STU-25 (edit a node). */
export function NodeFormDialog({ open, onOpenChange, ...rest }: NodeFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {/* Mounted only while open, so the fields reset every time the dialog opens. */}
        <NodeForm {...rest} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
