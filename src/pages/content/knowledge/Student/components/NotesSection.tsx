import { useState } from 'react';
import { Loader2, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { ConceptNote, KnowledgeNode } from '@/services/knowledge/types';
import { useConceptNotes, useStructureActions } from '../hooks/useKnowledgeStructure';

const TEXTAREA = 'min-h-20 w-full rounded-control border border-input bg-card p-3 text-sm';

/** FE-STU-28/29/30: the student's own notes on one knowledge node (add, edit, delete). */
export function NotesSection({ node }: { node: KnowledgeNode }) {
  const notes = useConceptNotes(node.id);
  const actions = useStructureActions(node.subject);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<ConceptNote | null>(null);
  const [editText, setEditText] = useState('');
  const [deleting, setDeleting] = useState<ConceptNote | null>(null);
  const archived = node.status === 'archived';

  const add = () =>
    actions.addNote.mutate({ nodeId: node.id, content: draft.trim() }, { onSuccess: () => setDraft('') });
  const save = () =>
    editing &&
    actions.editNote.mutate({ id: editing.id, content: editText.trim() }, { onSuccess: () => setEditing(null) });

  return (
    <section aria-labelledby="notes-heading" className="flex flex-col gap-3">
      <h3 id="notes-heading" className="text-sm font-semibold">
        Ghi chú của tôi {notes.data ? `(${notes.data.length})` : ''}
      </h3>

      {!archived && (
        <div className="flex flex-col gap-2">
          <label className="sr-only" htmlFor="new-note">
            Ghi chú mới
          </label>
          <textarea
            id="new-note"
            className={TEXTAREA}
            maxLength={5000}
            placeholder="Viết ghi chú cho khái niệm này…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div>
            <Button size="sm" disabled={!draft.trim() || actions.addNote.isPending} onClick={add}>
              {actions.addNote.isPending && <Loader2 className="animate-spin" />}
              Thêm ghi chú
            </Button>
          </div>
        </div>
      )}

      {notes.isLoading && <p className="text-sm text-muted-foreground">Đang tải ghi chú…</p>}
      {notes.isError && <p className="text-sm text-danger">Không tải được ghi chú.</p>}
      {notes.isSuccess && notes.data.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có ghi chú nào.</p>
      )}

      <ul className="flex flex-col gap-2">
        {notes.data?.map((note) => (
          <li key={note.id} className="rounded-control border border-border p-3 text-sm">
            {editing?.id === note.id ? (
              <div className="flex flex-col gap-2">
                <textarea
                  className={TEXTAREA}
                  maxLength={5000}
                  value={editText}
                  aria-label="Sửa ghi chú"
                  onChange={(e) => setEditText(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" disabled={!editText.trim() || actions.editNote.isPending} onClick={save}>
                    Lưu
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                    Hủy
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="whitespace-pre-wrap break-words">{note.content}</p>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{new Date(note.updatedAt).toLocaleString('vi-VN')}</span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      title="Sửa ghi chú"
                      aria-label="Sửa ghi chú"
                      className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
                      onClick={() => {
                        setEditing(note);
                        setEditText(note.content);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Xóa ghi chú"
                      aria-label="Xóa ghi chú"
                      className="flex h-7 w-7 items-center justify-center rounded text-danger hover:bg-danger/10"
                      onClick={() => setDeleting(note)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </span>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Xóa ghi chú?"
        description="Ghi chú này sẽ bị xóa và không thể khôi phục."
        confirmLabel="Xóa ghi chú"
        onConfirm={() => deleting && actions.removeNote.mutate(deleting.id)}
      />
    </section>
  );
}
