import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, CalendarPlus, LayoutTemplate, PenLine, Sparkles, Target, Trash2 } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { AddButton } from '@/components/ui/add-button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ConceptSelect } from '@/components/ConceptSelect';
import { generateStudyPlan } from '@/services/ai-assist';
import { checkReplan, replan } from '@/services/adaptive';
import { applyPlanTemplate, listPlanTemplates } from '@/services/plan-template';
import { planTemplateKeys } from '@/services/plan-template/queryKeys';
import {
  addSession,
  confirmPlan,
  createGoal,
  createPlan,
  listGoals,
  listPlans,
  removeGoal,
  removeSession,
  updateSession,
} from '@/services/planning';
import { planningKeys } from '@/services/planning/queryKeys';
import type { Goal } from '@/services/planning/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarScheduleCard, type ScheduleItem } from './components/CalendarScheduleCard';
import { LearningPathOverview } from './components/LearningPathOverview';
import { RoadmapTree } from './components/RoadmapTree';
import { SessionQuizDialog } from './components/SessionQuizDialog';

const conceptName = (c: Goal['concept']) => (typeof c === 'string' ? c : c.name);

function GoalForm({
  onCreated,
  initialConcept,
  forceOpen,
  onForceOpenHandled,
}: {
  onCreated: () => void;
  /** Pre-fills and locks the concept — used when arriving from "Khoá học của tôi" with a subject
   * already chosen (so the student doesn't have to pick it again). */
  initialConcept?: string;
  /** Opens the dialog immediately (once) instead of waiting for the trigger button click. */
  forceOpen?: boolean;
  onForceOpenHandled?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [concept, setConcept] = useState('');
  const [deadline, setDeadline] = useState('');
  const [targetScore, setTargetScore] = useState('');

  useEffect(() => {
    if (!forceOpen) return;
    setConcept(initialConcept ?? '');
    setOpen(true);
    onForceOpenHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceOpen]);

  const mutation = useMutation({
    mutationFn: () =>
      createGoal({
        title,
        concept,
        deadline: new Date(deadline).toISOString(),
        targetScore: targetScore ? Number(targetScore) : undefined,
      }),
    onSuccess: () => {
      toast.success('Đã tạo mục tiêu học tập');
      setOpen(false);
      setTitle('');
      setConcept('');
      setDeadline('');
      setTargetScore('');
      onCreated();
    },
    onError: () => toast.error('Tạo mục tiêu thất bại'),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <AddButton size="sm" onClick={() => setOpen(true)}>
        Mục tiêu mới
      </AddButton>
      <DialogContent size="sm" className="tw-scope">
        <DialogHeader>
          <DialogTitle>Mục tiêu học tập mới</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input placeholder="Tên mục tiêu" value={title} onChange={(e) => setTitle(e.target.value)} />
          <ConceptSelect
            value={concept}
            onChange={setConcept}
            parentConcept={null}
            placeholder="Chọn môn học"
            disabled={!!initialConcept}
          />
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <Input
            type="number"
            min={0}
            max={100}
            placeholder="Mục tiêu điểm/mastery (%) — không bắt buộc"
            value={targetScore}
            onChange={(e) => setTargetScore(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button
            type="button"
            disabled={!title || !concept || !deadline || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Tạo mục tiêu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SessionForm({ planId, onCreated }: { planId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [concept, setConcept] = useState('');
  const [startAt, setStartAt] = useState('');
  const [durationMin, setDurationMin] = useState('45');

  const mutation = useMutation({
    mutationFn: () =>
      addSession(planId, {
        title,
        concept,
        startAt: new Date(startAt).toISOString(),
        durationMin: Number(durationMin),
      }),
    onSuccess: () => {
      toast.success('Đã thêm buổi học');
      setOpen(false);
      setTitle('');
      setConcept('');
      setStartAt('');
      onCreated();
    },
    onError: () => toast.error('Buổi học bị trùng giờ hoặc không hợp lệ'),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <CalendarPlus className="h-4 w-4" /> Thêm buổi học
      </Button>
      <DialogContent size="sm" className="tw-scope">
        <DialogHeader>
          <DialogTitle>Thêm buổi học</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input placeholder="Tên buổi học" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            placeholder="Mã khái niệm (concept id)"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
          />
          <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          <Input
            type="number"
            min={5}
            max={480}
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button
            type="button"
            disabled={!title || !concept || !startAt || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Thêm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplatePickerDialog({
  goalId,
  conceptId,
  onOpenChange,
  onApplied,
}: {
  goalId: string | null;
  /** The goal's own subject — without this, every published template across every subject showed
   * up mixed together regardless of the goal being picked for (e.g. a "Giải tích 1" goal listing
   * Triết học templates too), which only became an obvious real bug once more than one subject had
   * published templates. */
  conceptId?: string;
  onOpenChange: (open: boolean) => void;
  onApplied: () => void;
}) {
  const { data } = useQuery({
    queryKey: planTemplateKeys.list({ limit: 50, concept: conceptId }),
    queryFn: () => listPlanTemplates({ limit: 50, concept: conceptId }),
    enabled: !!goalId,
  });
  const templates = data?.data ?? [];

  const mutation = useMutation({
    mutationFn: (templateId: string) => applyPlanTemplate(templateId, goalId ?? undefined),
    onSuccess: () => {
      toast.success('Đã áp dụng lộ trình mẫu — xác nhận ở trên để kích hoạt');
      onOpenChange(false);
      onApplied();
    },
    onError: () => toast.error('Áp dụng lộ trình mẫu thất bại'),
  });

  return (
    <Dialog open={!!goalId} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="tw-scope">
        <DialogHeader>
          <DialogTitle>Chọn lộ trình mẫu</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
          {templates.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Chưa có lộ trình mẫu nào cho môn học của mục tiêu này.
            </p>
          )}
          {templates.map((t) => {
            const totalMinutes = t.steps.reduce((sum, s) => sum + s.durationMin, 0);
            const hours = Math.round((totalMinutes / 60) * 10) / 10;
            return (
              <div
                key={t._id}
                className="flex items-center justify-between gap-3 rounded-control border border-border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{t.title}</p>
                  {t.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t.steps.length} chặng • ~{hours}h
                    {t.concept && typeof t.concept !== 'string' ? ` • ${t.concept.name}` : ''}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate(t._id)}
                >
                  Áp dụng
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PlannerPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [templateGoalId, setTemplateGoalId] = useState<string | null>(null);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  // Arriving from "Khoá học của tôi" with ?concept=<id> opens the goal form pre-filled for that
  // subject instead of landing on a blank Lộ trình & kế hoạch page.
  const conceptFromCourses = searchParams.get('concept');

  const { data: plansRes } = useQuery({
    queryKey: planningKeys.plans({ limit: 20 }),
    queryFn: () => listPlans({ limit: 20 }),
  });
  const plans = plansRes?.data ?? [];
  const activePlan = plans.find((p) => p.status === 'active');
  const proposedPlans = plans.filter((p) => p.status === 'proposed');

  const { data: goalsRes, refetch: refetchGoals } = useQuery({
    queryKey: planningKeys.goals({ limit: 50 }),
    queryFn: () => listGoals({ limit: 50 }),
  });
  const goals = goalsRes?.data ?? [];

  const invalidatePlans = () => queryClient.invalidateQueries({ queryKey: planningKeys.all });

  // AP-ADP-02/03: an active plan with missed sessions can be re-ranked into a new proposed plan —
  // only checked when there isn't already one pending confirmation below, so the student is never
  // asked twice at once.
  const { data: replanCheck } = useQuery({
    queryKey: ['adaptive-replan-check', activePlan?._id],
    queryFn: () => checkReplan(activePlan!._id),
    enabled: !!activePlan,
  });

  const replanMutation = useMutation({
    mutationFn: () => replan(activePlan!._id),
    onSuccess: ({ reason }) => {
      toast.success(`Đã đề xuất xếp lại lịch — ${reason}`);
      invalidatePlans();
    },
    onError: () => toast.error('Xếp lại lịch thất bại'),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmPlan(id),
    onSuccess: () => {
      toast.success('Đã xác nhận kế hoạch mới');
      invalidatePlans();
    },
    onError: () => toast.error('Xác nhận kế hoạch thất bại'),
  });

  const createPlanMutation = useMutation({
    mutationFn: (title: string) => createPlan({ title }),
    onSuccess: () => {
      toast.success('Đã tạo kế hoạch học tập — thêm buổi học ở mục Lịch học bên dưới');
      setNewPlanTitle('');
      invalidatePlans();
    },
    onError: () => toast.error('Tạo kế hoạch thất bại'),
  });

  const sessionActionMutation = useMutation({
    mutationFn: async (action: { type: 'done' | 'cancel' | 'remove'; sessionId: string }) => {
      if (!activePlan) throw new Error('No active plan');
      if (action.type === 'remove') return removeSession(activePlan._id, action.sessionId);
      await updateSession(activePlan._id, action.sessionId, {
        status: action.type === 'done' ? 'done' : 'cancelled',
      });
    },
    onSuccess: () => invalidatePlans(),
    onError: () => toast.error('Cập nhật buổi học thất bại'),
  });

  const generatePlanMutation = useMutation({
    mutationFn: (goalId: string) => generateStudyPlan(goalId),
    onSuccess: ({ valid }) => {
      toast.success(
        valid
          ? 'AI đã đề xuất lộ trình học — xác nhận ở trên để áp dụng'
          : 'Đã tạo lộ trình đề xuất (AI trả về không đúng định dạng nên dùng lộ trình chia đều buổi học)',
      );
      invalidatePlans();
    },
    onError: () => toast.error('Tạo lộ trình bằng AI thất bại'),
  });

  // "Tự thiết kế": chỉ một kế hoạch đang hoạt động cùng lúc — nếu đã có, hướng dẫn thêm buổi học
  // vào kế hoạch đó thay vì tạo một kế hoạch hoạt động thứ hai mà giao diện không theo dõi được.
  const manualMutation = useMutation({
    mutationFn: (goal: Goal) => createPlan({ title: `${goal.title} (tự thiết kế)` }),
    onSuccess: () => {
      toast.success('Đã tạo kế hoạch — thêm buổi học ở mục Lịch học bên dưới');
      invalidatePlans();
    },
    onError: () => toast.error('Tạo kế hoạch thất bại'),
  });

  const handleManualDesign = (goal: Goal) => {
    if (activePlan) {
      toast('Bạn đang có một kế hoạch hoạt động — thêm buổi học cho mục tiêu này ở mục Lịch học bên dưới');
      return;
    }
    manualMutation.mutate(goal);
  };

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) => removeGoal(id),
    onSuccess: () => {
      toast.success('Đã xoá mục tiêu');
      refetchGoals();
    },
    onError: () => toast.error('Xoá mục tiêu thất bại'),
    onSettled: () => setDeletingGoal(null),
  });

  const scheduleItems: ScheduleItem[] = (activePlan?.sessions ?? [])
    .filter((s) => s.status === 'planned')
    .map((s) => ({
      id: s._id,
      type: 'class',
      title: s.title ?? 'Buổi học',
      subtitle: `${s.durationMin} phút`,
      time: new Date(s.startAt).toLocaleString('vi-VN'),
      meta: s.note ?? '',
    }));
  const calendarEvents = (activePlan?.sessions ?? []).map((s) => ({
    day: new Date(s.startAt).getDate(),
    type: 'class' as const,
  }));
  const now = new Date();

  return (
    <AppShell
      menu={studentMenu}
      title="Kế hoạch học tập"
      breadcrumb={['Trang chủ', 'Kế hoạch học tập']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-4 text-xl font-bold text-foreground">Kế hoạch học tập</h1>

      <Tabs defaultValue="roadmap" className="mb-5">
        <TabsList>
          <TabsTrigger value="roadmap">Lộ trình của tôi</TabsTrigger>
          <TabsTrigger value="plan">Kế hoạch học tập</TabsTrigger>
        </TabsList>

        <TabsContent value="roadmap" className="mt-4">
          <LearningPathOverview
            plan={activePlan}
            goal={goals.find((g) => {
              if (!activePlan?.sessions[0]) return false;
              const goalConceptId = typeof g.concept === 'string' ? g.concept : g.concept._id;
              return goalConceptId === activePlan.sessions[0].concept;
            })}
            onStartQuiz={(sessionId) => setQuizSessionId(sessionId)}
          />
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          <div className="flex flex-col gap-5">
            {proposedPlans.length === 0 && replanCheck?.needed && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-warning/30 bg-warning/5 p-4">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                  <div>
                    <p className="font-semibold text-foreground">Kế hoạch của bạn có buổi học bị bỏ lỡ</p>
                    <p className="text-sm text-muted-foreground">
                      {replanCheck.missedCount} phiên đã quá hạn. Xếp lại các buổi chưa học theo mức ưu tiên —
                      kế hoạch hiện tại vẫn giữ nguyên cho tới khi bạn xác nhận đề xuất mới.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={replanMutation.isPending}
                  onClick={() => replanMutation.mutate()}
                >
                  Đề xuất xếp lại lịch
                </Button>
              </div>
            )}

            {proposedPlans.length > 0 && (
              <div className="flex flex-col gap-3 rounded-card border border-warning/30 bg-warning/5 p-4">
                <h3 className="font-semibold text-foreground">Đề xuất kế hoạch mới cần xác nhận</h3>
                {proposedPlans.map((p) => (
                  <div
                    key={p._id}
                    className="flex flex-col gap-3 rounded-control border border-border bg-card p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{p.title}</p>
                      <Button type="button" size="sm" onClick={() => confirmMutation.mutate(p._id)}>
                        Xác nhận
                      </Button>
                    </div>
                    <RoadmapTree sessions={p.sessions} readOnly />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Mục tiêu học tập</h3>
              <GoalForm
                onCreated={refetchGoals}
                initialConcept={conceptFromCourses ?? undefined}
                forceOpen={!!conceptFromCourses}
                onForceOpenHandled={() => {
                  searchParams.delete('concept');
                  setSearchParams(searchParams, { replace: true });
                }}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {goals.length === 0 && <p className="text-sm text-muted-foreground">Chưa có mục tiêu nào.</p>}
              {goals.map((g) => (
                <div
                  key={g._id}
                  className="flex flex-col gap-2 rounded-card border border-border bg-card p-4 shadow-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Target className="h-4 w-4 text-primary" /> {g.title}
                    </span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setDeletingGoal(g)}>
                      <Trash2 className="h-3.5 w-3.5 text-danger" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {conceptName(g.concept)} • Hạn: {new Date(g.deadline).toLocaleDateString('vi-VN')} • Mức
                    ưu tiên {g.importance}/5
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">Tạo lộ trình cho mục tiêu này:</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={manualMutation.isPending}
                      onClick={() => handleManualDesign(g)}
                    >
                      <PenLine className="h-3.5 w-3.5" /> Tự thiết kế
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={generatePlanMutation.isPending && generatePlanMutation.variables === g._id}
                      onClick={() => generatePlanMutation.mutate(g._id)}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {generatePlanMutation.isPending && generatePlanMutation.variables === g._id
                        ? 'Đang tạo…'
                        : 'AI đề xuất'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTemplateGoalId(g._id)}
                    >
                      <LayoutTemplate className="h-3.5 w-3.5" /> Chọn lộ trình mẫu
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Lịch học</h3>
              {activePlan ? (
                <SessionForm planId={activePlan._id} onCreated={invalidatePlans} />
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Tên kế hoạch mới"
                    value={newPlanTitle}
                    onChange={(e) => setNewPlanTitle(e.target.value)}
                    className="h-9 w-48"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!newPlanTitle || createPlanMutation.isPending}
                    onClick={() => createPlanMutation.mutate(newPlanTitle)}
                  >
                    Tạo kế hoạch
                  </Button>
                </div>
              )}
            </div>

            {activePlan ? (
              <>
                <CalendarScheduleCard
                  year={now.getFullYear()}
                  month={now.getMonth()}
                  today={now.getDate()}
                  events={calendarEvents}
                  schedule={scheduleItems}
                />
                <RoadmapTree
                  sessions={activePlan.sessions}
                  onSessionAction={(action) => sessionActionMutation.mutate(action)}
                  onStartQuiz={(sessionId) => setQuizSessionId(sessionId)}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Chưa có kế hoạch học tập nào đang hoạt động — tạo kế hoạch mới ở trên.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!deletingGoal}
        onOpenChange={(v) => !v && setDeletingGoal(null)}
        title="Xoá mục tiêu học tập?"
        description={`Mục tiêu "${deletingGoal?.title ?? ''}" sẽ bị xoá.`}
        onConfirm={() => deletingGoal && deleteGoalMutation.mutate(deletingGoal._id)}
      />

      <TemplatePickerDialog
        goalId={templateGoalId}
        conceptId={(() => {
          const g = goals.find((goal) => goal._id === templateGoalId);
          if (!g) return undefined;
          return typeof g.concept === 'string' ? g.concept : g.concept._id;
        })()}
        onOpenChange={(v) => !v && setTemplateGoalId(null)}
        onApplied={invalidatePlans}
      />

      {activePlan && (
        <SessionQuizDialog
          planId={activePlan._id}
          sessionId={quizSessionId}
          questionIds={activePlan.sessions.find((s) => s._id === quizSessionId)?.questions ?? []}
          onClose={() => setQuizSessionId(null)}
          onPassed={() => {
            sessionActionMutation.mutate({ type: 'done', sessionId: quizSessionId! });
            setQuizSessionId(null);
          }}
        />
      )}
    </AppShell>
  );
}
