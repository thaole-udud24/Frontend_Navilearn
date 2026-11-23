import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  Heading,
  Image as ImageIcon,
  ListChecks,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Video,
} from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { DetailRow, FormDialogFooter, FormDialogTitle, FormField } from '@/components/DialogForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTablePage, ClampLine } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import { SourceBadge } from '@/components/SourceBadge';
import {
  createPlanTemplate,
  exportPlanTemplates,
  importPlanTemplates,
  listPlanTemplates,
  removePlanTemplate,
  updatePlanTemplate,
} from '@/services/plan-template';
import type { PlanTemplate, PlanTemplateStep } from '@/services/plan-template/types';
import { createQuestion, listQuestions, updateQuestion } from '@/services/question-bank';
import type {
  Question,
  QuestionDifficulty,
  QuestionOption,
  QuestionType,
} from '@/services/question-bank/types';
import { listConcepts } from '@/services/knowledge';
import type { Concept } from '@/services/knowledge/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  parseTheoryBlocks,
  serializeTheoryBlocks,
  type TheoryBlock,
  type TheoryBlockType,
} from '@/lib/theoryBlocks';
import { TheoryBlockViewer } from '@/components/TheoryBlockViewer';
import { cn } from '@/lib/utils';
import { TemplateStepTree } from './components/TemplateStepTree';

// Picks the default concept from the shared Kho tri thức instead of typing its id by hand.
function ConceptSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [concepts, setConcepts] = useState<Concept[]>([]);

  useEffect(() => {
    listConcepts({ limit: 200 }).then((res) => setConcepts(res.data));
  }, []);

  return (
    <Select value={value || '__none__'} onValueChange={(v) => onChange(v === '__none__' ? '' : v)}>
      <SelectTrigger>
        <SelectValue placeholder="Mã khái niệm mặc định (không bắt buộc nếu luôn áp dụng kèm mục tiêu)" />
      </SelectTrigger>
      <SelectContent className="tw-scope">
        <SelectItem value="__none__">— Không gắn sẵn (áp dụng theo khái niệm của mục tiêu) —</SelectItem>
        {concepts.map((c) => (
          <SelectItem key={c._id} value={c._id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  mcq: 'Trắc nghiệm',
  true_false: 'Đúng/sai',
  essay: 'Tự luận',
};

function emptyDraftOptions(): QuestionOption[] {
  return [{ text: '', isCorrect: true }, { text: '' }];
}

/** Inline "tạo mới / chỉnh sửa câu hỏi" mini-form, embedded in QuestionPicker — saves straight into
 * the shared Ngân hàng câu hỏi (create/updateQuestion), so the question stays reusable everywhere,
 * not duplicated into the template. `editing` prefills the form and switches create -> update. */
function InlineQuestionForm({
  concept,
  editing,
  onSaved,
  onCancel,
}: {
  concept: string;
  editing: Question | null;
  onSaved: (q: Question) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(editing?.text ?? '');
  const [type, setType] = useState<QuestionType>(editing?.type ?? 'mcq');
  const [options, setOptions] = useState<QuestionOption[]>(
    editing?.options?.length ? editing.options : emptyDraftOptions(),
  );
  const [referenceAnswer, setReferenceAnswer] = useState(editing?.referenceAnswer ?? '');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(editing?.difficulty ?? 'medium');
  const [points, setPoints] = useState(editing?.points ?? 10);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!text.trim()) {
      toast.error('Vui lòng nhập nội dung câu hỏi');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        concept,
        type,
        text: text.trim(),
        options: type !== 'essay' ? options.filter((o) => o.text.trim()) : undefined,
        referenceAnswer: type === 'essay' ? referenceAnswer.trim() || undefined : undefined,
        difficulty,
        points,
      };
      const saved = editing ? await updateQuestion(editing._id, payload) : await createQuestion(payload);
      toast.success(editing ? 'Đã cập nhật câu hỏi' : 'Đã tạo câu hỏi mới vào ngân hàng câu hỏi');
      onSaved(saved);
    } catch {
      toast.error('Lưu câu hỏi thất bại — kiểm tra lại đáp án.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 rounded-control border border-dashed border-primary/40 bg-primary/5 p-3">
      <FormField label="Nội dung câu hỏi" required>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập câu hỏi…"
          rows={2}
          className="w-full rounded-control border border-input bg-card px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </FormField>
      <div className="flex gap-2">
        <FormField label="Loại câu hỏi" className="flex-1">
          <Select
            value={type}
            onValueChange={(v) => {
              const next = v as QuestionType;
              setType(next);
              if (next === 'true_false') setOptions([{ text: 'Đúng', isCorrect: true }, { text: 'Sai' }]);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="tw-scope">
              {Object.entries(QUESTION_TYPE_LABEL).map(([v, label]) => (
                <SelectItem key={v} value={v}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Độ khó" className="flex-1">
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as QuestionDifficulty)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="tw-scope">
              <SelectItem value="easy">Dễ</SelectItem>
              <SelectItem value="medium">Trung bình</SelectItem>
              <SelectItem value="hard">Khó</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Điểm" className="w-20">
          <Input
            type="number"
            min={1}
            max={100}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
          />
        </FormField>
      </div>

      {type === 'essay' ? (
        <FormField label="Đáp án tham khảo">
          <textarea
            value={referenceAnswer}
            onChange={(e) => setReferenceAnswer(e.target.value)}
            placeholder="Để AI chấm bài dựa vào (không bắt buộc)"
            rows={2}
            className="w-full rounded-control border border-input bg-card px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </FormField>
      ) : (
        <FormField label="Đáp án (chọn đúng 1 đáp án đúng)">
          <div className="flex flex-col gap-1.5">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <Checkbox
                  checked={!!opt.isCorrect}
                  onCheckedChange={() =>
                    setOptions(options.map((o, idx) => ({ ...o, isCorrect: idx === i })))
                  }
                />
                {type === 'true_false' ? (
                  <span className="flex-1 text-sm text-foreground">{opt.text}</span>
                ) : (
                  <Input
                    value={opt.text}
                    onChange={(e) =>
                      setOptions(options.map((o, idx) => (idx === i ? { ...o, text: e.target.value } : o)))
                    }
                    placeholder={`Phương án ${i + 1}`}
                  />
                )}
                {type === 'mcq' && (
                  <button type="button" onClick={() => setOptions(options.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-danger" />
                  </button>
                )}
              </div>
            ))}
            {type === 'mcq' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setOptions([...options, { text: '' }])}
              >
                <Plus className="h-3.5 w-3.5" /> Thêm đáp án
              </Button>
            )}
          </div>
        </FormField>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="button" size="sm" onClick={submit} disabled={saving}>
          {editing ? 'Lưu thay đổi' : 'Thêm vào ngân hàng'}
        </Button>
      </div>
    </div>
  );
}

// Picks questions straight from the shared Ngân hàng câu hỏi instead of typing ids by hand — the
// template's own `concept` scopes which questions are offered, matching what the backend validates.
// Admin can thêm (create), sửa (edit in place, pushed to the shared bank) and xóa (drop from this
// step's list — the question itself stays in the bank for other steps/templates to use).
function QuestionPicker({
  concept,
  selected,
  onChange,
}: {
  concept: string;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  // 'new' = create form, a Question = edit form for that question, null = just the list.
  const [formTarget, setFormTarget] = useState<Question | 'new' | null>(null);

  useEffect(() => {
    if (!concept) return;
    listQuestions({ concept, limit: 100 }).then((res) => setQuestions(res.data));
  }, [concept]);

  const remove = (id: string) => onChange(selected.filter((s) => s !== id));
  const add = (id: string) => onChange(selected.includes(id) ? selected : [...selected, id]);

  if (!concept) {
    return (
      <p className="text-xs text-muted-foreground">Chọn khái niệm mặc định ở Tab 1 trước để thêm câu hỏi.</p>
    );
  }

  const selectedQuestions = questions.filter((q) => selected.includes(q._id));
  const availableQuestions = questions.filter((q) => !selected.includes(q._id));

  return (
    <div className="flex flex-col gap-3 rounded-control border border-border bg-card p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Câu hỏi của buổi này ({selectedQuestions.length})
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFormTarget((v) => (v === 'new' ? null : 'new'))}
        >
          <Plus className="h-3.5 w-3.5" /> Tạo câu hỏi mới
        </Button>
      </div>

      {selectedQuestions.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Chưa có câu hỏi nào — chọn ở danh sách bên dưới hoặc tạo mới.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {selectedQuestions.map((q) => (
            <div key={q._id} className="flex items-start gap-2 rounded-control bg-primary/5 p-1.5 text-sm">
              <span className="line-clamp-2 flex-1 text-foreground">{q.text}</span>
              <button type="button" title="Sửa câu hỏi" onClick={() => setFormTarget(q)} className="shrink-0">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
              </button>
              <button
                type="button"
                title="Bỏ khỏi buổi này"
                onClick={() => remove(q._id)}
                className="shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-danger" />
              </button>
            </div>
          ))}
        </div>
      )}

      {availableQuestions.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
            Chọn thêm từ ngân hàng ({availableQuestions.length} câu)
          </summary>
          <div className="mt-1.5 flex max-h-40 flex-col gap-1.5 overflow-y-auto pr-2">
            {availableQuestions.map((q) => (
              <label key={q._id} className="flex items-start gap-2">
                <Checkbox checked={false} onCheckedChange={() => add(q._id)} className="mt-0.5" />
                <span className="line-clamp-2 text-foreground">{q.text}</span>
              </label>
            ))}
          </div>
        </details>
      )}

      {formTarget && (
        <InlineQuestionForm
          concept={concept}
          editing={formTarget === 'new' ? null : formTarget}
          onCancel={() => setFormTarget(null)}
          onSaved={(q) => {
            setQuestions((prev) =>
              formTarget === 'new' ? [q, ...prev] : prev.map((x) => (x._id === q._id ? q : x)),
            );
            if (formTarget === 'new') add(q._id);
            setFormTarget(null);
          }}
        />
      )}
    </div>
  );
}

const conceptName = (c: PlanTemplate['concept']) => (!c ? '' : typeof c === 'string' ? c : c.name);

/** Shared "Buổi #N" header for the Tab 2/3 step cards — numbered badge + name/schedule, same visual
 * language as TemplateStepTree's read-only preview, so the editor and the preview read as one system.
 * Also carries the inline rename + remove controls, so Tab 2/3 don't force a trip back to Tab 1
 * just to fix a session's name or drop it. */
function StepCardHeader({
  index,
  step,
  icon: Icon = BookOpen,
  onRename,
  onRemove,
  removeDisabled,
}: {
  index: number;
  step: PlanTemplateStep;
  icon?: typeof BookOpen;
  onRename: (note: string) => void;
  onRemove: () => void;
  removeDisabled: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <Input
          value={step.note ?? ''}
          onChange={(e) => onRename(e.target.value)}
          placeholder={`Buổi học ${index + 1}`}
          className="h-7 px-2 text-sm font-semibold text-foreground"
        />
        <p className="text-xs text-muted-foreground">
          Ngày {step.dayOffset} • {step.durationMin} phút
        </p>
      </div>
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <button
        type="button"
        disabled={removeDisabled}
        onClick={onRemove}
        className="shrink-0 disabled:opacity-30"
      >
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-danger" />
      </button>
    </div>
  );
}

const BLOCK_META: Record<TheoryBlockType, { label: string; icon: typeof Heading; placeholder: string }> = {
  heading: { label: 'Tiêu đề', icon: Heading, placeholder: 'Tiêu đề phần này' },
  paragraph: { label: 'Đoạn văn', icon: AlignLeft, placeholder: 'Nội dung giảng giải…' },
  image: { label: 'Hình ảnh', icon: ImageIcon, placeholder: 'Đường dẫn hình ảnh (URL)' },
  video: { label: 'Video', icon: Video, placeholder: 'Đường dẫn video (YouTube, v.v.)' },
};

/** Fully controlled block editor for a step's theory — "soạn bài giảng" format: a sequence of
 * tiêu đề/đoạn văn/hình ảnh/video blocks, reorderable, each rendered with its real preview below
 * (TheoryBlockViewer) so the admin sees exactly what the student will see. No local block state —
 * always derives from `value` and writes back through `onChange`, so it can't go stale when the
 * dialog loads a different step's content (e.g. switching from create to edit). */
function TheoryBlockEditor({ value, onChange }: { value?: string; onChange: (raw: string) => void }) {
  const blocks = parseTheoryBlocks(value);
  const commit = (next: TheoryBlock[]) => onChange(serializeTheoryBlocks(next));

  const addBlock = (type: TheoryBlockType) => commit([...blocks, { type, content: '' }]);
  const updateBlock = (i: number, content: string) =>
    commit(blocks.map((b, idx) => (idx === i ? { ...b, content } : b)));
  const removeBlock = (i: number) => commit(blocks.filter((_, idx) => idx !== i));
  const moveBlock = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  return (
    <div className="flex flex-col gap-2">
      {blocks.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Chưa có nội dung — thêm khối bên dưới (không bắt buộc).
        </p>
      )}
      {blocks.map((b, i) => {
        const meta = BLOCK_META[b.type];
        return (
          <div key={i} className="flex items-start gap-2 rounded-control border border-input bg-muted/40 p-2">
            <span className="mt-1.5 flex w-20 shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
              <meta.icon className="h-3.5 w-3.5" /> {meta.label}
            </span>
            {b.type === 'heading' ? (
              <Input
                value={b.content}
                onChange={(e) => updateBlock(i, e.target.value)}
                placeholder={meta.placeholder}
                className="flex-1"
              />
            ) : b.type === 'paragraph' ? (
              <textarea
                value={b.content}
                onChange={(e) => updateBlock(i, e.target.value)}
                placeholder={meta.placeholder}
                rows={2}
                className="w-full flex-1 rounded-control border border-input bg-card px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            ) : (
              <div className="flex flex-1 flex-col gap-1.5">
                <Input
                  value={b.content}
                  onChange={(e) => updateBlock(i, e.target.value)}
                  placeholder={meta.placeholder}
                />
                {b.content.trim() && <TheoryBlockViewer raw={serializeTheoryBlocks([b])} />}
              </div>
            )}
            <div className="flex flex-col">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => moveBlock(i, -1)}
                className="disabled:opacity-30"
              >
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button
                type="button"
                disabled={i === blocks.length - 1}
                onClick={() => moveBlock(i, 1)}
                className="disabled:opacity-30"
              >
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
            <button type="button" onClick={() => removeBlock(i)} className="mt-1.5">
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-danger" />
            </button>
          </div>
        );
      })}
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(BLOCK_META) as TheoryBlockType[]).map((type) => {
          const meta = BLOCK_META[type];
          return (
            <Button key={type} type="button" variant="outline" size="sm" onClick={() => addBlock(type)}>
              <meta.icon className="h-3.5 w-3.5" /> {meta.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function emptyStep(): PlanTemplateStep {
  return { dayOffset: 1, durationMin: 30, note: '', theoryContent: '', questions: [] };
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
  onClose,
  onSaved,
}: {
  template: PlanTemplate | 'new' | null;
  /** Pre-fills a new template from an AI draft instead of starting blank (UC-PLN-TPL-04). */
  seed?: TemplateSeed | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = template === 'new';
  const existing = isNew ? null : template;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [concept, setConcept] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [steps, setSteps] = useState<PlanTemplateStep[]>([emptyStep()]);
  const [source, setSource] = useState<'manual' | 'ai'>('manual');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  // Tab 2/3 build on the sessions defined in Tab 1, so a brand-new template blocks skipping ahead
  // until there's a title and at least one session. Editing an existing template already has every
  // tab populated, so there's nothing to gate — all tabs stay open.
  const tab1Valid = !isNew || (title.trim().length > 0 && steps.length > 0);
  const [exerciseStepIndexRaw, setExerciseStepIndex] = useState(0);
  // Clamp instead of storing: a step can be removed from Tab 1/2 while Tab 3 still points at it.
  const exerciseStepIndex = Math.min(exerciseStepIndexRaw, steps.length - 1);

  const load = (t: PlanTemplate | 'new' | null) => {
    setActiveTab('info');
    setExerciseStepIndex(0);
    if (t === 'new' && seed) {
      setTitle(seed.title);
      setDescription(seed.description);
      setConcept(seed.concept ?? '');
      setIsActive(true);
      setSteps(seed.steps.length ? seed.steps : [emptyStep()]);
      setSource('ai');
      return;
    }
    if (!t || t === 'new') {
      setTitle('');
      setDescription('');
      setConcept('');
      setIsActive(true);
      setSteps([emptyStep()]);
      setSource('manual');
      return;
    }
    setTitle(t.title);
    setDescription(t.description ?? '');
    setConcept(typeof t.concept === 'string' ? t.concept : (t.concept?._id ?? ''));
    setIsActive(t.isActive);
    setSteps(t.steps.length ? t.steps : [emptyStep()]);
    setSource('manual');
  };

  // Dialog.onOpenChange only fires for Radix-driven changes (Escape, overlay click, close button —
  // never for `template` simply switching from null to a row via parent state), so loading had to
  // move here: an effect keyed on the actual data that should trigger a (re)load.
  useEffect(() => {
    if (template) load(template);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, seed]);

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

  const submit = async () => {
    if (!title.trim() || steps.length === 0) {
      toast.error('Cần có tiêu đề và ít nhất một buổi học');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        concept: concept.trim() || undefined,
        isActive,
        steps: steps.map((s) => ({
          ...s,
          note: s.note?.trim() || undefined,
          theoryContent: s.theoryContent?.trim() || undefined,
          questions: s.questions?.length ? s.questions : undefined,
        })),
      };
      if (isNew) await createPlanTemplate(payload);
      else if (existing) await updatePlanTemplate(existing._id, payload);
      toast.success(isNew ? 'Đã tạo lộ trình mẫu' : 'Đã cập nhật lộ trình mẫu');
      onSaved();
      onClose();
    } catch {
      toast.error('Lưu lộ trình mẫu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!template} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="tw-scope flex h-[85vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <FormDialogTitle icon={isNew ? Plus : Pencil}>
            {isNew ? 'Thêm mới Lộ trình mẫu' : 'Chỉnh sửa Lộ trình mẫu'}
            {source === 'ai' && <SourceBadge source="ai" />}
          </FormDialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="shrink-0">
            <TabsTrigger value="info">1. Thông tin chung</TabsTrigger>
            <TabsTrigger value="theory" disabled={!tab1Valid} className="gap-1.5">
              {!tab1Valid && <Lock className="h-3 w-3" />} 2. Lý thuyết bài giảng
            </TabsTrigger>
            <TabsTrigger value="exercise" disabled={!tab1Valid} className="gap-1.5">
              {!tab1Valid && <Lock className="h-3 w-3" />} 3. Bài tập từng phần
            </TabsTrigger>
          </TabsList>
          {!tab1Valid && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Nhập tên lộ trình ở Tab 1 để mở khóa Tab 2 và Tab 3.
            </p>
          )}

          <TabsContent value="info" className="min-h-0 flex-1 overflow-y-auto pr-4">
            <div className="flex flex-col gap-4 py-2">
              <FormField label="Tên lộ trình" required>
                <Input
                  placeholder="Ví dụ: Ôn thi cuối kỳ — Giải tích"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormField>
              <FormField label="Mô tả">
                <Input
                  placeholder="Mô tả ngắn gọn (không bắt buộc)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </FormField>
              <FormField label="Khái niệm mặc định">
                <ConceptSelect value={concept} onChange={setConcept} />
              </FormField>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(v === true)} />
                Đang mở cho sinh viên chọn
              </label>

              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Các buổi học (khung chương trình)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSteps((p) => [...p, emptyStep()])}
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm buổi
                </Button>
              </div>
              {steps.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-control border border-border bg-muted/40 p-2.5"
                >
                  <span className="w-5 text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={s.dayOffset}
                    onChange={(e) => updateStep(i, { dayOffset: Number(e.target.value) })}
                    className="w-20"
                    title="Ngày thứ (kể từ lúc áp dụng)"
                  />
                  <Input
                    type="number"
                    min={5}
                    max={480}
                    value={s.durationMin}
                    onChange={(e) => updateStep(i, { durationMin: Number(e.target.value) })}
                    className="w-20"
                    title="Thời lượng (phút)"
                  />
                  <Input
                    placeholder="Tên buổi học"
                    value={s.note ?? ''}
                    onChange={(e) => updateStep(i, { note: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={i === 0}
                    onClick={() => moveStep(i, -1)}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={i === steps.length - 1}
                    onClick={() => moveStep(i, 1)}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={steps.length === 1}
                    onClick={() => setSteps((p) => p.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* UC-PLN-TPL-03: a step is a mini-lesson — theory to read, then a quiz before "done". */}
          <TabsContent value="theory" className="min-h-0 flex-1 overflow-y-auto pr-4">
            <div className="flex flex-col gap-3 py-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Lý thuyết theo từng buổi
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSteps((p) => [...p, emptyStep()])}
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm buổi
                </Button>
              </div>
              {steps.map((s, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 rounded-card border border-border bg-card p-3 shadow-card"
                >
                  <StepCardHeader
                    index={i}
                    step={s}
                    onRename={(note) => updateStep(i, { note })}
                    onRemove={() => setSteps((p) => p.filter((_, idx) => idx !== i))}
                    removeDisabled={steps.length === 1}
                  />
                  <TheoryBlockEditor
                    value={s.theoryContent}
                    onChange={(theoryContent) => updateStep(i, { theoryContent })}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="exercise" className="min-h-0 flex-1 overflow-y-auto pr-4">
            <div className="flex gap-3 py-2">
              {/* Left: buổi/chương list — right: that buổi's question list (thêm/sửa/xóa). */}
              <div className="flex w-52 shrink-0 flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Buổi học</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSteps((p) => [...p, emptyStep()]);
                      setExerciseStepIndex(steps.length);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex flex-col gap-1">
                  {steps.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setExerciseStepIndex(i)}
                      className={cn(
                        'flex items-center gap-2 rounded-control border p-2 text-left text-sm transition-colors',
                        i === exerciseStepIndex
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:bg-muted/50',
                      )}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-foreground">
                        {s.note || `Buổi học ${i + 1}`}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {s.questions?.length ?? 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                {steps[exerciseStepIndex] && (
                  <div className="flex flex-col gap-2 rounded-card border border-border bg-card p-3 shadow-card">
                    <StepCardHeader
                      index={exerciseStepIndex}
                      step={steps[exerciseStepIndex]}
                      icon={ListChecks}
                      onRename={(note) => updateStep(exerciseStepIndex, { note })}
                      onRemove={() => {
                        setSteps((p) => p.filter((_, idx) => idx !== exerciseStepIndex));
                        setExerciseStepIndex((idx) => Math.max(0, idx - 1));
                      }}
                      removeDisabled={steps.length === 1}
                    />
                    <QuestionPicker
                      concept={concept.trim()}
                      selected={steps[exerciseStepIndex].questions ?? []}
                      onChange={(questions) => updateStep(exerciseStepIndex, { questions })}
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <FormDialogFooter
          onCancel={onClose}
          submitLabel={isNew ? 'Thêm mới' : 'Lưu lại'}
          onSubmit={submit}
          submitting={saving}
        />
      </DialogContent>
    </Dialog>
  );
}

function ViewTemplateDialog({ template, onClose }: { template: PlanTemplate | null; onClose: () => void }) {
  const [questionTextById, setQuestionTextById] = useState<Record<string, string>>({});
  const conceptId = template
    ? typeof template.concept === 'string'
      ? template.concept
      : template.concept?._id
    : undefined;

  useEffect(() => {
    if (!conceptId) {
      setQuestionTextById({});
      return;
    }
    listQuestions({ concept: conceptId, limit: 200 }).then((res) => {
      setQuestionTextById(Object.fromEntries(res.data.map((q) => [q._id, q.text])));
    });
  }, [conceptId]);

  return (
    <Dialog open={!!template} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="tw-scope max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <FormDialogTitle icon={Eye}>Chi tiết Lộ trình mẫu</FormDialogTitle>
        </DialogHeader>
        {template && (
          <div className="flex flex-col gap-3 text-sm">
            <DetailRow label="Tên lộ trình">{template.title}</DetailRow>
            {template.description && <p className="text-muted-foreground">{template.description}</p>}
            <div className="flex flex-wrap gap-2">
              <span className="rounded-badge bg-muted px-2 py-1 text-xs text-muted-foreground">
                Khái niệm mặc định:{' '}
                <span className="font-medium text-foreground">{conceptName(template.concept) || '—'}</span>
              </span>
              <StatusBadge variant={template.isActive ? 'success' : 'neutral'}>
                {template.isActive ? 'Đang mở' : 'Đã ẩn'}
              </StatusBadge>
            </div>
            <p className="text-xs text-muted-foreground">
              Bấm vào một buổi học để xem lý thuyết và câu hỏi của buổi đó.
            </p>
            <TemplateStepTree steps={template.steps} questionTextById={questionTextById} />
          </div>
        )}
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
  const [viewing, setViewing] = useState<PlanTemplate | null>(null);
  const [deleting, setDeleting] = useState<PlanTemplate | null>(null);

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
      id: 'isActive',
      header: 'Trạng thái',
      cell: ({ row }) =>
        row.original.isActive ? (
          <StatusBadge variant="success">Đang mở</StatusBadge>
        ) : (
          <StatusBadge variant="neutral">Đã ẩn</StatusBadge>
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
        <Button type="button" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> Thêm mới
        </Button>
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
          { key: 'view', label: 'Xem chi tiết', icon: <Eye />, onSelect: (row) => setViewing(row) },
          { key: 'edit', label: 'Chỉnh sửa', icon: <Pencil />, onSelect: (row) => setEditing(row) },
          {
            key: 'delete',
            label: 'Xoá',
            icon: <Trash2 />,
            danger: true,
            onSelect: (row) => setDeleting(row),
          },
        ]}
      />

      <TemplateFormDialog template={editing} onClose={() => setEditing(null)} onSaved={reload} />
      <ViewTemplateDialog template={viewing} onClose={() => setViewing(null)} />
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
