import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, Plus, Search, Sparkles, TreePine } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';
import { PATHS } from '@/routes/paths';
import type { KnowledgeNode } from '@/services/knowledge/types';
import type { StudentSubject } from '@/services/student-subject';
import { ApplyTemplateDialog } from './components/ApplyTemplateDialog';
import { NodeDetailPanel } from './components/NodeDetailPanel';
import { NodeFormDialog } from './components/NodeFormDialog';
import { NodeTree } from './components/NodeTree';
import { PrerequisiteDialog } from './components/PrerequisiteDialog';
import { ProposalDialog } from './components/ProposalDialog';
import {
  useKnowledgeSearch,
  useKnowledgeTree,
  useMySubjects,
  useStructureActions,
} from './hooks/useKnowledgeStructure';
import { LEVEL_LABEL, buildTree } from './treeUtils';

const subjectLabel = (s: StudentSubject) =>
  s.customTitle || (typeof s.concept === 'object' && s.concept ? s.concept.name : 'Môn học');

/** FE-STU-23..33: the student's own knowledge structure for one course. */
export default function StudentKnowledgeStructurePage({
  embeddedSubjectId,
}: {
  embeddedSubjectId?: string | null;
} = {}) {
  const navigate = useNavigate();
  const subjects = useMySubjects();
  const [subjectId, setSubjectId] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [examFocusOnly, setExamFocusOnly] = useState(false);
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim(), 300);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [formParent, setFormParent] = useState<KnowledgeNode | null | undefined>(undefined);
  const [editing, setEditing] = useState<KnowledgeNode | null>(null);
  const [prereqNode, setPrereqNode] = useState<KnowledgeNode | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);

  const courses = useMemo(() => subjects.data?.data ?? [], [subjects.data]);
  // Sync with embeddedSubjectId (concept root ID) from KnowledgeMap's GlobalSubjectFilter when embedded.
  useEffect(() => {
    if (courses.length === 0) return;
    if (embeddedSubjectId) {
      const matched = courses.find((s) => {
        const cid = typeof s.concept === 'string' ? s.concept : s.concept?._id;
        return cid === embeddedSubjectId;
      });
      if (matched && matched._id !== subjectId) {
        setSubjectId(matched._id);
        setSelectedId(null);
        setSearch('');
        return;
      }
    }
    if (!subjectId) setSubjectId(courses[0]._id);
  }, [courses, subjectId, embeddedSubjectId]);

  const tree = useKnowledgeTree(subjectId, { includeArchived, examFocus: examFocusOnly || undefined });
  const results = useKnowledgeSearch(subjectId, q);
  const actions = useStructureActions(subjectId);

  // The prerequisite picker needs every node, regardless of the tree filters.
  const everything = useKnowledgeTree(subjectId, { includeArchived: true });
  const allNodes = useMemo(() => everything.data?.nodes ?? [], [everything.data]);
  const nodes = useMemo(() => tree.data?.nodes ?? [], [tree.data]);
  const roots = useMemo(() => buildTree(nodes), [nodes]);
  const selected = allNodes.find((n) => n.id === selectedId) ?? null;

  const changeSubject = (id: string) => {
    setSubjectId(id);
    setSelectedId(null);
    setSearch('');
  };

  const submitForm = (values: { name: string; description: string; examFocus: boolean }) => {
    if (editing) {
      actions.updateNode.mutate({ id: editing.id, input: values }, { onSuccess: () => setEditing(null) });
      return;
    }
    actions.createNode.mutate(
      { ...values, parentNode: formParent ? formParent.id : null },
      {
        onSuccess: (node) => {
          setFormParent(undefined);
          setSelectedId(node.id);
        },
      },
    );
  };

  const applyTemplate = (conceptId?: string) =>
    actions.applyTemplate.mutate(conceptId, {
      onSuccess: (result) => {
        setTemplateOpen(false);
        toast.success(
          `Đã thêm ${result.created} nút, giữ nguyên ${result.reused} nút trùng tên` +
            (result.skipped > 0 ? `, bỏ qua ${result.skipped} nút quá sâu` : ''),
        );
      },
    });

  if (subjects.isLoading) return <Skeleton className="mx-auto h-64 max-w-6xl rounded-card" />;
  if (subjects.isError) return <p className="text-sm text-danger">Không tải được danh sách môn học.</p>;
  if (courses.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 py-16 text-center">
        <TreePine className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-lg font-bold">Cấu trúc kiến thức</h1>
        <p className="text-sm text-muted-foreground">
          Bạn chưa có môn học nào. Hãy thêm môn học ở mục «Khoá học của tôi» rồi quay lại đây.
        </p>
      </div>
    );
  }

  const searching = q.length > 0;
  const empty = tree.isSuccess && nodes.length === 0;

  const embedded = embeddedSubjectId !== undefined;

  return (
    <div className="flex flex-col gap-4">
      {!embedded && (
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-xl font-bold text-foreground">Cấu trúc kiến thức</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Chương, chủ đề và khái niệm của từng môn học, kèm ghi chú và quan hệ tiên quyết của riêng bạn.
            </p>
          </div>
          <Select value={subjectId} onValueChange={changeSubject}>
            <SelectTrigger className="w-full lg:w-72" aria-label="Chọn môn học">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {courses.map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {subjectLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Toolbar card matching Ảnh 2 */}
      <div className="flex flex-col gap-3 rounded-card border border-border bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-4">
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Tìm khái niệm</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={search} placeholder="Tìm khái niệm.." onChange={(e) => setSearch(e.target.value)} />
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <Checkbox checked={examFocusOnly} onCheckedChange={(c) => setExamFocusOnly(c === true)} />
            Chỉ trọng tâm kỳ thi
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <Checkbox checked={includeArchived} onCheckedChange={(c) => setIncludeArchived(c === true)} />
            Hiện nút đã ngừng
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setTemplateOpen(true)}>
            <LayoutTemplate className="h-4 w-4" />
            Áp dụng cấu trúc mẫu
          </Button>
          <Button variant="outline" size="sm" onClick={() => setProposalOpen(true)}>
            <Sparkles className="h-4 w-4" />
            Đề xuất từ AI
          </Button>
          <Button size="sm" onClick={() => setFormParent(null)}>
            <Plus className="h-4 w-4" />
            Thêm chương
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <section aria-label="Cây kiến thức" className="rounded-card border border-border bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between border-b border-border/70 pb-2.5">
            <h2 className="text-sm font-bold text-foreground">Danh mục chương</h2>
            <span className="text-xs text-muted-foreground">
              {roots.length} chương · {nodes.length} khái niệm
            </span>
          </div>
          {tree.isLoading && <Skeleton className="h-48" />}
          {tree.isError && (
            <div className="flex items-center gap-3 text-sm text-danger">
              Không tải được cấu trúc.
              <Button variant="outline" size="sm" onClick={() => void tree.refetch()}>
                Thử lại
              </Button>
            </div>
          )}
          {empty && !searching && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <TreePine className="h-9 w-9 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {examFocusOnly
                  ? 'Chưa có nút nào được đánh dấu trọng tâm kỳ thi.'
                  : 'Môn học này chưa có cấu trúc kiến thức. Hãy áp dụng cấu trúc mẫu hoặc tự thêm chương.'}
              </p>
            </div>
          )}
          {searching ? (
            <ul className="flex flex-col gap-1">
              {results.isLoading && <li className="text-sm text-muted-foreground">Đang tìm…</li>}
              {results.isSuccess && results.data.length === 0 && (
                <li className="py-6 text-center text-sm text-muted-foreground">Không tìm thấy khái niệm phù hợp.</li>
              )}
              {results.data?.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className="w-full rounded-control px-3 py-2 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="font-medium">{r.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{LEVEL_LABEL[r.level]}</span>
                    {r.path.length > 0 && <span className="block text-xs text-muted-foreground">{r.path.join(' › ')}</span>}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            roots.length > 0 && <NodeTree roots={roots} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </section>

        <section aria-label="Chi tiết" className="rounded-card border border-border bg-card p-5 shadow-card">
          {selected ? (
            <NodeDetailPanel
              key={selected.id}
              node={selected}
              nodes={allNodes}
              onSelect={setSelectedId}
              onAddChild={setFormParent}
              onEdit={setEditing}
              onEditPrerequisites={setPrereqNode}
              onShowGraph={() => {
                const conceptId = tree.data?.subject.conceptId;
                navigate(conceptId ? `${PATHS.student.knowledgeMap}?subject=${conceptId}` : PATHS.student.knowledgeMap);
              }}
            />
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Chọn một chương, chủ đề hoặc khái niệm để xem chi tiết, ghi chú và quan hệ tiên quyết.
            </p>
          )}
        </section>
      </div>

      <NodeFormDialog
        open={formParent !== undefined || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setFormParent(undefined);
            setEditing(null);
          }
        }}
        node={editing}
        parent={formParent ?? null}
        submitting={actions.createNode.isPending || actions.updateNode.isPending}
        onSubmit={submitForm}
      />
      <PrerequisiteDialog
        node={prereqNode}
        nodes={allNodes}
        submitting={actions.updateNode.isPending}
        onOpenChange={(open) => !open && setPrereqNode(null)}
        onSave={(ids) =>
          prereqNode &&
          actions.updateNode.mutate(
            { id: prereqNode.id, input: { prerequisites: ids } },
            { onSuccess: () => setPrereqNode(null) },
          )
        }
      />
      <ApplyTemplateDialog
        open={templateOpen}
        onOpenChange={setTemplateOpen}
        subject={tree.data?.subject ?? null}
        applying={actions.applyTemplate.isPending}
        onApply={applyTemplate}
      />
      <ProposalDialog open={proposalOpen} onOpenChange={setProposalOpen} subjectId={subjectId} />
    </div>
  );
}
