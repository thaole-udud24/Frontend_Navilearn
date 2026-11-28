import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BookOpen, CheckCircle2, PlayCircle } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { useSelectedSubject } from '@/hooks/useSubjectStore';
import { SubjectFilterPill } from '@/components/GlobalSubjectFilter';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { ConceptSelect } from '@/components/ConceptSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/StatusBadge';
import { listWrongItems, markWrongItemMastered, wrongItemKeys } from '@/services/wrong-item';
import type { WrongItem, WrongItemStatus } from '@/services/wrong-item/types';
import { startRetryWrongItems } from '@/services/assessment';
import { AssessmentDialog } from './components/AssessmentDialog';
import type { ApiError } from '@/services/apiError';

type StatusFilter = 'open' | 'mastered' | 'all';

function formatShortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

export function WrongItemsContent() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedSubjectId } = useSelectedSubject();
  const subject = selectedSubjectId ?? searchParams.get('subject') ?? '';
  const concept = searchParams.get('concept') ?? '';
  const statusFilter = (searchParams.get('status') as StatusFilter) || 'open';

  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainSingle, setExplainSingle] = useState<WrongItem | null>(null);

  const updateParam = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val);
    else next.delete(key);
    if (key === 'subject') next.delete('concept');
    setSearchParams(next, { replace: true });
    setSelectedIds([]);
  };

  const filters = {
    status: statusFilter === 'all' ? undefined : (statusFilter as WrongItemStatus),
    subjectId: subject || undefined,
    concept: concept || undefined,
    limit: 100,
  };

  const { data, isLoading } = useQuery({
    queryKey: wrongItemKeys.list(filters),
    queryFn: () => listWrongItems(filters),
  });
  const items = data?.data ?? [];

  // Separate real count of unmastered ("chưa khắc phục") wrong items for the wireframe pill badge.
  const openCountFilters = {
    status: 'open' as const,
    subjectId: subject || undefined,
    concept: concept || undefined,
    limit: 1,
  };
  const { data: openCountRes } = useQuery({
    queryKey: [...wrongItemKeys.list(openCountFilters), 'count'],
    queryFn: () => listWrongItems(openCountFilters),
  });
  const openCount = openCountRes?.meta?.total ?? items.filter((i) => i.status === 'open').length;

  const openItems = useMemo(() => items.filter((i) => i.status === 'open'), [items]);
  const selectedItems = useMemo(
    () => items.filter((i) => selectedIds.includes(i._id)),
    [items, selectedIds],
  );

  // "Làm lại tất cả câu sai": uses concept if chosen, otherwise takes the first concept group or all open items.
  const retryAllMutation = useMutation({
    mutationFn: () => {
      if (concept) return startRetryWrongItems(concept);
      const firstOpen = openItems[0];
      if (!firstOpen) throw new Error('Không có câu chưa khắc phục để luyện lại');
      const firstConceptId =
        typeof firstOpen.concept === 'string' ? firstOpen.concept : firstOpen.concept?._id;
      const sameConceptIds = openItems
        .filter((i) => (typeof i.concept === 'string' ? i.concept : i.concept?._id) === firstConceptId)
        .map((i) => i._id);
      return startRetryWrongItems(undefined, sameConceptIds);
    },
    onSuccess: (attempt) => setOpenId(attempt._id),
    onError: (err) =>
      toast.error(
        (err as ApiError).message ||
          'Không thể bắt đầu luyện lại — hãy chọn một chủ đề cụ thể hoặc đánh dấu các câu cùng chủ đề',
      ),
  });

  const retrySelectedMutation = useMutation({
    mutationFn: () => startRetryWrongItems(undefined, selectedIds),
    onSuccess: (attempt) => {
      setOpenId(attempt._id);
      setSelectedIds([]);
    },
    onError: (err) =>
      toast.error(
        (err as ApiError).message ||
          'Không thể luyện lại các câu đã chọn — hãy chọn các câu chưa khắc phục cùng một chủ đề',
      ),
  });

  const masteredMutation = useMutation({
    mutationFn: (id: string) => markWrongItemMastered(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wrongItemKeys.all });
      toast.success('Đã chuyển sang "Đã khắc phục"');
    },
  });

  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : items.map((i) => i._id));

  return (
    <div className="flex flex-col gap-4">
      {/* Header row — matches Ảnh 3 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Sổ câu sai</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Câu sai tự động lưu vào sổ khi kiểm tra. Làm đúng lại sẽ chuyển sang trạng thái Đã khắc phục.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <SubjectFilterPill />
          <Button
            type="button"
            disabled={openCount === 0 || retryAllMutation.isPending}
            onClick={() => retryAllMutation.mutate()}
          >
            <PlayCircle className="h-4 w-4" /> Làm lại tất cả câu sai
          </Button>
        </div>
      </div>

      {/* Filter Bar Card */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-card px-4 py-3 shadow-card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">Chủ đề:</label>
            <div className="w-52">
              <ConceptSelect
                value={concept}
                onChange={(v) => updateParam('concept', v)}
                placeholder="Tất cả chủ đề"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">Trạng thái:</label>
            <Select value={statusFilter} onValueChange={(v) => updateParam('status', v)}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="tw-scope">
                <SelectItem value="open">Chưa khắc phục</SelectItem>
                <SelectItem value="mastered">Đã khắc phục</SelectItem>
                <SelectItem value="all">Tất cả</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">
          {openCount} câu chưa khắc phục
        </span>
      </div>

      {isLoading && <ListSkeleton rows={4} />}

      {!isLoading && items.length === 0 && (
        <div className="rounded-card border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {concept || subject
            ? 'Không có câu sai nào khớp với bộ lọc hiện tại.'
            : statusFilter === 'open'
              ? 'Sổ câu sai đang trống — bạn đã khắc phục hết các câu sai!'
              : 'Chưa có câu sai nào được ghi nhận.'}
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3">Câu hỏi</th>
                  <th className="px-4 py-3">Chủ đề</th>
                  <th className="px-4 py-3 text-center">Sai lần</th>
                  <th className="px-4 py-3">Lần cuối</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const question = typeof item.question === 'string' ? null : item.question;
                  const conceptObj = typeof item.concept === 'string' ? null : item.concept;
                  const isOpen = item.status === 'open';
                  return (
                    <tr key={item._id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          aria-label={`Chọn câu ${question?.text ?? item._id}`}
                          checked={selectedIds.includes(item._id)}
                          onChange={() => toggleSelected(item._id)}
                        />
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        {question?.text ?? 'Câu hỏi đã bị xoá'}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{conceptObj?.name ?? '—'}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-danger">{item.wrongCount}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{formatShortDate(item.lastWrongAt)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <StatusBadge variant={isOpen ? 'danger' : 'success'}>
                            {isOpen ? 'Chưa khắc phục' : 'Đã khắc phục'}
                          </StatusBadge>
                          {isOpen && (
                            <button
                              type="button"
                              disabled={masteredMutation.isPending}
                              onClick={() => masteredMutation.mutate(item._id)}
                              title="Đánh dấu đã khắc phục"
                              className="text-xs text-muted-foreground transition-colors hover:text-success"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setExplainSingle(item)}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Giải thích
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Card Footer Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3">
            <span className="text-sm text-muted-foreground">Đã chọn {selectedIds.length} câu</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={selectedIds.length === 0}
                onClick={() => setExplainOpen(true)}
              >
                <BookOpen className="h-4 w-4" /> Xem giải thích
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={selectedIds.length === 0 || retrySelectedMutation.isPending}
                onClick={() => retrySelectedMutation.mutate()}
              >
                <PlayCircle className="h-4 w-4" /> Làm lại câu đã chọn
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Explanation Dialog for selected or single wrong items */}
      <Dialog
        open={explainOpen || !!explainSingle}
        onOpenChange={(v) => {
          if (!v) {
            setExplainOpen(false);
            setExplainSingle(null);
          }
        }}
      >
        <DialogContent size="md" className="tw-scope max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Giải thích ({explainSingle ? 1 : selectedItems.length} câu)
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            {(explainSingle ? [explainSingle] : selectedItems).map((item: WrongItem, idx: number) => {
              const q = typeof item.question === 'string' ? null : item.question;
              const c = typeof item.concept === 'string' ? null : item.concept;
              const correctOpt = q?.options?.find((o) => o.isCorrect);
              return (
                <div key={item._id} className="rounded-control border border-border bg-muted/20 p-3 text-sm">
                  <p className="font-semibold text-foreground">
                    {idx + 1}. {q?.text ?? 'Câu hỏi đã bị xoá'}
                  </p>
                  {c?.name && <p className="mt-0.5 text-xs text-muted-foreground">Chủ đề: {c.name}</p>}
                  {correctOpt && (
                    <p className="mt-2 text-xs font-medium text-success">Đáp án đúng: {correctOpt.text}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {q?.explanation?.trim()
                      ? q.explanation
                      : 'Chưa có lời giải chi tiết cho câu hỏi này — hãy bấm "Làm lại câu đã chọn" để ôn tập.'}
                  </p>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setExplainOpen(false);
                setExplainSingle(null);
              }}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AssessmentDialog
        assessmentId={openId}
        open={!!openId}
        onClose={() => {
          setOpenId(null);
          queryClient.invalidateQueries({ queryKey: wrongItemKeys.all });
        }}
      />
    </div>
  );
}

export default function WrongItemsPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <AppShell
      menu={studentMenu}
      title="Sổ câu sai"
      breadcrumb={['Trang chủ', 'Luyện tập', 'Sổ câu sai']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <WrongItemsContent />
    </AppShell>
  );
}
