import { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AddButton } from '@/components/ui/add-button';
import { StatusBadge } from '@/components/StatusBadge';
import { ConceptSelect } from '@/components/ConceptSelect';
import { cn } from '@/lib/utils';
import { getQuestion } from '@/services/question-bank';
import type { Question } from '@/services/question-bank/types';
import { DIFFICULTY_LABEL_FRIENDLY, InlineQuestionForm } from './QuestionPicker';

const conceptName = (c: Question['concept']) => (typeof c === 'string' ? c : c.name);
const conceptId = (c: Question['concept']) => (typeof c === 'string' ? c : c._id);

function correctAnswerLabel(q: Question) {
  if (q.type === 'essay') return 'Tự luận';
  const letters = 'ABCD';
  const correct = q.options.map((o, i) => (o.isCorrect ? letters[i] : null)).filter(Boolean);
  return correct.length ? `Đáp án đúng: ${correct.join(', ')}` : 'Chưa chọn đáp án đúng';
}

/** Groups a stage's selected questions by Concept (unlike QuestionPicker, which assumes one fixed
 * concept) — a buổi học/stage in a lộ trình mẫu commonly spans several Concept, as seen once a
 * template has more than a couple of chặng (e.g. the "Triết học Mác – Lênin" import). Fetches each
 * selected question by id in parallel since there's no "list by ids" endpoint. */
export function StageQuestionBank({
  selected,
  onChange,
  readOnly,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Static "Xem trước" mode — hides thêm/sửa/xoá affordances, just shows content + đáp án đúng. */
  readOnly?: boolean;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [newQuestionConcept, setNewQuestionConcept] = useState<string | null>(null);
  const [addingConcept, setAddingConcept] = useState<string | null>(null);
  const [showAddPicker, setShowAddPicker] = useState(false);

  useEffect(() => {
    if (selected.length === 0) {
      setQuestions([]);
      return;
    }
    setLoading(true);
    Promise.all(selected.map((id) => getQuestion(id).catch(() => null)))
      .then((res) => setQuestions(res.filter((q): q is Question => !!q)))
      .finally(() => setLoading(false));
  }, [selected]);

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; conceptId: string; items: Question[] }>();
    questions.forEach((q) => {
      const cid = conceptId(q.concept);
      const label = conceptName(q.concept) || 'Khác';
      if (!map.has(cid)) map.set(cid, { label, conceptId: cid, items: [] });
      map.get(cid)!.items.push(q);
    });
    return [...map.values()];
  }, [questions]);

  const visibleQuestions = activeConcept
    ? (groups.find((g) => g.conceptId === activeConcept)?.items ?? [])
    : questions;

  const remove = (id: string) => onChange(selected.filter((s) => s !== id));
  const add = (id: string) => onChange(selected.includes(id) ? selected : [...selected, id]);

  return (
    <div className="flex gap-3">
      <div className="flex w-44 shrink-0 flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Khái niệm / Phần</p>
          {!readOnly && (
            <AddButton
              variant="outline"
              size="sm"
              aria-label="Thêm câu hỏi"
              onClick={() => setShowAddPicker((v) => !v)}
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => setActiveConcept(null)}
          className={cn(
            'flex items-center justify-between rounded-control border p-2 text-left text-xs',
            activeConcept === null
              ? 'border-primary bg-primary/5 font-medium'
              : 'border-border hover:bg-muted/50',
          )}
        >
          Tất cả <span className="text-muted-foreground">{questions.length}</span>
        </button>
        {groups.map((g) => (
          <button
            key={g.conceptId}
            type="button"
            onClick={() => setActiveConcept(g.conceptId)}
            className={cn(
              'flex items-center justify-between gap-1 rounded-control border p-2 text-left text-xs',
              activeConcept === g.conceptId
                ? 'border-primary bg-primary/5 font-medium'
                : 'border-border hover:bg-muted/50',
            )}
          >
            <span className="min-w-0 truncate">{g.label}</span>
            <span className="shrink-0 text-muted-foreground">{g.items.length}</span>
          </button>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        {showAddPicker && (
          <div className="mb-2 flex items-end gap-2 rounded-control border border-dashed border-primary/40 bg-primary/5 p-2.5">
            <div className="flex-1">
              <ConceptSelect
                value={addingConcept ?? ''}
                onChange={setAddingConcept}
                placeholder="Chọn khái niệm cho câu hỏi mới"
              />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!addingConcept}
              onClick={() => {
                setNewQuestionConcept(addingConcept);
                setShowAddPicker(false);
              }}
            >
              Tiếp tục
            </Button>
          </div>
        )}

        {loading && <p className="text-xs text-muted-foreground">Đang tải câu hỏi…</p>}

        {!loading && visibleQuestions.length === 0 && (
          <p className="rounded-control border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Chưa có câu hỏi nào — bấm nút + ở cột trái để thêm.
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          {visibleQuestions.map((q, i) => (
            <div key={q._id} className="rounded-card border border-border bg-card p-3 shadow-card">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Câu #{i + 1}</span>
                  <StatusBadge variant="info">{DIFFICULTY_LABEL_FRIENDLY[q.difficulty]}</StatusBadge>
                  <span className="text-xs text-muted-foreground">{correctAnswerLabel(q)}</span>
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-1">
                    <button type="button" title="Sửa câu hỏi" onClick={() => setEditingQuestion(q)}>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                    </button>
                    <button type="button" title="Bỏ khỏi buổi học" onClick={() => remove(q._id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-danger" />
                    </button>
                  </div>
                )}
              </div>
              <p className="mb-1.5 text-sm text-foreground">{q.text}</p>
              {q.type !== 'essay' && (
                <div className="grid gap-1 sm:grid-cols-2">
                  {q.options.map((o, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex items-center gap-1.5 rounded-control border px-2 py-1 text-xs',
                        o.isCorrect
                          ? 'border-success/40 bg-success/10 text-success'
                          : 'border-border text-foreground',
                      )}
                    >
                      <span className="font-semibold">{'ABCD'[idx]}.</span> {o.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {!readOnly && (editingQuestion || newQuestionConcept) && (
        <InlineQuestionForm
          concept={editingQuestion ? conceptId(editingQuestion.concept) : newQuestionConcept!}
          editing={editingQuestion}
          onCancel={() => {
            setEditingQuestion(null);
            setNewQuestionConcept(null);
            setAddingConcept(null);
          }}
          onSaved={(q) => {
            setQuestions((prev) =>
              prev.some((x) => x._id === q._id) ? prev.map((x) => (x._id === q._id ? q : x)) : [q, ...prev],
            );
            add(q._id);
            setEditingQuestion(null);
            setNewQuestionConcept(null);
            setAddingConcept(null);
          }}
        />
      )}
    </div>
  );
}
