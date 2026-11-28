import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import {
  BookOpen,
  ClipboardCheck,
  Eye,
  Flag,
  GitCompareArrows,
  GraduationCap,
  History,
  Lock,
  PlayCircle,
  RotateCcw,
  Timer,
} from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { SubjectFilterPill } from '@/components/GlobalSubjectFilter';
import { useAuthStore } from '@/hooks/useAuth';
import { useSelectedSubject } from '@/hooks/useSubjectStore';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTablePage } from '@/components/DataTablePage';
import { ConceptSelect } from '@/components/ConceptSelect';
import { StatusBadge } from '@/components/StatusBadge';
import {
  compareAttempts,
  getScoreHistory,
  listAssessments,
  startAssessment,
  startRetryWrong,
} from '@/services/assessment';
import type { Assessment } from '@/services/assessment/types';
import { listAssessmentConfigs } from '@/services/assessment-config';
import type { AssessmentConfig } from '@/services/assessment-config/types';
import { listPlans } from '@/services/planning';
import type { PlanSession } from '@/services/planning/types';
import type { ApiError } from '@/services/apiError';
import { AssessmentDialog } from './components/AssessmentDialog';

// UC-ASM-06: score before/after a regrade (business-rule: regrade appends a new history entry
// rather than overwriting the original score, so the full before/after trail is preserved).
function ScoreHistoryDialog({ assessmentId, onClose }: { assessmentId: string | null; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ['assessment-score-history', assessmentId],
    queryFn: () => getScoreHistory(assessmentId as string),
    enabled: !!assessmentId,
  });

  return (
    <Dialog open={!!assessmentId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="sm" className="tw-scope">
        <DialogHeader>
          <DialogTitle>Điểm trước và sau khi chấm lại</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1">
          {(data ?? []).map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-control bg-muted px-3 py-2 text-sm"
            >
              <span>{h.reason === 'regrade' ? 'Sau chấm lại' : 'Chấm lần đầu'}</span>
              <span className="font-semibold">{h.score}%</span>
            </div>
          ))}
          {data?.length === 1 && (
            <p className="text-xs text-muted-foreground">Bài làm chưa được chấm lại lần nào.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompareDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [concept, setConcept] = useState<string | null>(null);

  const { data: submitted } = useQuery({
    queryKey: ['assessment-submitted-for-compare'],
    queryFn: () => listAssessments({ status: 'submitted', page: 1, limit: 100 }),
    enabled: open,
  });
  const concepts = useMemo(() => [...new Set((submitted?.data ?? []).map((a) => a.concept))], [submitted]);

  const { data: result } = useQuery({
    queryKey: ['assessment-compare', concept],
    queryFn: () => compareAttempts(concept as string),
    enabled: open && !!concept,
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="tw-scope">
        <DialogHeader>
          <DialogTitle>So sánh kết quả giữa các lần làm</DialogTitle>
        </DialogHeader>
        <Select value={concept ?? undefined} onValueChange={setConcept}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn kiến thức để so sánh" />
          </SelectTrigger>
          <SelectContent className="tw-scope">
            {concepts.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {result && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Thay đổi so với lần đầu:{' '}
              <span
                className={
                  result.deltaFromFirst >= 0 ? 'font-semibold text-success' : 'font-semibold text-danger'
                }
              >
                {result.deltaFromFirst >= 0 ? '+' : ''}
                {result.deltaFromFirst}%
              </span>
            </p>
            <div className="flex flex-col gap-1">
              {result.attempts.map((a, i) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-control bg-muted px-3 py-2 text-sm"
                >
                  <span>
                    Lần {i + 1} — {new Date(a.submittedAt).toLocaleDateString('vi-VN')}
                  </span>
                  <span className="font-semibold">{a.score}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

type ChapterGroup = {
  chapterTitle: string;
  total: number;
  doneCount: number;
  unlocked: boolean;
  conceptIds: Set<string>;
};

// N3 "Sắp tới": chapter tests tied to the active plan's chapters + mock exams, both reusing the
// generic startAssessment/AssessmentDialog flow already built for Luyện tập (Practice.tsx).
// Real stage-gate (no invented rule): a chapter's test unlocks once every session copied from that
// plan-template chapter (grouped by the already-existing `chapterTitle` field) is 'done' — derived
// straight from planning data the student already has, nothing new on the backend.
function UpcomingSection({ onOpen, subjectId }: { onOpen: (attemptId: string) => void; subjectId: string | null }) {
  const navigate = useNavigate();
  const { data: plansRes, isLoading: loadingPlan } = useQuery({
    queryKey: ['assessment-upcoming-active-plan', subjectId ?? 'all'],
    queryFn: () => listPlans({ status: 'active', limit: 20, subjectId: subjectId ?? undefined }),
  });
  const activePlan = plansRes?.data?.[0];

  const { data: chapterConfigsRes, isLoading: loadingChapterConfigs } = useQuery({
    queryKey: ['assessment-upcoming-chapter-configs', subjectId ?? 'all'],
    queryFn: () => listAssessmentConfigs({ kind: 'chapter_test', status: 'active', subjectId: subjectId ?? undefined, limit: 100 }),
  });
  const { data: mockConfigsRes, isLoading: loadingMockConfigs } = useQuery({
    queryKey: ['assessment-upcoming-mock-configs', subjectId ?? 'all'],
    queryFn: () => listAssessmentConfigs({ kind: 'mock_exam', status: 'active', subjectId: subjectId ?? undefined, limit: 100 }),
  });

  const startMutation = useMutation({
    mutationFn: (configId: string) => startAssessment(configId),
    onSuccess: (attempt) => onOpen(attempt._id),
    onError: (err) =>
      toast.error((err as ApiError).message || 'Không thể bắt đầu bài làm — có thể bạn đã làm hết số lần cho phép'),
  });

  const chapterGroups = useMemo<ChapterGroup[]>(() => {
    const byTitle = new Map<string, PlanSession[]>();
    (activePlan?.sessions ?? []).forEach((s) => {
      if (!s.chapterTitle) return;
      const arr = byTitle.get(s.chapterTitle) ?? [];
      arr.push(s);
      byTitle.set(s.chapterTitle, arr);
    });
    return [...byTitle.entries()].map(([chapterTitle, group]) => ({
      chapterTitle,
      total: group.length,
      doneCount: group.filter((s) => s.status === 'done').length,
      unlocked: group.every((s) => s.status === 'done'),
      conceptIds: new Set(group.map((s) => s.concept)),
    }));
  }, [activePlan]);

  const chapterTests = useMemo(() => {
    return (chapterConfigsRes?.data ?? [])
      .map((config) => ({ config, group: chapterGroups.find((g) => g.conceptIds.has(config.concept)) }))
      .filter((x): x is { config: AssessmentConfig; group: ChapterGroup } => !!x.group);
  }, [chapterConfigsRes, chapterGroups]);

  const mockExams = mockConfigsRes?.data ?? [];

  const metaLine = (c: AssessmentConfig) =>
    `${c.questions.length} câu · Điểm đạt ${c.passScore}%` +
    (c.timeLimitMinutes ? ` · ${c.timeLimitMinutes} phút` : ' · Không giới hạn thời gian');

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Cột trái: Kiểm tra cuối chặng */}
      <div className="flex flex-col rounded-card border border-border bg-card p-5 shadow-card">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Flag className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-foreground">Kiểm tra cuối chặng</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Mở khoá khi đã hoàn thành (đánh &quot;Đã học&quot;) mọi buổi học của chặng đó trong lộ trình đang hoạt động.
            </p>
          </div>
        </div>

        {(loadingPlan || loadingChapterConfigs) && (
          <div className="h-44 animate-pulse rounded-card bg-muted/40" />
        )}

        {!loadingPlan && !loadingChapterConfigs && (!activePlan || chapterTests.length === 0) && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ClipboardCheck className="h-5 w-5" />
            </span>
            <p className="max-w-xs text-sm text-muted-foreground">
              {!activePlan
                ? 'Bạn chưa có lộ trình đang hoạt động.'
                : 'Chưa có kiểm tra cuối chặng nào được cấu hình cho các chặng của lộ trình này.'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-card"
              onClick={() => navigate(PATHS.student.learningRoadmap)}
            >
              <GraduationCap className="h-4 w-4" /> Xem lộ trình học
            </Button>
          </div>
        )}

        {chapterTests.length > 0 && (
          <div className="flex flex-col gap-3">
            {chapterTests.map(({ config, group }) => (
              <div
                key={config._id}
                className="flex flex-col gap-2 rounded-card border border-border bg-background/60 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{config.title}</p>
                  {group.unlocked ? (
                    <StatusBadge variant="success">Mở khóa</StatusBadge>
                  ) : (
                    <StatusBadge variant="warning">
                      Chưa mở: {group.doneCount}/{group.total} buổi
                    </StatusBadge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metaLine(config)} · Chặng &quot;{group.chapterTitle}&quot;
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="self-start"
                  disabled={!group.unlocked || startMutation.isPending}
                  onClick={() => startMutation.mutate(config._id)}
                >
                  {group.unlocked ? <PlayCircle className="h-4 w-4" /> : <Lock className="h-4 w-4" />} Làm bài
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cột phải: Thi thử */}
      <div className="flex flex-col rounded-card border border-border bg-card p-5 shadow-card">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Timer className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-foreground">Thi thử</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Tính giờ, khoá xem đáp án đến khi nộp bài.
            </p>
          </div>
        </div>

        {loadingMockConfigs && <div className="h-44 animate-pulse rounded-card bg-muted/40" />}

        {!loadingMockConfigs && mockExams.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BookOpen className="h-5 w-5" />
            </span>
            <p className="max-w-xs text-sm text-muted-foreground">Chưa có đề thi thử nào khả dụng.</p>
            <Button type="button" size="sm" onClick={() => navigate(PATHS.student.examLibrary)}>
              <BookOpen className="h-4 w-4" /> Khám phá thư viện đề thi
            </Button>
          </div>
        )}

        {mockExams.length > 0 && (
          <div className="flex flex-col gap-3">
            {mockExams.map((config) => (
              <div
                key={config._id}
                className="flex flex-col gap-2 rounded-card border border-border bg-background/60 p-4"
              >
                <p className="font-semibold text-foreground">{config.title}</p>
                <p className="text-xs text-muted-foreground">{metaLine(config)}</p>
                <Button
                  type="button"
                  size="sm"
                  className="self-start"
                  disabled={startMutation.isPending}
                  onClick={() => startMutation.mutate(config._id)}
                >
                  <PlayCircle className="h-4 w-4" /> Bắt đầu
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const { selectedSubjectId } = useSelectedSubject();
  const [openId, setOpenId] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [conceptFilter, setConceptFilter] = useState<string | null>(null);
  const [tableKey, setTableKey] = useState(0);

  const columns: ColumnDef<Assessment>[] = [
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ getValue }) =>
        getValue<string>() === 'in_progress' ? (
          <StatusBadge variant="warning">Đang làm</StatusBadge>
        ) : (
          <StatusBadge variant="info">Đã nộp</StatusBadge>
        ),
    },
    {
      accessorKey: 'score',
      header: 'Điểm',
      cell: ({ row }) => (row.original.status === 'submitted' ? `${row.original.score}%` : '—'),
    },
    {
      id: 'result',
      header: 'Kết quả',
      cell: ({ row }) =>
        row.original.status !== 'submitted' ? (
          '—'
        ) : row.original.passed ? (
          <StatusBadge variant="success">Đạt</StatusBadge>
        ) : (
          <StatusBadge variant="danger">Chưa đạt</StatusBadge>
        ),
    },
    {
      accessorKey: 'submittedAt',
      header: 'Nộp lúc',
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        return v ? new Date(v).toLocaleString('vi-VN') : '—';
      },
    },
  ];

  return (
    <AppShell
      menu={studentMenu}
      title="Đánh giá"
      breadcrumb={['Trang chủ', 'Đánh giá']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <Tabs defaultValue="upcoming">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Bài kiểm tra và thi thử</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Theo dõi bài kiểm tra cuối chặng theo lộ trình và luyện đề thi thử tính giờ.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <SubjectFilterPill />
            <TabsList>
              <TabsTrigger value="upcoming">Sắp tới</TabsTrigger>
              <TabsTrigger value="history">Lịch sử</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="upcoming">
          <UpcomingSection onOpen={setOpenId} subjectId={selectedSubjectId} />
        </TabsContent>

        <TabsContent value="history">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="w-72">
          <ConceptSelect
            value={conceptFilter ?? ''}
            onChange={(v) => {
              setConceptFilter(v || null);
              setTableKey((k) => k + 1);
            }}
            placeholder="Lọc theo kiến thức (tất cả nếu bỏ trống)"
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setCompareOpen(true)}>
          <GitCompareArrows className="h-4 w-4" /> So sánh kết quả
        </Button>
      </div>

      <DataTablePage<Assessment>
        key={`${tableKey}:${selectedSubjectId ?? 'all'}`}
        columns={columns}
        getRowId={(r) => r._id}
        searchPlaceholder="Tìm theo trạng thái hoặc điểm…"
        emptyLabel="Bạn chưa có bài làm nào. Vào Thư viện đề thi để bắt đầu."
        fetcher={async ({ page, pageSize, search }) => {
          const res = await listAssessments({
            page: search ? 1 : page,
            limit: search ? 100 : pageSize,
            concept: conceptFilter ?? undefined,
            subjectId: selectedSubjectId ?? undefined,
          });
          if (search?.trim()) {
            const q = search.trim().toLowerCase();
            const filtered = res.data.filter(
              (a) =>
                a.status.toLowerCase().includes(q) ||
                String(a.score ?? '').includes(q) ||
                (a.passed ? 'đạt' : 'chưa đạt').includes(q),
            );
            const start = (page - 1) * pageSize;
            return { data: filtered.slice(start, start + pageSize), total: filtered.length };
          }
          return { data: res.data, total: res.meta?.total ?? res.data.length };
        }}
        rowActions={[
          {
            key: 'open',
            label: 'Tiếp tục / Xem kết quả',
            icon: <Eye className="h-4 w-4" />,
            onSelect: (row) => setOpenId(row._id),
          },
          {
            key: 'history',
            label: 'Điểm trước/sau chấm lại',
            icon: <History className="h-4 w-4" />,
            hidden: (row) => row.status !== 'submitted',
            onSelect: (row) => setHistoryId(row._id),
          },
          {
            key: 'retry-wrong',
            label: 'Làm lại các câu sai',
            icon: <RotateCcw className="h-4 w-4" />,
            hidden: (row) => row.status !== 'submitted',
            onSelect: (row) => {
              startRetryWrong(row._id)
                .then((attempt) => setOpenId(attempt._id))
                .catch((err) =>
                  toast((err as ApiError).message || 'Không thể tạo bài làm lại — có thể bạn chưa làm sai câu nào.'),
                );
            },
          },
        ]}
      />
        </TabsContent>
      </Tabs>

      <AssessmentDialog assessmentId={openId} open={!!openId} onClose={() => setOpenId(null)} />
      <CompareDialog open={compareOpen} onClose={() => setCompareOpen(false)} />
      <ScoreHistoryDialog assessmentId={historyId} onClose={() => setHistoryId(null)} />
    </AppShell>
  );
}
