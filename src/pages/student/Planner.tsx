import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarPlus, LayoutTemplate, PenLine, Plus, Sparkles, Target, Trash2 } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { generateStudyPlan } from '@/services/ai-assist';
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
import { CalendarScheduleCard, type ScheduleItem } from './components/CalendarScheduleCard';
import { RoadmapTree } from './components/RoadmapTree';
import { SessionQuizDialog } from './components/SessionQuizDialog';

const conceptName = (c: Goal['concept']) => (typeof c === 'string' ? c : c.name);

function GoalForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [concept, setConcept] = useState('');
  const [deadline, setDeadline] = useState('');

  const mutation = useMutation({
    mutationFn: () => createGoal({ title, concept, deadline: new Date(deadline).toISOString() }),
    onSuccess: () => {
      toast.success('Đã tạo mục tiêu học tập');
      setOpen(false);
      setTitle('');
      setConcept('');
      setDeadline('');
      onCreated();
    },
    onError: () => toast.error('Tạo mục tiêu thất bại'),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Mục tiêu mới
      </Button>
      <DialogContent className="tw-scope max-w-sm">
        <DialogHeader>
          <DialogTitle>Mục tiêu học tập mới</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input placeholder="Tên mục tiêu" value={title} onChange={(e) => setTitle(e.target.value)} />
          {/* shortcut: raw concept id, no concept picker UI yet — upgrade once "Bản đồ tri thức" ships */}
          <Input
            placeholder="Mã khái niệm (concept id)"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
          />
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
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
  const [concept, setConcept] = useState('');
  const [startAt, setStartAt] = useState('');
  const [durationMin, setDurationMin] = useState('45');

  const mutation = useMutation({
    mutationFn: () =>
      addSession(planId, {
        concept,
        startAt: new Date(startAt).toISOString(),
        durationMin: Number(durationMin),
      }),
    onSuccess: () => {
      toast.success('Đã thêm buổi học');
      setOpen(false);
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
      <DialogContent className="tw-scope max-w-sm">
        <DialogHeader>
          <DialogTitle>Thêm buổi học</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
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
            disabled={!concept || !startAt || mutation.isPending}
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
  onOpenChange,
  onApplied,
}: {
  goalId: string | null;
  onOpenChange: (open: boolean) => void;
  onApplied: () => void;
}) {
  const { data } = useQuery({
    queryKey: planTemplateKeys.list({ limit: 50 }),
    queryFn: () => listPlanTemplates({ limit: 50 }),
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
      <DialogContent className="tw-scope max-w-lg">
        <DialogHeader>
          <DialogTitle>Chọn lộ trình mẫu</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
          {templates.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Chưa có lộ trình mẫu nào được quản trị viên thiết lập.
            </p>
          )}
          {templates.map((t) => (
            <div
              key={t._id}
              className="flex items-center justify-between gap-3 rounded-control border border-border bg-card p-3"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                <p className="text-xs text-muted-foreground">
                  {t.steps.length} buổi học
                  {t.concept && typeof t.concept !== 'string' ? ` • ${t.concept.name}` : ''}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(t._id)}
              >
                Áp dụng
              </Button>
            </div>
          ))}
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
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [templateGoalId, setTemplateGoalId] = useState<string | null>(null);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);

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
      title: 'Buổi học',
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

      <div className="flex flex-col gap-5">
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
          <GoalForm onCreated={refetchGoals} />
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
                {conceptName(g.concept)} • Hạn: {new Date(g.deadline).toLocaleDateString('vi-VN')} • Mức ưu
                tiên {g.importance}/5
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
                <Button type="button" variant="outline" size="sm" onClick={() => setTemplateGoalId(g._id)}>
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

      <ConfirmDialog
        open={!!deletingGoal}
        onOpenChange={(v) => !v && setDeletingGoal(null)}
        title="Xoá mục tiêu học tập?"
        description={`Mục tiêu "${deletingGoal?.title ?? ''}" sẽ bị xoá.`}
        onConfirm={() => deletingGoal && deleteGoalMutation.mutate(deletingGoal._id)}
      />

      <TemplatePickerDialog
        goalId={templateGoalId}
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
