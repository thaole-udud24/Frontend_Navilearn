import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  BookOpen,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  LayoutTemplate,
  Network,
  PauseCircle,
  PenLine,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { AppShell } from '@/layouts/AppShell';
import { SubjectFilterPill } from '@/components/GlobalSubjectFilter';
import { useAuthStore } from '@/hooks/useAuth';
import { useSelectedSubject } from '@/hooks/useSubjectStore';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { AddButton } from '@/components/ui/add-button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Stepper, type StepperStep } from '@/components/ui/stepper';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ConceptSelect } from '@/components/ConceptSelect';
import { generateStudyPlan } from '@/services/ai-assist';
import { checkReplan, replan } from '@/services/adaptive';
import { applyPlanTemplate, listPlanTemplates } from '@/services/plan-template';
import { planTemplateKeys } from '@/services/plan-template/queryKeys';
import {
  activateGoal,
  addSession,
  closeGoal,
  confirmPlan,
  createPlan,
  getOpenDraft,
  listGoals,
  listPlans,
  pauseGoal,
  removeGoal,
  removePlan,
  removeSession,
  resumeGoal,
  saveDraftGoal,
  updateGoal,
  updateSession,
} from '@/services/planning';
import { planningKeys } from '@/services/planning/queryKeys';
import type { Goal, GoalOverlapWarning, Plan, PlanSession } from '@/services/planning/types';
import { listStudentDocuments, uploadStudentDocument } from '@/services/student-document';
import type { StudentDocument } from '@/services/student-document/types';
import { listAssets } from '@/services/asset';
import type { Asset } from '@/services/asset/types';
import { getConcept, getSubjectGraph } from '@/services/knowledge';
import { listMasteries } from '@/services/mastery';
import { startPlacementCheck } from '@/services/assessment';
import { CalendarScheduleCard, type ScheduleItem } from './components/CalendarScheduleCard';
import { RoadmapStagesSection } from './LearningRoadmap';
import { RoadmapTree } from './components/RoadmapTree';
import { SessionQuizDialog } from './components/SessionQuizDialog';
import { AssessmentDialog } from './components/AssessmentDialog';
import { ROLE_LABEL } from './MyDocuments';
import type { ApiError } from '@/services/apiError';

const conceptName = (c: Goal['concept']) => (typeof c === 'string' ? c : c.name);

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
// Phase C (wireframe S2-S5): 6 steps collapsed into 4 — "Mục tiêu" merges the old subject+target
// steps (no baseline here), "Thời gian" replaces the raw day-count with explicit dates, "Tài liệu"
// gained shared/personal/upload tabs, and "Lộ trình" now merges the optional baseline check with
// path creation (AI/mẫu/tự thiết kế) + activation, instead of ending at a plain "Xác nhận".
const WIZARD_STEPS = ['Mục tiêu', 'Thời gian', 'Tài liệu', 'Lộ trình'];

const EXAM_FORMATS = ['Trắc nghiệm', 'Tự luận', 'Trắc nghiệm + Tự luận', 'Vấn đáp', 'Khác'];

type PathChoice = 'ai' | 'template' | 'manual';
type DocSource = 'shared' | 'mine' | 'upload';

function formatDocSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Calendar days from start to end (inclusive) minus days on a rest weekday — mirrors
// planning.goal.model.js's deriveStudyDays so the quota card matches what the server will store.
function deriveStudyDaysClient(start: string, end: string, restDays: number[]): number | null {
  if (!start || !end) return null;
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  const totalDays = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  if (totalDays <= 0) return null;
  if (!restDays.length) return totalDays;
  let rest = 0;
  for (let i = 0; i < totalDays; i += 1) {
    const d = new Date(s);
    d.setUTCDate(d.getUTCDate() + i);
    if (restDays.includes(d.getUTCDay())) rest += 1;
  }
  return Math.max(totalDays - rest, 1);
}

/** 4-step goal creation wizard (Phase C) — "Mục tiêu · Thời gian · Tài liệu · Lộ trình". The final
 * step both activates the draft and immediately kicks off path creation (AI/mẫu/tự thiết kế),
 * unlike the old wizard which just ended at "Xác nhận" and left path creation as a separate step. */
function GoalWizardDialog({
  onCreated,
  onActivated,
  initialConcept,
  forceOpen,
  onForceOpenHandled,
}: {
  onCreated: () => void;
  /** Fired once the goal is activated, with whichever path-creation card the student picked — the
   * parent runs the actual AI/template/manual action (it already owns those mutations/dialogs). */
  onActivated: (goal: Goal, choice: PathChoice) => void;
  /** Pre-fills and locks the concept — used when arriving from "Khoá học của tôi" with a subject
   * already chosen (so the student doesn't have to pick it again). */
  initialConcept?: string;
  /** Opens the dialog immediately (once) instead of waiting for the trigger button click. */
  forceOpen?: boolean;
  onForceOpenHandled?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const [concept, setConcept] = useState('');
  const [examName, setExamName] = useState('');
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [targetScore, setTargetScore] = useState('5');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [examScope, setExamScope] = useState('');
  const [examFormat, setExamFormat] = useState('');
  const [selfReportedScore, setSelfReportedScore] = useState('');

  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [minutesPerDay, setMinutesPerDay] = useState('');
  const [restDays, setRestDays] = useState<number[]>([]);
  const [overlapWarning, setOverlapWarning] = useState<GoalOverlapWarning | null>(null);

  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const [assetIds, setAssetIds] = useState<string[]>([]);
  const [docSource, setDocSource] = useState<DocSource>('shared');
  const [docSearch, setDocSearch] = useState('');

  const [placementAttemptId, setPlacementAttemptId] = useState<string | null>(null);
  const [skipBaseline, setSkipBaseline] = useState(false);
  const [pathChoice, setPathChoice] = useState<PathChoice | null>('ai');
  const [draftId, setDraftId] = useState<string | null>(null);

  // B2: the student's single open draft (if any) — used both for the "Tiếp tục thiết lập" resume
  // and to avoid orphaning a draft when the student re-opens the wizard mid-way.
  const { data: openDraft } = useQuery({
    queryKey: ['planning-goal-draft'],
    queryFn: getOpenDraft,
  });

  const loadDraft = (draft: Goal) => {
    setDraftId(draft._id);
    setConcept(typeof draft.concept === 'string' ? draft.concept : draft.concept?._id ?? '');
    setExamName(draft.examName ?? '');
    setTitle(draft.title ?? '');
    setTitleTouched(!!draft.title);
    setTargetScore(draft.targetScore != null ? String(draft.targetScore) : '5');
    setExamScope(draft.examScope ?? '');
    setExamFormat(draft.examFormat ?? '');
    setSelfReportedScore(draft.selfReportedScore != null ? String(draft.selfReportedScore) : '');
    setStartDate(draft.startDate ? draft.startDate.slice(0, 10) : '');
    setDeadline(draft.deadline ? draft.deadline.slice(0, 10) : '');
    setMinutesPerDay(draft.minutesPerDay != null ? String(draft.minutesPerDay) : '');
    setRestDays(draft.restDays ?? []);
    setDocumentIds(draft.documentIds ?? []);
    setAssetIds(draft.assetIds ?? []);
    setStep(Math.max((draft.wizardStep ?? 1) - 1, 0));
  };

  const { data: conceptDetail } = useQuery({
    queryKey: ['concept-for-wizard', concept],
    queryFn: () => getConcept(concept),
    enabled: !!concept,
  });
  const conceptLabel = conceptDetail?.name ?? '';

  const { data: masteryRes } = useQuery({
    queryKey: ['mastery-for-wizard-all'],
    queryFn: () => listMasteries({ limit: 200 }),
    enabled: open && step === 3 && !!concept,
  });
  const { data: subjectGraphRes } = useQuery({
    queryKey: ['subject-graph-for-wizard', concept],
    queryFn: () => getSubjectGraph(concept),
    enabled: open && step === 3 && !!concept,
  });
  const topicMasteryRows = (() => {
    const graphNodes = subjectGraphRes?.data ?? [];
    const masteryMap = new Map<string, number>();
    (masteryRes?.data ?? []).forEach((m) => {
      const id = !m.concept ? null : typeof m.concept === 'string' ? m.concept : m.concept._id;
      if (id) masteryMap.set(id, m.score);
    });
    return graphNodes.slice(0, 6).map((n) => ({
      id: n._id,
      name: n.name,
      score: masteryMap.get(n._id) ?? 0,
    }));
  })();

  const placementMutation = useMutation({
    mutationFn: () => startPlacementCheck(concept),
    onSuccess: (attempt) => setPlacementAttemptId(attempt._id),
    onError: (err) => toast.error((err as ApiError).message || 'Không thể bắt đầu bài đầu vào — có thể chưa có câu hỏi cho môn này'),
  });

  // Step 3 "Kho chung": shared/admin tài liệu for this subject.
  const { data: sharedAssetsRes } = useQuery({
    queryKey: ['assets-for-wizard', concept],
    queryFn: () => listAssets({ concept, limit: 50 }),
    enabled: open && step === 2 && !!concept,
  });
  const sharedAssets = sharedAssetsRes?.data ?? [];

  const { data: docsRes, refetch: refetchDocs } = useQuery({
    queryKey: ['student-documents', 'wizard'],
    queryFn: () => listStudentDocuments({ limit: 50 }),
    enabled: open,
  });
  const documents = docsRes?.data ?? [];

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadStudentDocument({ file, title: file.name }),
    onSuccess: (doc) => {
      toast.success('Đã tải tài liệu lên');
      setDocumentIds((ids) => [...ids, doc._id]);
      setDocSource('mine');
      refetchDocs();
    },
    onError: (err) => toast.error((err as ApiError).message || 'Tải tài liệu thất bại'),
  });

  const reset = () => {
    setStep(0);
    setConcept('');
    setExamName('');
    setTitle('');
    setTitleTouched(false);
    setTargetScore('5');
    setAdvancedOpen(false);
    setExamScope('');
    setExamFormat('');
    setSelfReportedScore('');
    setStartDate('');
    setDeadline('');
    setMinutesPerDay('');
    setRestDays([]);
    setOverlapWarning(null);
    setDocumentIds([]);
    setAssetIds([]);
    setDocSource('shared');
    setDocSearch('');
    setPlacementAttemptId(null);
    setPathChoice(null);
    setDraftId(null);
  };

  // Opening fresh (not via "Tiếp tục thiết lập"): resume the existing draft unless it's for a
  // different subject than the one the student is starting from — in that case, start a new
  // draft (it simply replaces the old one on the next save, since there's only one draft slot).
  const openFresh = () => {
    const draftConcept = openDraft ? (typeof openDraft.concept === 'string' ? openDraft.concept : openDraft.concept?._id) : null;
    if (openDraft && (!initialConcept || !draftConcept || draftConcept === initialConcept)) {
      loadDraft(openDraft);
    } else {
      reset();
      setConcept(initialConcept ?? '');
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!forceOpen) return;
    openFresh();
    onForceOpenHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceOpen]);

  // "Chinh phục <score> điểm <subject> — <examName>" — auto-generated until the student taps the
  // title to edit it by hand (titleTouched).
  const autoTitle =
    concept && conceptLabel && targetScore
      ? `Chinh phục ${targetScore} điểm ${conceptLabel}${examName ? ` — ${examName}` : ''}`
      : '';
  useEffect(() => {
    if (!titleTouched && autoTitle) setTitle(autoTitle);
  }, [autoTitle, titleTouched]);

  // Quota card ("<N> giờ = <days> ngày × <minutes> phút", "Đã trừ <N> ngày nghỉ") — mirrors the
  // server's deriveStudyDays so what's shown here matches what gets stored.
  const totalCalendarDays =
    startDate && deadline
      ? Math.round(
          (new Date(`${deadline}T00:00:00Z`).getTime() - new Date(`${startDate}T00:00:00Z`).getTime()) / 86400000,
        ) + 1
      : null;
  const derivedStudyDays = deriveStudyDaysClient(startDate, deadline, restDays);
  const restDaysSubtracted =
    totalCalendarDays != null && derivedStudyDays != null ? totalCalendarDays - derivedStudyDays : 0;
  const totalHours =
    derivedStudyDays && minutesPerDay
      ? Math.round(((derivedStudyDays * Number(minutesPerDay)) / 60) * 10) / 10
      : null;

  const draftPayload = (wizardStep: number) => ({
    wizardStep,
    concept: concept || undefined,
    title: title || undefined,
    examName: examName || undefined,
    targetScore: targetScore ? Number(targetScore) : undefined,
    startDate: startDate ? new Date(startDate).toISOString() : undefined,
    deadline: deadline ? new Date(deadline).toISOString() : undefined,
    minutesPerDay: minutesPerDay ? Number(minutesPerDay) : undefined,
    restDays: restDays.length ? restDays : undefined,
    examScope: examScope || undefined,
    examFormat: examFormat || undefined,
    selfReportedScore: selfReportedScore ? Number(selfReportedScore) : undefined,
    documentIds: documentIds.length ? documentIds : undefined,
    assetIds: assetIds.length ? assetIds : undefined,
  });

  // Saved after each step (not per keystroke) so closing the dialog mid-way keeps progress. Also
  // carries the Phase C overlap warning back, when the draft-save response includes one.
  const saveDraftMutation = useMutation({
    mutationFn: (wizardStep: number) => saveDraftGoal(draftPayload(wizardStep)),
    onSuccess: (draft) => {
      setDraftId(draft._id);
      setOverlapWarning(draft.overlapWarning ?? null);
    },
    onError: (err) => toast.error((err as ApiError).message || 'Không thể lưu nháp'),
  });

  // Step 2 "Thời gian": debounced overlap check — re-saving the draft is cheaper than a dedicated
  // endpoint and already carries `overlapWarning` in its response (see planning.service.js).
  useEffect(() => {
    if (step !== 1) return;
    if (!startDate || !deadline || !minutesPerDay) {
      setOverlapWarning(null);
      return;
    }
    const t = setTimeout(() => saveDraftMutation.mutate(2), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, startDate, deadline, minutesPerDay, restDays.join(',')]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title || `Ôn thi ${examName || 'môn học'}`,
        concept,
        deadline: new Date(deadline).toISOString(),
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        targetScore: targetScore ? Number(targetScore) : undefined,
        examName: examName || undefined,
        minutesPerDay: minutesPerDay ? Number(minutesPerDay) : undefined,
        restDays: restDays.length ? restDays : undefined,
        examScope: examScope || undefined,
        examFormat: examFormat || undefined,
        selfReportedScore: selfReportedScore ? Number(selfReportedScore) : undefined,
        documentIds: documentIds.length ? documentIds : undefined,
        assetIds: assetIds.length ? assetIds : undefined,
      };
      // The wizard always has a draft by the final step (created on the first "Tiếp tục"); this
      // guards only the edge case of landing on step 4 without ever advancing.
      const id = draftId ?? (await saveDraftGoal(draftPayload(step + 1)))._id;
      return activateGoal(id, payload);
    },
    onSuccess: (goal) => {
      toast.success('Đã tạo mục tiêu học tập — đang khởi tạo lộ trình…');
      setOpen(false);
      onCreated();
      if (pathChoice) onActivated(goal, pathChoice);
      reset();
    },
    onError: (err) => toast.error((err as ApiError).message || 'Tạo mục tiêu thất bại'),
  });

  const canNext = [!!concept, !!startDate && !!deadline && !!minutesPerDay, true, !!pathChoice][step];

  const steps: StepperStep[] = WIZARD_STEPS.map((label, i) => ({
    key: String(i),
    label,
    state: i === step ? 'current' : i < step ? 'completed' : 'locked',
  }));

  const toggleRestDay = (d: number) =>
    setRestDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  const visibleDocs: Array<StudentDocument | Asset> = docSource === 'shared' ? sharedAssets : documents;
  const filteredDocs = visibleDocs.filter((d) => d.title.toLowerCase().includes(docSearch.trim().toLowerCase()));
  const selectedDocTitles = [
    ...documents.filter((d) => documentIds.includes(d._id)).map((d) => d.title),
    ...sharedAssets.filter((a) => assetIds.includes(a._id)).map((a) => a.title),
  ];

  const PATH_OPTIONS: Array<{ key: PathChoice; title: string; desc: string; icon: typeof Sparkles; badge?: string }> = [
    {
      key: 'ai',
      title: 'A · AI cá nhân hóa',
      desc: 'Hệ thống dựng lộ trình theo năng lực + quỹ thời gian (AI gọi qua API).',
      icon: Sparkles,
      badge: 'Khuyến nghị',
    },
    {
      key: 'template',
      title: 'B · Lộ trình mẫu của Admin',
      desc: 'Chọn lộ trình đã xuất bản cho môn này, hệ thống tự co giãn theo quỹ thời gian.',
      icon: LayoutTemplate,
    },
    {
      key: 'manual',
      title: 'C · Tự thiết kế',
      desc: 'Tự sắp chặng và mục học; hệ thống kiểm tra phủ phạm vi.',
      icon: PenLine,
    },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <AddButton size="sm" onClick={openFresh}>
        Mục tiêu mới
      </AddButton>
      <DialogContent size="lg" className="tw-scope flex max-h-[88vh] flex-col">
        <DialogHeader>
          <DialogTitle>Thiết lập mục tiêu ôn thi</DialogTitle>
        </DialogHeader>
        <Stepper steps={steps} className="mb-2 flex-wrap" />
        <div className="flex min-h-[220px] flex-col gap-3 overflow-y-auto">
          {step === 0 && (
            <>
              <ConceptSelect
                value={concept}
                onChange={setConcept}
                parentConcept={null}
                placeholder="Ôn môn gì?"
                disabled={!!initialConcept}
              />
              <Input placeholder="Kỳ thi (ví dụ: Giữa kỳ, Cuối kỳ…)" value={examName} onChange={(e) => setExamName(e.target.value)} />

              <div>
                <p className="mb-1 text-xs text-muted-foreground">Điểm mong muốn (thang điểm 10)</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.5}
                    value={targetScore || '5'}
                    onChange={(e) => setTargetScore(e.target.value)}
                    className="h-2 flex-1 accent-primary"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    className="w-20"
                    value={targetScore}
                    onChange={(e) => setTargetScore(e.target.value)}
                  />
                </div>
                <div className="relative mt-0.5 h-3 text-[10px] text-muted-foreground">
                  <span className="absolute left-0">0</span>
                  <span className="absolute left-1/2 -translate-x-1/2">5</span>
                  <span className="absolute left-[80%] -translate-x-1/2">8</span>
                  <span className="absolute right-0">10</span>
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs text-muted-foreground">Tên mục tiêu</p>
                {titleTouched ? (
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                ) : (
                  <button
                    type="button"
                    onClick={() => setTitleTouched(true)}
                    className="flex w-full items-center justify-between gap-2 rounded-control border border-dashed border-border bg-muted/30 px-3 py-2 text-left text-sm text-foreground"
                  >
                    <span className="truncate">{title || 'Chọn môn + điểm mong muốn để tự đặt tên'}</span>
                    <PenLine className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="w-fit text-xs font-medium text-primary"
              >
                {advancedOpen ? '▾' : '▸'} Tùy chọn nâng cao
              </button>
              {advancedOpen && (
                <div className="flex flex-col gap-2 rounded-control border border-border bg-muted/20 p-3">
                  <Input
                    placeholder="Phạm vi kiến thức thi"
                    value={examScope}
                    onChange={(e) => setExamScope(e.target.value)}
                  />
                  <select
                    value={examFormat}
                    onChange={(e) => setExamFormat(e.target.value)}
                    className="h-10 rounded-control border border-input bg-card px-3 text-sm text-foreground"
                  >
                    <option value="">Hình thức thi — chọn…</option>
                    {EXAM_FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    placeholder="Điểm số hiện tại (tự khai)"
                    value={selfReportedScore}
                    onChange={(e) => setSelfReportedScore(e.target.value)}
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Lộ trình giúp bạn chuẩn bị; hệ thống không đảm bảo kết quả thi.
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Ngày bắt đầu ôn</p>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Ngày thi / kết thúc ôn</p>
                  <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs text-muted-foreground">Số phút ôn mỗi ngày</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={10}
                    max={240}
                    step={5}
                    value={minutesPerDay || '60'}
                    onChange={(e) => setMinutesPerDay(e.target.value)}
                    className="h-2 flex-1 accent-primary"
                  />
                  <Input
                    type="number"
                    min={10}
                    max={480}
                    className="w-20"
                    value={minutesPerDay}
                    onChange={(e) => setMinutesPerDay(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs text-muted-foreground">Ngày nghỉ trong tuần</p>
                <div className="flex gap-1.5">
                  {WEEKDAYS.map((label, d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleRestDay(d)}
                      className={`h-8 w-9 rounded-control border text-xs font-medium transition-colors ${
                        restDays.includes(d)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-muted-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {derivedStudyDays != null && minutesPerDay && (
                <div className="rounded-control border border-border bg-muted/30 p-3 text-sm">
                  <p className="font-medium text-foreground">
                    ~{totalHours} giờ = {derivedStudyDays} ngày × {minutesPerDay} phút
                  </p>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.min(
                          (derivedStudyDays / (totalCalendarDays || derivedStudyDays)) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                  {restDaysSubtracted > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">Đã trừ {restDaysSubtracted} ngày nghỉ</p>
                  )}
                </div>
              )}

              {/* v2.1 §4.4: Feasibility Check (r = thời gian cần / thời gian có sẵn sau khi trừ 15% dự phòng) */}
              {derivedStudyDays != null && minutesPerDay && (() => {
                const totalMinutes = derivedStudyDays * Number(minutesPerDay);
                const availableMinutes = totalMinutes * 0.85;
                const score = Number(targetScore || 7);
                const neededMinutes = score >= 8.5 ? 1200 : score >= 7.5 ? 960 : score >= 6 ? 720 : 480;
                const ratio = availableMinutes > 0 ? neededMinutes / availableMinutes : 99;
                const tone =
                  ratio < 0.9
                    ? { border: 'border-success/40 bg-success/5 text-success', label: 'Đủ thời gian' }
                    : ratio <= 1
                      ? { border: 'border-warning/40 bg-warning/5 text-warning', label: 'Sát quỹ thời gian' }
                      : { border: 'border-danger/40 bg-danger/5 text-danger', label: 'Không đủ thời gian' };
                const missingHours = Math.max(1, Math.ceil((neededMinutes - availableMinutes) / 60));
                return (
                  <div className={`rounded-control border p-3 text-sm ${tone.border}`}>
                    <div className="flex items-center justify-between gap-2 font-semibold">
                      <span>Kiểm tra khả thi quỹ thời gian: {tone.label}</span>
                      <span className="text-xs">r = {ratio.toFixed(2)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Khả dụng (trừ 15% dự phòng): ~{Math.round((availableMinutes / 60) * 10) / 10} giờ · Ước tính cần cho mục tiêu {score}/10: ~{Math.round(neededMinutes / 60)} giờ.
                      {ratio > 1 && ` Thiếu khoảng ${missingHours} giờ — gợi ý tăng phút/ngày hoặc kéo dài ngày ôn.`}
                    </p>
                  </div>
                );
              })()}

              {overlapWarning && (
                <div className="flex items-start gap-2 rounded-control border border-warning/30 bg-warning/5 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <p>
                    Bạn có thêm mục tiêu ACTIVE: {overlapWarning.subjects.join(', ')} — tổng{' '}
                    {overlapWarning.totalMinutesPerDay} phút/ngày trong {overlapWarning.overlapDays} ngày chồng nhau.
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Tự lưu nháp khi chuyển bước.</p>
            </>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              <Tabs value={docSource} onValueChange={(v) => setDocSource(v as DocSource)}>
                <TabsList>
                  <TabsTrigger value="shared">Kho chung</TabsTrigger>
                  <TabsTrigger value="mine">Của tôi</TabsTrigger>
                  <TabsTrigger value="upload">Tải mới</TabsTrigger>
                </TabsList>
              </Tabs>

              {docSource !== 'upload' && (
                <>
                  <Input placeholder="Tìm tài liệu…" value={docSearch} onChange={(e) => setDocSearch(e.target.value)} />
                  <div className="max-h-[200px] overflow-y-auto rounded-control border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8" />
                          <TableHead>Tên tài liệu</TableHead>
                          <TableHead>Vai trò</TableHead>
                          <TableHead>Nguồn</TableHead>
                          <TableHead>Kích thước</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDocs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                              Không có tài liệu nào.
                            </TableCell>
                          </TableRow>
                        )}
                        {filteredDocs.map((doc) => {
                          const isShared = docSource === 'shared';
                          const checked = isShared ? assetIds.includes(doc._id) : documentIds.includes(doc._id);
                          return (
                            <TableRow key={doc._id}>
                              <TableCell>
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(v) => {
                                    if (isShared) {
                                      setAssetIds((ids) => (v ? [...ids, doc._id] : ids.filter((id) => id !== doc._id)));
                                    } else {
                                      setDocumentIds((ids) => (v ? [...ids, doc._id] : ids.filter((id) => id !== doc._id)));
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell className="max-w-[220px] truncate">{doc.title}</TableCell>
                              <TableCell>{isShared ? '—' : ROLE_LABEL[(doc as StudentDocument).documentRole]}</TableCell>
                              <TableCell>{isShared ? 'Kho chung' : 'Của tôi'}</TableCell>
                              <TableCell>{formatDocSize(doc.sizeBytes)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              {docSource === 'upload' && (
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-control border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  <input
                    type="file"
                    className="hidden"
                    disabled={uploadMutation.isPending}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadMutation.mutate(file);
                      e.target.value = '';
                    }}
                  />
                  <span>Kéo thả tệp vào đây hoặc</span>
                  <span className="font-medium text-primary">
                    {uploadMutation.isPending ? 'Đang tải lên…' : 'Tải lên'}
                  </span>
                </label>
              )}

              <div className="rounded-control border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Đã chọn ({documentIds.length + assetIds.length})</p>
                {selectedDocTitles.length > 0 && <p className="mt-1 truncate">{selectedDocTitles.join(', ')}</p>}
                <p className="mt-1">
                  Vai trò &quot;Đề cương&quot; → hệ thống đề xuất phạm vi kiến thức thi ở màn Xem trước.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Có thể bỏ qua nếu môn đã có nội dung chuẩn.</p>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              {/* Wireframe S5 top box: Phân tích năng lực hiện tại */}
              <div className="rounded-card border border-border bg-card p-4 text-sm shadow-sm">
                <p className="mb-3 font-semibold text-foreground">Phân tích năng lực hiện tại</p>
                {!concept ? (
                  <p className="text-xs text-muted-foreground">Chưa chọn môn ở bước 1.</p>
                ) : (
                  <>
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={placementMutation.isPending}
                        onClick={() => {
                          setSkipBaseline(false);
                          placementMutation.mutate();
                        }}
                      >
                        Làm bài test nhanh (15 câu, ~15 phút)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={skipBaseline ? 'secondary' : 'outline'}
                        onClick={() => setSkipBaseline((v) => !v)}
                      >
                        Bỏ qua — dùng mức mặc định
                      </Button>
                    </div>

                    {topicMasteryRows.length > 0 ? (
                      <div className="flex flex-col gap-2.5">
                        {topicMasteryRows.map((row) => (
                          <div key={row.id} className="grid grid-cols-[minmax(120px,180px)_1fr_42px] items-center gap-3 text-xs">
                            <span className="truncate font-medium text-foreground">{row.name}</span>
                            <div className="h-3 overflow-hidden rounded-sm border border-border bg-muted/40">
                              <div
                                className="h-full bg-primary/80 transition-[width]"
                                style={{ width: `${Math.max(0, Math.min(100, row.score))}%` }}
                              />
                            </div>
                            <span className="text-right font-semibold text-muted-foreground">{row.score}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Chưa có dữ liệu năng lực theo chủ đề — hệ thống sẽ dùng mức mặc định nếu bạn bỏ qua bài test nhanh.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Wireframe S5 middle section: Chọn cách tạo lộ trình (A / B / C) */}
              <div>
                <p className="mb-2.5 text-sm font-semibold text-foreground">Chọn cách tạo lộ trình</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {PATH_OPTIONS.map((opt) => {
                    const selected = pathChoice === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setPathChoice(opt.key)}
                        className={`flex flex-col gap-2 rounded-card border p-3.5 text-left transition-colors ${
                          selected ? 'border-primary bg-primary-soft/60 ring-1 ring-primary' : 'border-border bg-card hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <span
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                selected ? 'border-primary bg-primary' : 'border-muted-foreground/50 bg-card'
                              }`}
                            >
                              {selected && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                            </span>
                            {opt.title}
                          </span>
                          {opt.badge && (
                            <span className="shrink-0 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-xs leading-relaxed text-muted-foreground">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 sm:justify-between">
          <span className="text-xs text-muted-foreground">
            Lộ trình giúp bạn chuẩn bị; hệ thống không đảm bảo kết quả thi.
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                Quay lại
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            {step < WIZARD_STEPS.length - 1 && (
              <>
                {step === 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      saveDraftMutation.mutate(4);
                      setStep(3);
                    }}
                  >
                    Bỏ qua
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  disabled={saveDraftMutation.isPending}
                  onClick={() => saveDraftMutation.mutate(step + 1)}
                >
                  Lưu nháp
                </Button>
                <Button
                  type="button"
                  disabled={!canNext}
                  onClick={() => {
                    saveDraftMutation.mutate(step + 2);
                    setStep((s) => s + 1);
                  }}
                >
                  Tiếp tục
                </Button>
              </>
            )}
            {step === WIZARD_STEPS.length - 1 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saveDraftMutation.isPending}
                  onClick={() => saveDraftMutation.mutate(4)}
                >
                  Lưu nháp
                </Button>
                <Button type="button" disabled={!canNext || mutation.isPending} onClick={() => mutation.mutate()}>
                  {mutation.isPending ? 'Đang tạo…' : 'Tạo lộ trình'}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
      <AssessmentDialog
        assessmentId={placementAttemptId}
        open={!!placementAttemptId}
        onClose={() => setPlacementAttemptId(null)}
      />
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
    onError: (err) => toast.error((err as ApiError).message || 'Buổi học bị trùng giờ hoặc không hợp lệ'),
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
    onError: (err) => toast.error((err as ApiError).message || 'Áp dụng lộ trình mẫu thất bại'),
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

interface PlanStage {
  chapterTitle: string;
  startDay: number;
  endDay: number;
  summary: string;
}

// Phase D preview "Lộ trình (N chặng)" column — groups consecutive sessions sharing the same
// chapterTitle into a stage, with the day range they span and the first session's title as a
// one-line summary. Pure display grouping derived from what's already on each session; no new
// "stage" concept is stored here (that's plan-template's own concept, not duplicated for this).
function groupSessionsIntoStages(sessions: PlanSession[]): PlanStage[] {
  const ordered = [...sessions].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  if (!ordered.length) return [];
  const planStart = new Date(ordered[0].startAt);
  planStart.setHours(0, 0, 0, 0);
  const dayNumberOf = (iso: string) => {
    const d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - planStart.getTime()) / 86400000) + 1;
  };
  const stages: PlanStage[] = [];
  for (const s of ordered) {
    const key = s.chapterTitle || '';
    const day = dayNumberOf(s.startAt);
    const last = stages[stages.length - 1];
    if (last && last.chapterTitle === key) {
      last.endDay = day;
    } else {
      stages.push({ chapterTitle: key, startDay: day, endDay: day, summary: s.title || s.note || 'Buổi học' });
    }
  }
  return stages;
}

// "Kế hoạch ngày" column — the same day-grouping already used for the summary line below, but
// keyed by an actual Date (not a locale string) so days sort and step correctly with prev/next.
function groupSessionsByDay(sessions: PlanSession[]): Array<{ date: Date; sessions: PlanSession[] }> {
  const byDay = new Map<string, { date: Date; sessions: PlanSession[] }>();
  for (const s of [...sessions].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())) {
    const d = new Date(s.startAt);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    const entry = byDay.get(key);
    if (entry) entry.sessions.push(s);
    else byDay.set(key, { date: d, sessions: [s] });
  }
  return [...byDay.values()];
}

// Best-effort "Loại" label (wireframe shows Bài học/Bài tập/Thẻ/Quick/Đệm, but a PlanSession only
// ever carries theoryContent and/or questions — "Thẻ"/"Quick" aren't distinct data at all) —
// derives what's actually there instead of inventing stored task-type data.
function sessionTaskType(s: PlanSession): string {
  if (s.theoryContent && s.theoryContent.trim()) return 'Bài học';
  if ((s.questions?.length ?? 0) > 0) return 'Bài tập';
  return 'Đệm';
}

/** Phase D: upgrades the "Đề xuất kế hoạch mới" review card into the wireframe's 3-column preview
 * (Lộ trình theo chặng / Kế hoạch ngày / Tổng quan). `matchedGoal` is resolved client-side by the
 * caller from `plan.goal` (the direct Plan→Goal FK) — see Planner.tsx's render loop below. */
function ProposedPlanCard({
  plan,
  matchedGoal,
  onConfirm,
  onCancel,
  onSaveExamScope,
  confirming,
  cancelling,
  savingExamScope,
}: {
  plan: Plan;
  matchedGoal?: Goal;
  onConfirm: () => void;
  onCancel: () => void;
  onSaveExamScope: (value: string) => void;
  confirming: boolean;
  cancelling: boolean;
  savingExamScope: boolean;
}) {
  const [dayIdx, setDayIdx] = useState(0);
  const [draftSaved, setDraftSaved] = useState(false);
  const [editingScope, setEditingScope] = useState(false);
  const [scopeDraft, setScopeDraft] = useState(matchedGoal?.examScope ?? '');

  const totalMinutes = plan.sessions.reduce((sum, s) => sum + s.durationMin, 0);
  const hours = Math.round((totalMinutes / 60) * 10) / 10;
  const stages = groupSessionsIntoStages(plan.sessions);
  const days = groupSessionsByDay(plan.sessions);
  const activeDay = days[Math.min(dayIdx, Math.max(days.length - 1, 0))];
  const minutesPerDay = days.length ? Math.round(totalMinutes / days.length) : 0;
  // Real coverage (server-computed, see planning.service.computeCoverage): distinct real leaf
  // Concepts this plan's sessions carry, over the goal subject's total leaf Concept count — only
  // sessions tagged with a genuine leaf count, never one still carrying the goal's root subject
  // concept. `plan.coverage` is null when it can't be computed at all (no goal link, or the subject
  // has no recorded knowledge tree) — fall back to the old content-density proxy for that case only,
  // and label each clearly so the number is never overclaimed.
  const realCoverage = plan.coverage ?? null;
  const contentSessions = plan.sessions.filter(
    (s) => (s.theoryContent && s.theoryContent.trim()) || (s.questions?.length ?? 0) > 0,
  ).length;
  const coveragePercent = realCoverage
    ? realCoverage.percent
    : plan.sessions.length
      ? Math.round((contentSessions / plan.sessions.length) * 100)
      : 0;

  if (draftSaved) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-control border border-dashed border-border bg-card p-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{plan.title}</p>
          <p className="text-xs text-muted-foreground">Đã lưu nháp — vẫn chờ xác nhận, xem lại khi cần.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setDraftSaved(false)}>
          Xem lại
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-control border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-foreground">Xem trước lộ trình và lịch ôn</p>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          Bản nháp
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {plan.title} — {plan.sessions.length} buổi học • ~{hours}h{plan.reason ? ` • Lý do: ${plan.reason}` : ''}
      </p>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="flex flex-col gap-2 rounded-control border border-border bg-muted/20 p-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Lộ trình ({stages.length} chặng)</p>
          <div className="flex max-h-[280px] flex-col gap-1.5 overflow-y-auto">
            {stages.map((st, i) => (
              <div key={i} className="rounded-control border border-border bg-card p-2">
                <p className="text-xs font-semibold text-foreground">
                  Chặng {i + 1}
                  {st.chapterTitle ? `: ${st.chapterTitle}` : ''} · Ngày {st.startDay}–{st.endDay}
                </p>
                <p className="truncate text-xs text-muted-foreground">{st.summary}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-control border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Kế hoạch ngày
              {activeDay
                ? ` · Ngày ${dayIdx + 1} (${activeDay.date.toLocaleDateString('vi-VN', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                  })})`
                : ''}
            </p>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={dayIdx === 0}
                onClick={() => setDayIdx((i) => Math.max(i - 1, 0))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={dayIdx >= days.length - 1}
                onClick={() => setDayIdx((i) => Math.min(i + 1, days.length - 1))}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhiệm vụ</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Phút</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(activeDay?.sessions ?? []).map((s) => (
                <TableRow key={s._id}>
                  <TableCell className="max-w-[160px] truncate">{s.title ?? s.note ?? 'Buổi học'}</TableCell>
                  <TableCell>{sessionTaskType(s)}</TableCell>
                  <TableCell>{s.durationMin}</TableCell>
                </TableRow>
              ))}
              {!activeDay && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-xs text-muted-foreground">
                    Không có buổi học.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-2">
          <div className="rounded-control border border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Tổng quan</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {days.length} ngày · {minutesPerDay} phút/ngày · {hours} giờ
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Phủ phạm vi: {coveragePercent}%</p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${coveragePercent}%` }} />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {realCoverage
                ? `Tính trên ${realCoverage.coveredLeafCount}/${realCoverage.totalLeafCount} kiến thức (Concept) thực tế của môn — buổi học chưa gắn đúng kiến thức cụ thể (nội dung tự soạn, hoặc AI chưa gắn được) không được tính vào phần đã phủ.`
                : 'Chưa đủ dữ liệu để tính phạm vi chương trình thi (thiếu liên kết mục tiêu hoặc cây kiến thức của môn) — số dưới đây chỉ là ước tính theo tỷ lệ buổi có nội dung thực (bài học/bài tập) trên tổng số buổi.'}
            </p>
          </div>

          <div className="rounded-control border border-dashed border-border bg-card p-3">
            <p className="text-xs font-semibold text-foreground">Phạm vi kiến thức thi</p>
            {!editingScope ? (
              <>
                <p className="mt-1 text-xs text-muted-foreground">
                  {matchedGoal?.examScope ? matchedGoal.examScope : 'Chưa xác định phạm vi — có thể bổ sung'}
                </p>
                {matchedGoal && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setScopeDraft(matchedGoal.examScope ?? '');
                      setEditingScope(true);
                    }}
                  >
                    Sửa phạm vi
                  </Button>
                )}
              </>
            ) : (
              <div className="mt-1 flex flex-col gap-2">
                <Input
                  value={scopeDraft}
                  onChange={(e) => setScopeDraft(e.target.value)}
                  placeholder="Ví dụ: Chương 1–5"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingExamScope}
                    onClick={() => {
                      onSaveExamScope(scopeDraft);
                      setEditingScope(false);
                    }}
                  >
                    Lưu
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingScope(false)}>
                    Hủy
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
        <p className="text-xs text-muted-foreground">
          Chỉ có hiệu lực khi bạn xác nhận. Lộ trình giúp bạn chuẩn bị; hệ thống không đảm bảo kết quả thi.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" disabled={cancelling} onClick={onCancel}>
            Chỉnh sửa lại
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setDraftSaved(true)}>
            Lưu nháp
          </Button>
          <Button type="button" size="sm" disabled={confirming} onClick={onConfirm}>
            Xác nhận và kích hoạt
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PlannerPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [pausingGoal, setPausingGoal] = useState<Goal | null>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [closingGoal, setClosingGoal] = useState<Goal | null>(null);
  const [examResultScore, setExamResultScore] = useState('');
  const [closingNote, setClosingNote] = useState('');
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [templateGoalId, setTemplateGoalId] = useState<string | null>(null);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [treePlan, setTreePlan] = useState<Plan | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [wizardTrigger, setWizardTrigger] = useState(false);
  // Arriving from "Khoá học của tôi" with ?concept=<id> opens the goal form pre-filled for that
  // subject instead of landing on a blank Lộ trình & kế hoạch page.
  const conceptFromCourses = searchParams.get('concept');
  // "Khoá học của tôi"'s page-top "+ Thiết lập mục tiêu ôn thi" button and its draft-resume banner
  // both land here with ?openGoal=1 (no specific subject) to force-open the wizard.
  const openGoalFromCourses = searchParams.has('openGoal');

  const { selectedSubjectId } = useSelectedSubject();

  const { data: plansRes } = useQuery({
    queryKey: planningKeys.plans({ limit: 20, subjectId: selectedSubjectId ?? undefined }),
    queryFn: () => listPlans({ limit: 20, subjectId: selectedSubjectId ?? undefined }),
  });
  const plans = plansRes?.data ?? [];
  const activePlan = plans.find((p) => p.status === 'active');
  const proposedPlans = plans.filter((p) => p.status === 'proposed');

  const { data: goalsRes, refetch: refetchGoals } = useQuery({
    queryKey: planningKeys.goals({ limit: 50, subjectId: selectedSubjectId ?? undefined }),
    queryFn: () => listGoals({ limit: 50, subjectId: selectedSubjectId ?? undefined }),
  });
  const goals = goalsRes?.data ?? [];
  const selectedGoal =
    goals.find((g) => g._id === selectedGoalId) ??
    goals.find((g) => g.status === 'active') ??
    goals[0] ??
    null;
  const selectedGoalPlan = selectedGoal
    ? (plans.find((p) => p.goal === selectedGoal._id && p.status === 'active') ?? activePlan)
    : activePlan;

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
    onError: (err) => toast.error((err as ApiError).message || 'Xếp lại lịch thất bại'),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmPlan(id),
    onSuccess: () => {
      toast.success('Đã xác nhận kế hoạch mới');
      invalidatePlans();
    },
    onError: (err) => toast.error((err as ApiError).message || 'Xác nhận kế hoạch thất bại'),
  });

  const cancelProposedMutation = useMutation({
    mutationFn: (id: string) => removePlan(id),
    onSuccess: () => {
      toast.success('Đã hủy đề xuất');
      invalidatePlans();
    },
    onError: (err) => toast.error((err as ApiError).message || 'Hủy đề xuất thất bại'),
  });

  // Phase D preview's "Sửa phạm vi" — reuses the existing updateGoal endpoint/mutation (Phase C),
  // no new backend surface for this.
  const updateExamScopeMutation = useMutation({
    mutationFn: ({ goalId, examScope }: { goalId: string; examScope: string }) =>
      updateGoal(goalId, { examScope }),
    onSuccess: () => {
      toast.success('Đã cập nhật phạm vi kiến thức thi');
      invalidatePlans();
    },
    onError: (err) => toast.error((err as ApiError).message || 'Cập nhật phạm vi thất bại'),
  });

  const createPlanMutation = useMutation({
    mutationFn: (title: string) => createPlan({ title }),
    onSuccess: () => {
      toast.success('Đã tạo kế hoạch học tập — thêm buổi học ở mục Lịch học bên dưới');
      setNewPlanTitle('');
      invalidatePlans();
    },
    onError: (err) => toast.error((err as ApiError).message || 'Tạo kế hoạch thất bại'),
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
    onError: (err) => toast.error((err as ApiError).message || 'Cập nhật buổi học thất bại'),
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
    onError: (err) => toast.error((err as ApiError).message || 'Tạo lộ trình bằng AI thất bại'),
  });

  // "Tự thiết kế": chỉ một kế hoạch đang hoạt động cùng lúc — nếu đã có, hướng dẫn thêm buổi học
  // vào kế hoạch đó thay vì tạo một kế hoạch hoạt động thứ hai mà giao diện không theo dõi được.
  const manualMutation = useMutation({
    mutationFn: (goal: Goal) => createPlan({ title: `${goal.title} (tự thiết kế)`, goalId: goal._id }),
    onSuccess: () => {
      toast.success('Đã tạo kế hoạch — thêm buổi học ở mục Lịch học bên dưới');
      invalidatePlans();
    },
    onError: (err) => toast.error((err as ApiError).message || 'Tạo kế hoạch thất bại'),
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
    onError: (err) => toast.error((err as ApiError).message || 'Xoá mục tiêu thất bại'),
    onSettled: () => setDeletingGoal(null),
  });

  const pauseGoalMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => pauseGoal(id, { reason }),
    onSuccess: () => {
      toast.success('Đã tạm dừng mục tiêu');
      refetchGoals();
      setPausingGoal(null);
      setPauseReason('');
    },
    onError: (err) => toast.error((err as ApiError).message || 'Tạm dừng mục tiêu thất bại'),
  });

  const resumeGoalMutation = useMutation({
    mutationFn: (id: string) => resumeGoal(id),
    onSuccess: () => {
      toast.success('Đã tiếp tục mục tiêu');
      refetchGoals();
    },
    onError: (err) => toast.error((err as ApiError).message || 'Tiếp tục mục tiêu thất bại'),
  });

  const closeGoalMutation = useMutation({
    mutationFn: ({ id, score, note }: { id: string; score?: number; note?: string }) =>
      closeGoal(id, { examResultScore: score, closingNote: note }),
    onSuccess: () => {
      toast.success('Đã đóng mục tiêu ôn thi');
      refetchGoals();
      setClosingGoal(null);
      setExamResultScore('');
      setClosingNote('');
    },
    onError: (err) => toast.error((err as ApiError).message || 'Đóng mục tiêu thất bại'),
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
      title="Lộ trình & mục tiêu"
      breadcrumb={['Trang chủ', 'Mục tiêu ôn thi', 'Lộ trình & mục tiêu']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Flag className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-foreground">Lộ trình & mục tiêu</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Thiết lập mục tiêu ôn thi, theo dõi lộ trình từng chặng và sắp xếp lịch học cá nhân hoá.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <SubjectFilterPill />
          <GoalWizardDialog
            onCreated={refetchGoals}
            onActivated={(goal, choice) => {
              setSelectedGoalId(goal._id);
              if (choice === 'ai') generatePlanMutation.mutate(goal._id);
              else if (choice === 'template') setTemplateGoalId(goal._id);
              else handleManualDesign(goal);
            }}
            initialConcept={conceptFromCourses ?? undefined}
            forceOpen={!!conceptFromCourses || openGoalFromCourses || wizardTrigger}
            onForceOpenHandled={() => {
              setWizardTrigger(false);
              searchParams.delete('concept');
              searchParams.delete('openGoal');
              setSearchParams(searchParams, { replace: true });
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
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
                {proposedPlans.map((p) => {
                  // Plan↔Goal link (direct FK) — replaces the old heuristic of matching a session's
                  // concept against a goal's own concept, which broke whenever a student had 2+
                  // goals on related subjects.
                  const matchedGoal = p.goal ? goals.find((g) => g._id === p.goal) : undefined;
                  return (
                    <ProposedPlanCard
                      key={p._id}
                      plan={p}
                      matchedGoal={matchedGoal}
                      confirming={confirmMutation.isPending}
                      cancelling={cancelProposedMutation.isPending}
                      savingExamScope={updateExamScopeMutation.isPending}
                      onConfirm={() => confirmMutation.mutate(p._id)}
                      onCancel={() => cancelProposedMutation.mutate(p._id)}
                      onSaveExamScope={(examScope) =>
                        matchedGoal && updateExamScopeMutation.mutate({ goalId: matchedGoal._id, examScope })
                      }
                    />
                  );
                })}
              </div>
            )}

            {/* Mục tiêu học tập (banner tổng quan + chuyển đổi mục tiêu) */}
            {goals.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                {goals.map((g) => {
                  const isCurrent = selectedGoal?._id === g._id;
                  return (
                    <button
                      key={g._id}
                      type="button"
                      onClick={() => setSelectedGoalId(g._id)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                        isCurrent
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-card text-foreground hover:bg-muted',
                      )}
                    >
                      {g.title}
                    </button>
                  );
                })}
              </div>
            )}

            {goals.length === 0 && (
              <div className="rounded-card border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                Chưa có mục tiêu nào — bấm “Thiết lập mục tiêu mới” ở góc phải để bắt đầu.
              </div>
            )}

            {selectedGoal && (() => {
              const g = selectedGoal;
              const status = g.status ?? 'active';
              const statusBadge =
                status === 'paused'
                  ? { label: 'Tạm dừng', cls: 'bg-muted text-muted-foreground' }
                  : status === 'completed'
                    ? { label: 'Hoàn thành', cls: 'bg-primary/10 text-primary' }
                    : status === 'archived'
                      ? { label: 'Lưu trữ', cls: 'bg-muted text-muted-foreground' }
                      : status === 'expired'
                        ? { label: 'Hết hạn', cls: 'bg-danger/15 text-danger' }
                        : { label: 'Đang ôn', cls: 'bg-primary text-primary-foreground' };

              const planSessions = selectedGoalPlan?.sessions ?? [];
              const doneCount = planSessions.filter((s) => s.status === 'done').length;
              const totalCount = planSessions.length;
              const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
              const doneHours = (
                planSessions.filter((s) => s.status === 'done').reduce((acc, s) => acc + s.durationMin, 0) / 60
              ).toFixed(1);
              const totalHours = (
                planSessions.reduce((acc, s) => acc + s.durationMin, 0) / 60
              ).toFixed(1);

              return (
                <div className="rounded-card border border-border bg-card p-5 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`rounded-full px-2.5 py-0.5 font-semibold ${statusBadge.cls}`}>
                        {statusBadge.label}
                      </span>
                      <span className="rounded-md bg-muted px-2.5 py-0.5 font-medium text-foreground">
                        {conceptName(g.concept)}
                      </span>
                      <span className="rounded-md bg-muted px-2.5 py-0.5 text-muted-foreground">
                        Hạn {new Date(g.deadline).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="rounded-md bg-muted px-2.5 py-0.5 text-muted-foreground">
                        Ưu tiên {g.importance}/5
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 border-primary/20 bg-primary/10 px-2.5 text-xs font-semibold text-primary hover:bg-primary/20"
                        onClick={() => {
                          if (selectedGoalPlan) setTreePlan(selectedGoalPlan);
                          else navigate(`${PATHS.student.knowledgeMap}?subject=${typeof g.concept === 'string' ? g.concept : g.concept._id}&mode=tree`);
                        }}
                      >
                        <Network className="h-3.5 w-3.5" /> Sơ đồ cây
                      </Button>
                      {status !== 'paused' ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs"
                          disabled={manualMutation.isPending}
                          onClick={() => handleManualDesign(g)}
                        >
                          Tự thiết kế
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 px-2.5 text-xs"
                          disabled={resumeGoalMutation.isPending}
                          onClick={() => resumeGoalMutation.mutate(g._id)}
                        >
                          Tiếp tục
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        disabled={generatePlanMutation.isPending && generatePlanMutation.variables === g._id}
                        onClick={() => generatePlanMutation.mutate(g._id)}
                      >
                        {generatePlanMutation.isPending && generatePlanMutation.variables === g._id
                          ? 'Đang tạo…'
                          : 'AI đề xuất'}
                      </Button>
                      {status === 'active' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground"
                          onClick={() => setPausingGoal(g)}
                        >
                          <PauseCircle className="h-3.5 w-3.5" /> Tạm dừng
                        </Button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeletingGoal(g)}
                        className="rounded p-1.5 text-danger/80 transition-colors hover:bg-danger/10 hover:text-danger"
                        title="Xoá mục tiêu"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <h2 className="mt-2.5 text-base font-bold text-foreground">{g.title}</h2>

                  <div className="mt-4 grid items-center gap-4 lg:grid-cols-[1fr_auto]">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-muted-foreground">Tiến độ tổng quan</span>
                        <span className="font-bold text-foreground">{progressPct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid auto-rows-fr grid-cols-3 gap-2.5">
                      <div className="flex h-full items-center gap-2 rounded-xl border border-border/70 bg-muted/20 px-3 py-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <BookOpen className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {doneCount}/{totalCount}
                          </p>
                          <p className="text-[11px] text-muted-foreground">Chặng hoàn thành</p>
                        </div>
                      </div>

                      <div className="flex h-full items-center gap-2 rounded-xl border border-border/70 bg-muted/20 px-3 py-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Clock className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {doneHours}h / {totalHours}h
                          </p>
                          <p className="text-[11px] text-muted-foreground">Thời gian học</p>
                        </div>
                      </div>

                      <div className="flex h-full items-center gap-2 rounded-xl border border-amber-300/80 bg-amber-50/90 px-3 py-2 text-amber-900">
                        <Star className="h-4 w-4 shrink-0 fill-amber-500 text-amber-500" />
                        <div>
                          <p className="text-xs font-bold">
                            {g.targetScore != null ? `≥ ${g.targetScore}` : 'Đạt'}
                          </p>
                          <p className="text-[11px] text-amber-800/80">Điểm mục tiêu</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Khối Lộ trình từng chặng (gộp trực tiếp từ LearningRoadmap) */}
            <RoadmapStagesSection
              activePlan={selectedGoalPlan}
              onOpenTree={setTreePlan}
              onCreateRoadmap={() => setWizardTrigger(true)}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Lịch học</h3>
                <p className="text-xs text-muted-foreground">Theo dõi các buổi học, hạn nộp bài và lịch thi trong tháng.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
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
            </div>

            {activePlan ? (
              <CalendarScheduleCard
                year={now.getFullYear()}
                month={now.getMonth()}
                today={now.getDate()}
                events={calendarEvents}
                schedule={scheduleItems}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Chưa có kế hoạch học tập nào đang hoạt động — tạo kế hoạch mới ở trên.
              </p>
            )}
          </div>

      <Dialog open={!!treePlan} onOpenChange={(v) => !v && setTreePlan(null)}>
        <DialogContent size="lg" className="tw-scope flex max-h-[88vh] flex-col">
          <DialogHeader>
            <DialogTitle>Sơ đồ cây lộ trình — {treePlan?.title ?? ''}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-1">
            {treePlan && (
              <RoadmapTree
                sessions={treePlan.sessions}
                onSessionAction={(action) => sessionActionMutation.mutate(action)}
                onStartQuiz={(sessionId) => {
                  setTreePlan(null);
                  setQuizSessionId(sessionId);
                }}
              />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTreePlan(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingGoal}
        onOpenChange={(v) => !v && setDeletingGoal(null)}
        title="Xoá mục tiêu học tập?"
        description={`Mục tiêu "${deletingGoal?.title ?? ''}" sẽ bị xoá.`}
        onConfirm={() => deletingGoal && deleteGoalMutation.mutate(deletingGoal._id)}
      />

      <Dialog open={!!pausingGoal} onOpenChange={(v) => !v && setPausingGoal(null)}>
        <DialogContent className="tw-scope max-w-md">
          <DialogHeader>
            <DialogTitle>Tạm dừng mục tiêu ôn thi</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <p className="text-sm text-muted-foreground">
              Kế hoạch sẽ tạm dừng; các ngày trôi qua không bị tính là bỏ lỡ. Khi tiếp tục, hệ thống sẽ giữ nguyên số ngày còn lại.
            </p>
            <Input
              placeholder="Lý do tạm dừng (tùy chọn, ví dụ: Thi giữa kỳ môn khác)"
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPausingGoal(null)}>
              Huỷ
            </Button>
            <Button
              type="button"
              disabled={pauseGoalMutation.isPending}
              onClick={() =>
                pausingGoal &&
                pauseGoalMutation.mutate({
                  id: pausingGoal._id,
                  reason: pauseReason.trim() || undefined,
                })
              }
            >
              Xác nhận tạm dừng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!closingGoal} onOpenChange={(v) => !v && setClosingGoal(null)}>
        <DialogContent className="tw-scope max-w-md">
          <DialogHeader>
            <DialogTitle>Đóng mục tiêu & ghi nhận kết quả</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Điểm thi thực tế (thang 0–10, tùy chọn)
              </p>
              <Input
                type="number"
                min={0}
                max={10}
                step={0.1}
                placeholder="Ví dụ: 8.5"
                value={examResultScore}
                onChange={(e) => setExamResultScore(e.target.value)}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Ghi chú tổng kết (tùy chọn)</p>
              <Input
                placeholder="Cảm nhận hoặc kinh nghiệm rút ra..."
                value={closingNote}
                onChange={(e) => setClosingNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setClosingGoal(null)}>
              Huỷ
            </Button>
            <Button
              type="button"
              disabled={closeGoalMutation.isPending}
              onClick={() =>
                closingGoal &&
                closeGoalMutation.mutate({
                  id: closingGoal._id,
                  score: examResultScore.trim() ? Number(examResultScore) : undefined,
                  note: closingNote.trim() || undefined,
                })
              }
            >
              Hoàn tất & đóng mục tiêu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
