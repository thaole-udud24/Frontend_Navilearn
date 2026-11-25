import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AddButton } from '@/components/ui/add-button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/DialogForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createQuestion, listQuestions, updateQuestion } from '@/services/question-bank';
import type {
  Question,
  QuestionDifficulty,
  QuestionOption,
  QuestionType,
} from '@/services/question-bank/types';

const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  mcq: 'Trắc nghiệm',
  true_false: 'Đúng/sai',
  essay: 'Tự luận',
};

// Pedagogical framing shown to admins instead of the raw easy/medium/hard stored value — purely a
// display label, the stored `difficulty` value never changes.
export const DIFFICULTY_LABEL_FRIENDLY: Record<QuestionDifficulty, string> = {
  easy: 'Nhận biết',
  medium: 'Thông hiểu',
  hard: 'Vận dụng',
};

function emptyDraftOptions(): QuestionOption[] {
  return [{ text: '', isCorrect: true }, { text: '' }];
}

/** Inline "tạo mới / chỉnh sửa câu hỏi" mini-form, embedded in QuestionPicker — saves straight into
 * the shared Ngân hàng câu hỏi (create/updateQuestion), so the question stays reusable everywhere,
 * not duplicated into the caller's content. `editing` prefills the form and switches create -> update. */
export function InlineQuestionForm({
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
              {Object.entries(DIFFICULTY_LABEL_FRIENDLY).map(([v, label]) => (
                <SelectItem key={v} value={v}>
                  {label}
                </SelectItem>
              ))}
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
              <AddButton
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setOptions([...options, { text: '' }])}
              >
                Thêm đáp án
              </AddButton>
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
// caller's own `concept` scopes which questions are offered, matching what the backend validates.
// Admin can thêm (create), sửa (edit in place, pushed to the shared bank) and xóa (drop from this
// list — the question itself stays in the bank for other content to use).
export function QuestionPicker({
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
    return <p className="text-xs text-muted-foreground">Chọn khái niệm trước để thêm câu hỏi.</p>;
  }

  const selectedQuestions = questions.filter((q) => selected.includes(q._id));
  const availableQuestions = questions.filter((q) => !selected.includes(q._id));

  return (
    <div className="flex flex-col gap-3 rounded-control border border-border bg-card p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Câu hỏi đã chọn ({selectedQuestions.length})
        </p>
        <AddButton
          variant="outline"
          size="sm"
          onClick={() => setFormTarget((v) => (v === 'new' ? null : 'new'))}
        >
          Tạo câu hỏi mới
        </AddButton>
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
                title="Bỏ khỏi danh sách"
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
