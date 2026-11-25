import { useState } from 'react';
import { Link2, Search } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormDialogFooter, FormDialogTitle } from '@/components/DialogForm';
import type { KnowledgeNode } from '@/services/knowledge/types';
import { pathOf, transitiveDependents } from '../treeUtils';

interface PrerequisiteDialogProps {
  /** The concept whose prerequisites are being set. */
  node: KnowledgeNode | null;
  /** Every node of the course (used to list candidates and their location). */
  nodes: KnowledgeNode[];
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (prerequisiteIds: string[]) => void;
}

function PrerequisiteForm({
  node,
  nodes,
  submitting,
  onSave,
  onCancel,
}: {
  node: KnowledgeNode;
  nodes: KnowledgeNode[];
  submitting?: boolean;
  onSave: (ids: string[]) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(node.prerequisites));
  const [search, setSearch] = useState('');
  // A concept that already depends on this one cannot also be its prerequisite (it would form a loop).
  const blocked = transitiveDependents(node.id, nodes);
  const candidates = nodes
    .filter((n) => n.level === 'concept' && n.status === 'active' && n.id !== node.id)
    .filter((n) => n.name.toLowerCase().includes(search.trim().toLowerCase()));

  const toggle = (id: string, checked: boolean) =>
    setSelected((old) => {
      const next = new Set(old);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <>
      <DialogHeader>
        <FormDialogTitle icon={Link2}>Thiết lập quan hệ tiên quyết</FormDialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">
        Chọn các khái niệm cần học trước «<strong>{node.name}</strong>».
      </p>
      <label className="relative block">
        <span className="sr-only">Tìm khái niệm</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" value={search} placeholder="Tìm khái niệm…" onChange={(e) => setSearch(e.target.value)} />
      </label>
      <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
        {candidates.length === 0 && <li className="py-4 text-center text-sm text-muted-foreground">Không có khái niệm phù hợp.</li>}
        {candidates.map((candidate) => {
          const disabled = blocked.has(candidate.id);
          return (
            <li key={candidate.id}>
              <label
                className={`flex items-start gap-2 rounded-control px-2 py-1.5 text-sm ${disabled ? 'opacity-50' : 'cursor-pointer hover:bg-muted'}`}
              >
                <Checkbox
                  className="mt-0.5"
                  disabled={disabled}
                  checked={selected.has(candidate.id)}
                  onCheckedChange={(checked) => toggle(candidate.id, checked === true)}
                />
                <span className="min-w-0">
                  <span className="block font-medium">{candidate.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {pathOf(candidate, nodes).join(' › ') || '—'}
                    {disabled && ' · đang phụ thuộc vào khái niệm này'}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <FormDialogFooter
        onCancel={onCancel}
        submitLabel={`Lưu (${selected.size})`}
        submitting={submitting}
        onSubmit={() => onSave([...selected])}
      />
    </>
  );
}

/** FE-STU-32: choose the prerequisites of a concept. */
export function PrerequisiteDialog({ node, nodes, submitting, onOpenChange, onSave }: PrerequisiteDialogProps) {
  return (
    <Dialog open={!!node} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {node && (
          <PrerequisiteForm
            node={node}
            nodes={nodes}
            submitting={submitting}
            onSave={onSave}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
