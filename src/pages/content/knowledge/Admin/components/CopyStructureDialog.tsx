import { useState } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormDialogFooter, FormDialogTitle, FormField } from '@/components/DialogForm';
import { toApiError } from '@/services/apiError';
import { copyStructure, type Concept } from '@/services/knowledge';

interface CopyStructureDialogProps {
  /** Top-level concept (subject) whose structure is copied. */
  concept: Concept | null;
  onOpenChange: (open: boolean) => void;
  onCopied: () => void;
}

function CopyForm({
  concept,
  onCopied,
  onCancel,
}: {
  concept: Concept;
  onCopied: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(`${concept.name} (bản sao)`);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const result = await copyStructure(concept._id, name.trim());
      const dropped = result.relationsDropped > 0 ? `, bỏ ${result.relationsDropped} quan hệ trỏ ra ngoài` : '';
      toast.success(`Đã sao chép ${result.nodeCount} nút, giữ ${result.relationsCopied} quan hệ${dropped}`);
      onCopied();
      onCancel();
    } catch (error) {
      toast.error(toApiError(error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <FormDialogTitle icon={Copy}>Sao chép cấu trúc mẫu</FormDialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">
        Tạo môn học gốc mới có cùng chương, chủ đề, khái niệm với «<strong>{concept.name}</strong>». Chỉ các nút đang sử
        dụng được sao chép; quan hệ tiên quyết chỉ được giữ giữa các nút trong cấu trúc này.
      </p>
      <FormField label="Tên môn học mới" required>
        <Input value={name} maxLength={200} autoFocus onChange={(e) => setName(e.target.value)} />
      </FormField>
      <FormDialogFooter
        onCancel={onCancel}
        submitLabel="Sao chép"
        submitting={saving}
        disabled={!name.trim()}
        onSubmit={() => void submit()}
      />
    </>
  );
}

/** FE-ADM-26: copy a sample structure into a new subject. */
export function CopyStructureDialog({ concept, onOpenChange, onCopied }: CopyStructureDialogProps) {
  return (
    <Dialog open={!!concept} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {concept && <CopyForm concept={concept} onCopied={onCopied} onCancel={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
