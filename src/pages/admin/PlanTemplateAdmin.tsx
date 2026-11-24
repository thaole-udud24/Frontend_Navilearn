import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Clock,
  Eye,
  Flag,
  GraduationCap,
  Info,
  ListChecks,
  Lock,
  Map,
  Pencil,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { Button } from '@/components/ui/button';
import { AddButton } from '@/components/ui/add-button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/DialogForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTablePage, ClampLine } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import { SourceBadge } from '@/components/SourceBadge';
import { Stepper, type StepperStep } from '@/components/ui/stepper';
import { SessionBuilder } from '@/components/SessionBuilder';
import { theoryBlockCount } from '@/lib/theoryBlocks';
import {
  archivePlanTemplate,
  createPlanTemplate,
  exportPlanTemplates,
  importPlanTemplates,
  listPlanTemplates,
  publishPlanTemplate,
  removePlanTemplate,
  updatePlanTemplate,
} from '@/services/plan-template';
import type { PlanTemplate, PlanTemplateStatus, PlanTemplateStep } from '@/services/plan-template/types';
import { listQuestions } from '@/services/question-bank';
import { generateTemplateDraft } from '@/services/ai-assist';
import { ConceptSelect } from '@/components/ConceptSelect';
import { TheoryBlockEditor } from '@/components/TheoryBlockEditor';
import { TheoryBlockViewer } from '@/components/TheoryBlockViewer';
import { StageQuestionBank } from '@/components/StageQuestionBank';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { isStepReady, TemplateStepTree } from './components/TemplateStepTree';

function formatUpdatedAt(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const conceptName = (c: PlanTemplate['concept']) => (!c ? '' : typeof c === 'string' ? c : c.name);

const STATUS_LABEL: Record<PlanTemplateStatus, string> = {
  draft: 'Nháp',
  published: 'Đã xuất bản',
  archived: 'Lưu trữ',
};
const STATUS_VARIANT: Record<PlanTemplateStatus, 'success' | 'neutral' | 'warning'> = {
  draft: 'neutral',
  published: 'success',
  archived: 'warning',
};

/** Left column shared by Tab 2 and Tab 3 — the full list of giai đoạn with a quick "duration ·
 * question count" badge, so switching between buổi học never requires leaving the current tab. */
function StageSidebar({
  steps,
  selectedIndex,
  onSelect,
}: {
  steps: PlanTemplateStep[];
  selectedIndex: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex w-56 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border p-3">
      {steps.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className={cn(
            'flex flex-col items-start gap-0.5 rounded-control border p-2 text-left transition-colors',
            i === selectedIndex ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/60',
          )}
        >
          <span className="text-xs font-semibold text-muted-foreground">
            S{i} · Ngày {s.dayOffset}
          </span>
          <span className="text-sm font-medium text-foreground">{s.title || `Buổi học ${i + 1}`}</span>
          <span className="rounded-badge bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
            {s.durationMin}p · {s.questions?.length ?? 0} câu
          </span>
        </button>
      ))}
    </div>
  );
}

/** "Góc nhìn sinh viên" — a static read-only mock of the Lesson Player, so Admin can sanity-check
 * content without leaving the builder. Not interactive scoring: shows theory + every question with
 * its correct answer, matching the "Preview không ghi tiến độ" convention used elsewhere. */
function StagePreview({
  steps,
  selectedStepIndex,
  onSelectStage,
}: {
  steps: PlanTemplateStep[];
  selectedStepIndex: number;
  onSelectStage: (i: number) => void;
}) {
  const current = steps[selectedStepIndex];
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-warning/30 bg-warning/5 px-5 py-2 text-xs font-medium text-warning">
        <Eye className="h-3.5 w-3.5" /> Chế độ xem thử — không ghi tiến độ, chỉ Admin thấy đáp án đúng.
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-56 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border p-3">
          {steps.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectStage(i)}
              className={cn(
                'flex items-center gap-2 rounded-control border p-2 text-left text-sm transition-colors',
                i === selectedStepIndex
                  ? 'border-primary bg-primary/5 font-medium'
                  : 'border-transparent hover:bg-muted/60',
              )}
            >
              {i === 0 ? (
                <StatusBadge variant="info">Đang học</StatusBadge>
              ) : (
                <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate">{s.title || `Buổi học ${i + 1}`}</span>
            </button>
          ))}
        </div>
        <div className="min-w-0 flex-1 overflow-y-auto p-5">
          {current && (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Giai đoạn S{selectedStepIndex} · Ngày {current.dayOffset} · {current.durationMin} phút
                </p>
                <h2 className="text-lg font-bold text-foreground">{current.title}</h2>
                {current.objectives?.[0] && (
                  <p className="mt-1 text-sm text-muted-foreground">{current.objectives[0]}</p>
                )}
              </div>
              <div className="rounded-card border border-border bg-card p-4 shadow-card">
                <TheoryBlockViewer raw={current.theoryContent} />
              </div>
              {(current.questions?.length ?? 0) > 0 && (
                <div className="rounded-card border border-border bg-card p-4 shadow-card">
                  <p className="mb-2 text-sm font-semibold text-foreground">
                    Bài tập ({current.questions!.length} câu)
                  </p>
                  <StageQuestionBank selected={current.questions!} onChange={() => {}} readOnly />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Styled replacement for `window.prompt()` — asks for the optional changelog note before
 * publishing, matching the rest of the app's Dialog look instead of the browser's native prompt. */
function PublishChangeLogDialog({
  open,
  onOpenChange,
  onConfirm,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (changeLog: string) => void;
  submitting?: boolean;
}) {
  const [changeLog, setChangeLog] = useState('');

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setChangeLog('');
        onOpenChange(v);
      }}
    >
      <DialogContent size="sm" className="tw-scope">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Xuất bản lộ trình mẫu
          </DialogTitle>
        </DialogHeader>
        <FormField label="Ghi chú ngắn cho lần xuất bản này">
          <Input
            autoFocus
            placeholder="Ví dụ: Thêm buổi ôn tập cuối kỳ (không bắt buộc)"
            value={changeLog}
            onChange={(e) => setChangeLog(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onConfirm(changeLog.trim());
            }}
          />
        </FormField>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" disabled={submitting} onClick={() => onConfirm(changeLog.trim())}>
            Xuất bản
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function emptyStep(): PlanTemplateStep {
  return {
    dayOffset: 1,
    durationMin: 30,
    title: '',
    note: '',
    objectives: [],
    theoryContent: '',
    questions: [],
  };
}

interface TemplateSeed {
  title: string;
  description: string;
  concept?: string;
  steps: PlanTemplateStep[];
}

function TemplateFormDialog({
  template,
  seed,
  initialStageJump,
  onClose,
  onSaved,
}: {
  template: PlanTemplate | 'new' | null;
  /** Pre-fills a new template from an AI draft instead of starting blank (UC-PLN-TPL-04). */
  seed?: TemplateSeed | null;
  /** Opens straight into one giai đoạn's lý thuyết/bài tập tab — set from the cây lộ trình's
   * "Soạn lý thuyết"/"Soạn bài tập" quick buttons instead of always landing on Tab 1. */
  initialStageJump?: { index: number; tab: 'theory' | 'exercise' } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = template === 'new';
  const existing = isNew ? null : template;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [concept, setConcept] = useState('');
  const [steps, setSteps] = useState<PlanTemplateStep[]>([emptyStep()]);
  const [source, setSource] = useState<'manual' | 'ai'>('manual');
  const [saving, setSaving] = useState(false);
  const [publishPrompt, setPublishPrompt] = useState<PlanTemplate | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [previewMode, setPreviewMode] = useState(false);
  // Tab 2/3 build on the sessions defined in Tab 1, so a brand-new template blocks skipping ahead
  // until there's a title and at least one session. Editing an existing template already has every
  // tab populated, so there's nothing to gate — all tabs stay open.
  const tab1Valid = !isNew || (title.trim().length > 0 && steps.length > 0);
  // Shared by Tab 2 and Tab 3 (and the quick-jump buttons on Tab 1) — one "which giai đoạn am I
  // looking at" cursor instead of two separate ones, so jumping from Tab 1 straight into a giai
  // đoạn's lý thuyết or bài tập always lands on the right step.
  const [selectedStepIndexRaw, setSelectedStepIndex] = useState(0);
  // Clamp instead of storing: a step can be removed while another tab still points at it.
  const selectedStepIndex = Math.min(selectedStepIndexRaw, steps.length - 1);
  const [removingStepIndex, setRemovingStepIndex] = useState<number | null>(null);
  const totalMinutes = steps.reduce((sum, s) => sum + (s.durationMin || 0), 0);
  const totalQuestions = steps.reduce((sum, s) => sum + (s.questions?.length ?? 0), 0);

  const goToStage = (i: number, tab: 'theory' | 'exercise') => {
    setSelectedStepIndex(i);
    setActiveTab(tab);
  };

  const load = (t: PlanTemplate | 'new' | null) => {
    setActiveTab('info');
    setPreviewMode(false);
    setSelectedStepIndex(0);
    if (t === 'new' && seed) {
      setTitle(seed.title);
      setDescription(seed.description);
      setConcept(seed.concept ?? '');
      setSteps(seed.steps.length ? seed.steps : [emptyStep()]);
      setSource('ai');
      return;
    }
    if (!t || t === 'new') {
      setTitle('');
      setDescription('');
      setConcept('');
      setSteps([emptyStep()]);
      setSource('manual');
      return;
    }
    setTitle(t.title);
    setDescription(t.description ?? '');
    setConcept(typeof t.concept === 'string' ? t.concept : (t.concept?._id ?? ''));
    setSteps(t.steps.length ? t.steps : [emptyStep()]);
    setSource('manual');
    if (initialStageJump) {
      setSelectedStepIndex(initialStageJump.index);
      setActiveTab(initialStageJump.tab);
    }
  };

  // Dialog.onOpenChange only fires for Radix-driven changes (Escape, overlay click, close button —
  // never for `template` simply switching from null to a row via parent state), so loading had to
  // move here: an effect keyed on the actual data that should trigger a (re)load.
  useEffect(() => {
    if (template) load(template);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, seed, initialStageJump]);

  const updateStep = (i: number, patch: Partial<PlanTemplateStep>) =>
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const moveStep = (i: number, dir: -1 | 1) =>
    setSteps((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const confirmRemoveStep = () => {
    if (removingStepIndex === null) return;
    setSteps((prev) => prev.filter((_, idx) => idx !== removingStepIndex));
    setRemovingStepIndex(null);
  };

  const submit = async (publishAfter: boolean) => {
    if (!title.trim() || steps.length === 0) {
      toast.error('Cần có tiêu đề và ít nhất một buổi học');
      return;
    }
    if (steps.some((s) => !s.title?.trim())) {
      toast.error('Mỗi buổi học cần có tên — kiểm tra lại Tab 1');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        concept: concept.trim() || undefined,
        steps: steps.map((s) => ({
          ...s,
          title: s.title.trim(),
          note: s.note?.trim() || undefined,
          objectives: s.objectives?.map((o) => o.trim()).filter(Boolean) || undefined,
          theoryContent: s.theoryContent?.trim() || undefined,
          questions: s.questions?.length ? s.questions : undefined,
        })),
      };
      const saved = isNew
        ? await createPlanTemplate(payload)
        : existing && (await updatePlanTemplate(existing._id, payload));
      if (publishAfter && saved) {
        // Saved as a draft already — the changelog dialog finishes the publish step next.
        setPublishPrompt(saved);
        setSaving(false);
        return;
      }
      toast.success(isNew ? 'Đã lưu nháp lộ trình mẫu' : 'Đã cập nhật lộ trình mẫu');
      onSaved();
      onClose();
    } catch {
      toast.error('Lưu lộ trình mẫu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const confirmPublish = async (changeLog: string) => {
    if (!publishPrompt) return;
    setPublishing(true);
    try {
      await publishPlanTemplate(publishPrompt._id, changeLog || undefined);
      toast.success('Đã lưu và xuất bản lộ trình mẫu');
      setPublishPrompt(null);
      onSaved();
      onClose();
    } catch {
      toast.error('Xuất bản thất bại — lộ trình vẫn đang ở dạng nháp');
    } finally {
      setPublishing(false);
    }
  };

  const currentStep = steps[selectedStepIndex];
  const stageLabel = (i: number) => `S${i} · Ngày ${steps[i].dayOffset}`;

  // Navigation-only progress (matches the existing unlock rule: Tab 2/3 need tab1Valid) — never a
  // fabricated "content complete" signal, just where the admin currently is in the 3-step flow.
  const stepperSteps: StepperStep[] = [
    { key: 'info', label: '1. Khung lộ trình', state: activeTab === 'info' ? 'current' : 'completed' },
    {
      key: 'theory',
      label: '2. Lý thuyết giai đoạn',
      state: !tab1Valid ? 'locked' : activeTab === 'theory' ? 'current' : 'completed',
    },
    {
      key: 'exercise',
      label: '3. Bài tập từng phần',
      state: !tab1Valid ? 'locked' : activeTab === 'exercise' ? 'current' : 'completed',
    },
  ];

  return (
    <>
      <Dialog open={!!template} onOpenChange={(v) => !v && onClose()}>
        <DialogContent size="full" className="tw-scope flex flex-col gap-0 overflow-hidden p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
            {/* Header: back + tên lộ trình + trạng thái + tổng quan — tab segmented control bên phải. */}
            <div className="flex shrink-0 flex-col gap-3 border-b border-border py-3 pl-5 pr-12">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-muted-foreground hover:bg-muted"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={isNew ? 'Tên lộ trình mới' : ''}
                        className="h-8 min-w-[280px] border-transparent bg-transparent px-1 text-lg font-bold text-foreground shadow-none focus-visible:border-input focus-visible:bg-card"
                      />
                      {!isNew && existing && (
                        <StatusBadge variant={STATUS_VARIANT[existing.status]}>
                          {STATUS_LABEL[existing.status]}
                          {existing.status === 'published' && ` v${existing.version}`}
                        </StatusBadge>
                      )}
                      {source === 'ai' && <SourceBadge source="ai" />}
                    </div>
                    <p className="truncate pl-1 text-xs text-muted-foreground">
                      {steps.length} giai đoạn · {totalMinutes} phút · {totalQuestions} câu hỏi
                      {!isNew && existing && ` · Cập nhật lần cuối ${formatUpdatedAt(existing.updatedAt)}`}
                    </p>
                  </div>
                </div>

                <Stepper
                  steps={stepperSteps}
                  onSelect={(key) => {
                    if (key !== 'info' && !tab1Valid) return;
                    setActiveTab(key);
                  }}
                  className="shrink-0"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => submit(false)} disabled={saving}>
                    Lưu nháp
                  </Button>
                  <Button type="button" onClick={() => submit(true)} disabled={saving}>
                    <Sparkles className="h-4 w-4" /> Lưu & Xuất bản
                  </Button>
                </div>
                <Button
                  type="button"
                  variant={previewMode ? 'default' : 'outline'}
                  onClick={() => setPreviewMode((v) => !v)}
                  disabled={!tab1Valid}
                >
                  <Eye className="h-4 w-4" />{' '}
                  {previewMode ? 'Đang xem trước' : 'Xem trước (góc nhìn sinh viên)'}
                </Button>
              </div>
            </div>

            {previewMode ? (
              <StagePreview
                steps={steps}
                selectedStepIndex={selectedStepIndex}
                onSelectStage={setSelectedStepIndex}
              />
            ) : (
              <>
                {!tab1Valid && (
                  <p className="px-5 pt-2 text-xs text-muted-foreground">
                    Nhập tên lộ trình ở Tab 1 để mở khóa Tab 2 và Tab 3.
                  </p>
                )}

                <TabsContent value="info" className="min-h-0 flex-1 overflow-y-auto p-5">
                  <div className="flex flex-col gap-6">
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-foreground">Thông tin chung</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="Môn học / Học phần">
                          <ConceptSelect
                            value={concept}
                            onChange={setConcept}
                            placeholder="Chọn môn học (không bắt buộc nếu luôn áp dụng kèm mục tiêu)"
                          />
                        </FormField>
                        <FormField label="Tên lộ trình ôn tập" required>
                          <Input
                            placeholder="Ví dụ: Ôn thi cuối kỳ — Giải tích"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                          />
                        </FormField>
                      </div>
                      <FormField label="Mô tả" className="mt-4">
                        <Input
                          placeholder="Mô tả ngắn gọn (không bắt buộc)"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </FormField>
                    </div>

                    <div className="border-t border-border pt-6">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">
                            Khung chương trình các giai đoạn
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Điều chỉnh ngày học, thời lượng và chuyển nhanh sang soạn lý thuyết hoặc bài tập
                            của từng giai đoạn.
                          </p>
                        </div>
                        <AddButton
                          variant="outline"
                          size="sm"
                          onClick={() => setSteps((p) => [...p, emptyStep()])}
                        >
                          Thêm buổi học
                        </AddButton>
                      </div>
                      <SessionBuilder
                        steps={steps}
                        onUpdateStep={updateStep}
                        onMoveStep={moveStep}
                        onRequestRemoveStep={setRemovingStepIndex}
                        onEditTheory={(i) => goToStage(i, 'theory')}
                        onEditExercise={(i) => goToStage(i, 'exercise')}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* UC-PLN-TPL-03: a step is a mini-lesson — theory to read, then a quiz before "done". */}
                <TabsContent value="theory" className="min-h-0 flex-1 overflow-hidden p-0">
                  <div className="flex h-full min-h-0">
                    <StageSidebar
                      steps={steps}
                      selectedIndex={selectedStepIndex}
                      onSelect={setSelectedStepIndex}
                    />
                    <div className="min-w-0 flex-1 overflow-y-auto p-5">
                      {currentStep && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-3 rounded-card border border-border bg-card p-3 shadow-card">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary/10 text-sm font-bold text-primary">
                                S{selectedStepIndex}
                              </span>
                              <div className="min-w-0">
                                <Input
                                  value={currentStep.title ?? ''}
                                  onChange={(e) => updateStep(selectedStepIndex, { title: e.target.value })}
                                  placeholder={`Buổi học ${selectedStepIndex + 1}`}
                                  className="h-7 border-transparent bg-transparent px-0 text-sm font-bold uppercase text-foreground shadow-none focus-visible:border-input focus-visible:bg-card focus-visible:px-2"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Ngày {currentStep.dayOffset} · {currentStep.durationMin} phút ·{' '}
                                  {theoryBlockCount(currentStep.theoryContent)} khối nội dung lý thuyết
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveTab('exercise')}
                            >
                              Chuyển sang Bài tập giai đoạn này →
                            </Button>
                          </div>

                          <FormField label="Mục tiêu đầu ra của giai đoạn">
                            <textarea
                              value={currentStep.objectives?.[0] ?? ''}
                              onChange={(e) =>
                                updateStep(selectedStepIndex, {
                                  objectives: e.target.value ? [e.target.value] : [],
                                })
                              }
                              placeholder='Ví dụ: "Nắm được định nghĩa vật chất của Lênin và quan hệ vật chất – ý thức."'
                              rows={2}
                              className="w-full rounded-control border border-input bg-card px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                          </FormField>

                          <TheoryBlockEditor
                            value={currentStep.theoryContent}
                            onChange={(theoryContent) => updateStep(selectedStepIndex, { theoryContent })}
                          />

                          <button
                            type="button"
                            onClick={() => setActiveTab('exercise')}
                            className="flex items-center justify-between gap-2 rounded-card border border-primary/30 bg-primary/5 p-3 text-left shadow-card hover:bg-primary/10"
                          >
                            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <ListChecks className="h-4 w-4 text-primary" />
                              Bài tập · {stageLabel(selectedStepIndex)}
                              <span className="font-normal text-muted-foreground">
                                ({currentStep.questions?.length ?? 0} câu hỏi)
                              </span>
                            </span>
                            <span className="shrink-0 text-xs font-medium text-primary">Mở →</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="exercise" className="min-h-0 flex-1 overflow-hidden p-0">
                  <div className="flex h-full min-h-0">
                    <StageSidebar
                      steps={steps}
                      selectedIndex={selectedStepIndex}
                      onSelect={setSelectedStepIndex}
                    />
                    <div className="min-w-0 flex-1 overflow-y-auto p-5">
                      {currentStep && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-3 rounded-card border border-border bg-card p-3 shadow-card">
                            <div>
                              <h3 className="text-sm font-bold text-foreground">
                                Bài tập · {stageLabel(selectedStepIndex)} · {currentStep.title}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {currentStep.durationMin} phút · {currentStep.questions?.length ?? 0} câu hỏi
                                trắc nghiệm
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveTab('theory')}
                            >
                              ← Về lý thuyết giai đoạn này
                            </Button>
                          </div>
                          <StageQuestionBank
                            selected={currentStep.questions ?? []}
                            onChange={(questions) => updateStep(selectedStepIndex, { questions })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>
      <PublishChangeLogDialog
        open={!!publishPrompt}
        onOpenChange={(v) => {
          if (!v) {
            // Content was already saved as a draft above — cancelling publish just keeps it a draft.
            setPublishPrompt(null);
            toast('Đã lưu nháp — chưa xuất bản');
            onSaved();
            onClose();
          }
        }}
        onConfirm={confirmPublish}
        submitting={publishing}
      />
      <ConfirmDialog
        open={removingStepIndex !== null}
        onOpenChange={(v) => !v && setRemovingStepIndex(null)}
        title="Xoá buổi học?"
        description={`Buổi học "${removingStepIndex !== null ? steps[removingStepIndex]?.title || `Buổi ${removingStepIndex + 1}` : ''}" cùng toàn bộ lý thuyết và bài tập đã soạn sẽ bị xoá khỏi lộ trình.`}
        onConfirm={confirmRemoveStep}
      />
    </>
  );
}

/** Small icon + label stat shown in the overview strip — replaces a stack of label/value text
 * rows with something scannable at a glance. */
function OverviewChip({ icon: Icon, label }: { icon: typeof Clock; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-badge bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

const ROADMAP_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'ready', label: 'Đủ học liệu' },
  { key: 'review', label: 'Chờ rà soát' },
] as const;

function RoadmapMapDialog({
  template,
  onClose,
  onEditStage,
}: {
  template: PlanTemplate | null;
  onClose: () => void;
  onEditStage: (template: PlanTemplate, index: number, tab: 'theory' | 'exercise') => void;
}) {
  const [questionTextById, setQuestionTextById] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<(typeof ROADMAP_FILTERS)[number]['key']>('all');
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const conceptId = template
    ? typeof template.concept === 'string'
      ? template.concept
      : template.concept?._id
    : undefined;

  useEffect(() => {
    setFilter('all');
    setHeaderCollapsed(false);
    if (!conceptId) {
      setQuestionTextById({});
      return;
    }
    listQuestions({ concept: conceptId, limit: 200 }).then((res) => {
      setQuestionTextById(Object.fromEntries(res.data.map((q) => [q._id, q.text])));
    });
  }, [conceptId, template?._id]);

  const totalMinutes = template?.steps.reduce((sum, s) => sum + (s.durationMin || 0), 0) ?? 0;
  const totalQuestions = template?.steps.reduce((sum, s) => sum + (s.questions?.length ?? 0), 0) ?? 0;
  const readyCount = template?.steps.filter(isStepReady).length ?? 0;
  const reviewCount = (template?.steps.length ?? 0) - readyCount;
  const allReady = template ? readyCount === template.steps.length : true;
  const filterCount: Record<(typeof ROADMAP_FILTERS)[number]['key'], number> = {
    all: template?.steps.length ?? 0,
    ready: readyCount,
    review: reviewCount,
  };

  return (
    <Dialog open={!!template} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        expandable
        size="xl"
        className="tw-scope flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0"
      >
        {template && (
          <>
            {/* ── Dialog title bar ── */}
            <div className="flex shrink-0 items-center gap-3 border-b border-border bg-muted/30 px-5 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary">
                <Map className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  Bản đồ lộ trình · {template.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {template.steps.length} buổi · {totalMinutes} phút · {totalQuestions} câu hỏi
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHeaderCollapsed((v) => !v)}
                title={headerCollapsed ? 'Mở rộng thông tin' : 'Thu gọn thông tin'}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {headerCollapsed ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                )}
              </button>
            </div>

            {/* ── Overview cards (collapsible) ── */}
            {!headerCollapsed && (
            <div className="shrink-0 border-b border-border p-5">
              <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
                <div className="flex gap-3 rounded-card bg-primary-soft p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary text-primary-foreground">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="break-words font-bold text-foreground">{template.title}</h2>
                    {template.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{template.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <OverviewChip icon={ListChecks} label={`${template.steps.length} buổi học`} />
                      <OverviewChip icon={Clock} label={`${totalMinutes} phút`} />
                      <OverviewChip icon={BookOpen} label={`${totalQuestions} câu hỏi`} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-card border border-border p-4">
                  <span
                    className={cn(
                      'flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2 text-sm font-bold',
                      allReady ? 'border-success text-success' : 'border-warning text-warning',
                    )}
                  >
                    {readyCount}/{template.steps.length}
                  </span>
                  <div className="min-w-0 flex-1 text-xs text-muted-foreground">
                    <p className="mb-1.5 font-medium text-foreground">Buổi sẵn sàng</p>
                    <p className="flex items-center gap-1">
                      <CalendarClock className="h-3 w-3 shrink-0" /> Cập nhật{' '}
                      {formatUpdatedAt(template.updatedAt)}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1">
                      <UserRound className="h-3 w-3 shrink-0" />{' '}
                      {template.authorName ?? 'Không rõ người biên soạn'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Cấu trúc lộ trình · Cây so le 2 bên
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Các buổi học nối tiếp nhau theo trục chương trình, nhấp vào từng buổi để xem lý thuyết và
                    ngân hàng câu hỏi.
                  </p>
                </div>
                <div className="flex shrink-0 gap-1 rounded-control border border-border bg-muted/40 p-1">
                  {ROADMAP_FILTERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFilter(f.key)}
                      className={cn(
                        'rounded-control px-2.5 py-1 text-xs font-medium transition-colors',
                        filter === f.key
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {f.label} ({filterCount[f.key]})
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
                  <Flag className="h-3.5 w-3.5" /> Bắt đầu lộ trình · {template.steps.length} buổi ·{' '}
                  {totalMinutes} phút
                </span>
              </div>

              <TemplateStepTree
                steps={template.steps}
                questionTextById={questionTextById}
                filter={filter}
                onEditStage={(index, tab) => onEditStage(template, index, tab)}
              />
            </div>

            {template.changeLog && (
              <div className="flex shrink-0 items-start gap-2 border-t border-border bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  <span className="font-semibold text-foreground">Ghi chú</span> · {template.changeLog}
                </p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** UC-PLN-TPL-04: asks AI to draft a whole template (title + buổi học with theory), then hands the
 * result to TemplateFormDialog as a `seed` — the admin's real review happens there (edit/remove any
 * buổi before saving), not in a separate review workspace. */
function AiGenerateDialog({
  open,
  onOpenChange,
  onDraft,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDraft: (seed: TemplateSeed) => void;
}) {
  const [concept, setConcept] = useState('');
  const [topic, setTopic] = useState('');
  const [sessionCount, setSessionCount] = useState(4);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    if (!concept && !topic.trim()) {
      toast.error('Chọn khái niệm hoặc nhập chủ đề');
      return;
    }
    setGenerating(true);
    try {
      const draft = await generateTemplateDraft({
        conceptId: concept || undefined,
        topic: topic.trim() || undefined,
        sessionCount,
      });
      if (!draft.valid) {
        toast('AI trả về không đúng định dạng — đã dùng lộ trình chia đều buổi học, kiểm tra lại nội dung.');
      }
      onDraft({
        title: draft.title,
        description: draft.description,
        concept: concept || undefined,
        steps: draft.steps.map((s, i) => ({
          dayOffset: s.dayOffset,
          durationMin: s.durationMin,
          title: s.note || `Buổi ${i + 1}`,
          theoryContent: s.theoryContent,
          objectives: [],
          questions: [],
        })),
      });
      onOpenChange(false);
      setConcept('');
      setTopic('');
    } catch {
      toast.error('Tạo lộ trình bằng AI thất bại');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="tw-scope">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Tạo tự động bằng AI
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <FormField label="Khái niệm (ưu tiên nếu có)">
            <ConceptSelect value={concept} onChange={setConcept} parentConcept={null} />
          </FormField>
          <FormField label="Hoặc chủ đề tự do">
            <Input
              placeholder="Ví dụ: Ôn tập Giải tích 1 — Giới hạn"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={!!concept}
            />
          </FormField>
          <FormField label="Số buổi học">
            <Input
              type="number"
              min={1}
              max={20}
              value={sessionCount}
              onChange={(e) => setSessionCount(Number(e.target.value))}
            />
          </FormField>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" onClick={generate} disabled={generating}>
            <Sparkles className="h-4 w-4" /> {generating ? 'Đang tạo…' : 'Tạo bản nháp'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PlanTemplateAdmin() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);
  const [editing, setEditing] = useState<PlanTemplate | 'new' | null>(null);
  const [editStageJump, setEditStageJump] = useState<{ index: number; tab: 'theory' | 'exercise' } | null>(
    null,
  );
  const [aiSeed, setAiSeed] = useState<TemplateSeed | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [viewing, setViewing] = useState<PlanTemplate | null>(null);
  const [deleting, setDeleting] = useState<PlanTemplate | null>(null);
  const [publishing, setPublishing] = useState<PlanTemplate | null>(null);
  const [publishSubmitting, setPublishSubmitting] = useState(false);

  const reload = () => setTableKey((k) => k + 1);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await removePlanTemplate(deleting._id);
      toast.success(`Đã xoá lộ trình mẫu "${deleting.title}"`);
      reload();
    } catch {
      toast.error('Xoá lộ trình mẫu thất bại');
    } finally {
      setDeleting(null);
    }
  };

  const confirmPublishRow = async (changeLog: string) => {
    if (!publishing) return;
    setPublishSubmitting(true);
    try {
      await publishPlanTemplate(publishing._id, changeLog || undefined);
      toast.success(`Đã xuất bản "${publishing.title}"`);
      setPublishing(null);
      reload();
    } catch {
      toast.error('Xuất bản thất bại');
    } finally {
      setPublishSubmitting(false);
    }
  };

  const handleArchive = async (row: PlanTemplate) => {
    try {
      await archivePlanTemplate(row._id);
      toast.success(`Đã lưu trữ "${row.title}"`);
      reload();
    } catch {
      toast.error('Lưu trữ thất bại');
    }
  };

  const columns: ColumnDef<PlanTemplate>[] = [
    { accessorKey: 'title', header: 'Tên lộ trình', meta: { enableColumnSearch: true } },
    {
      accessorKey: 'description',
      header: 'Mô tả',
      cell: ({ getValue }) => <ClampLine text={getValue<string>() || '—'} />,
    },
    {
      id: 'concept',
      header: 'Khái niệm mặc định',
      cell: ({ row }) =>
        conceptName(row.original.concept) || <span className="text-muted-foreground">—</span>,
    },
    { id: 'steps', header: 'Số buổi học', cell: ({ row }) => row.original.steps.length },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <StatusBadge variant={STATUS_VARIANT[row.original.status]}>
          {STATUS_LABEL[row.original.status]}
          {row.original.status === 'published' && ` (v${row.original.version})`}
        </StatusBadge>
      ),
    },
  ];

  return (
    <AppShell
      menu={adminMenu}
      title="Lộ trình mẫu"
      breadcrumb={['Trang chủ', 'Quản trị nội dung', 'Lộ trình mẫu']}
      userName={user?.fullName ?? ''}
      roleLabel="Quản trị viên"
      compactHeader
      area="admin"
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Lộ trình mẫu</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setAiOpen(true)}>
            <Sparkles className="h-4 w-4" /> Tạo tự động
          </Button>
          <AddButton onClick={() => setEditing('new')}>Thêm mới</AddButton>
        </div>
      </div>
      <DataTablePage<PlanTemplate>
        key={tableKey}
        columns={columns}
        getRowId={(r) => r._id}
        searchPlaceholder="Tìm theo tên lộ trình…"
        emptyLabel="Chưa có lộ trình mẫu nào"
        fetcher={async ({ page, pageSize }) => {
          const res = await listPlanTemplates({ page, limit: pageSize });
          return { data: res.data, total: res.meta?.total ?? res.data.length };
        }}
        toolbarActions={[
          { key: 'new', label: 'Lộ trình mẫu mới', onSelect: () => setEditing('new') },
          {
            key: 'export',
            label: 'Xuất lộ trình mẫu',
            onSelect: async () => {
              const items = await exportPlanTemplates();
              const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'lo-trinh-mau.json';
              a.click();
              URL.revokeObjectURL(url);
            },
          },
          {
            key: 'import',
            label: 'Nhập lộ trình mẫu (dán JSON)',
            onSelect: async () => {
              const raw = window.prompt('Dán danh sách lộ trình mẫu dạng JSON (mảng object title/steps...)');
              if (!raw) return;
              try {
                const items = JSON.parse(raw);
                const res = await importPlanTemplates(items);
                toast(`Đã nhập ${res.createdCount} lộ trình mẫu, ${res.errorCount} lỗi`);
                reload();
              } catch {
                toast('JSON không hợp lệ');
              }
            },
          },
        ]}
        rowActions={[
          { key: 'view', label: 'Bản đồ lộ trình', icon: <Map />, onSelect: (row) => setViewing(row) },
          { key: 'edit', label: 'Chỉnh sửa', icon: <Pencil />, onSelect: (row) => setEditing(row) },
          {
            key: 'publish',
            label: 'Xuất bản',
            icon: <Sparkles />,
            hidden: (row) => row.status === 'published',
            onSelect: (row) => setPublishing(row),
          },
          {
            key: 'archive',
            label: 'Lưu trữ',
            icon: <Trash2 />,
            hidden: (row) => row.status === 'archived',
            onSelect: handleArchive,
          },
          {
            key: 'delete',
            label: 'Xoá',
            icon: <Trash2 />,
            danger: true,
            onSelect: (row) => setDeleting(row),
          },
        ]}
      />

      <TemplateFormDialog
        template={editing}
        seed={aiSeed}
        initialStageJump={editStageJump}
        onClose={() => {
          setEditing(null);
          setAiSeed(null);
          setEditStageJump(null);
        }}
        onSaved={reload}
      />
      <AiGenerateDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        onDraft={(seed) => {
          setAiSeed(seed);
          setEditing('new');
        }}
      />
      <RoadmapMapDialog
        template={viewing}
        onClose={() => setViewing(null)}
        onEditStage={(t, index, tab) => {
          setViewing(null);
          setEditStageJump({ index, tab });
          setEditing(t);
        }}
      />
      <PublishChangeLogDialog
        open={!!publishing}
        onOpenChange={(v) => !v && setPublishing(null)}
        onConfirm={confirmPublishRow}
        submitting={publishSubmitting}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Xoá lộ trình mẫu?"
        description={`Lộ trình "${deleting?.title ?? ''}" sẽ bị xoá khỏi danh sách cho sinh viên chọn.`}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}
