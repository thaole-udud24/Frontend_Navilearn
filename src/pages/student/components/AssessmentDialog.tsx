import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Flag, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PATHS } from '@/routes/paths';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  getAssessment,
  saveAssessmentDraft,
  setAssessmentFlag,
  submitAssessment,
} from '@/services/assessment';
import { assessmentKeys } from '@/services/assessment/queryKeys';
import type { Assessment } from '@/services/assessment/types';
import { getAssessmentConfig, listRubrics } from '@/services/assessment-config';
import { getQuestion } from '@/services/question-bank';
import type { Question } from '@/services/question-bank/types';
import { ReportQuestionIssueButton } from './ReportQuestionIssueButton';

interface AnswerDraft {
  selectedOptionIndex?: number;
  essayText?: string;
}

export function AssessmentDialog({
  assessmentId,
  open,
  onClose,
}: {
  assessmentId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<Record<string, AnswerDraft>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<Assessment | null>(null);

  const { data: attempt, isLoading: loadingAttempt } = useQuery({
    queryKey: ['assessment-detail', assessmentId],
    queryFn: () => getAssessment(assessmentId as string),
    enabled: open && !!assessmentId,
  });

  const isTaking = attempt?.status === 'in_progress';

  const { data: config } = useQuery({
    queryKey: ['assessment-config-detail', attempt?.assessmentConfig],
    queryFn: () => getAssessmentConfig(attempt!.assessmentConfig),
    enabled: open && isTaking && !!attempt,
  });

  const questionIds = useMemo(
    () => (attempt?.questionsOverride.length ? attempt.questionsOverride : (config?.questions ?? [])),
    [attempt, config],
  );

  const { data: questions } = useQuery({
    queryKey: ['assessment-take-questions', questionIds],
    queryFn: () => Promise.all(questionIds.map((qId) => getQuestion(qId))),
    enabled: open && isTaking && questionIds.length > 0,
  });

  const hasEssayQuestion = useMemo(() => (questions ?? []).some((q) => q.type === 'essay'), [questions]);
  const { data: rubricsRes } = useQuery({
    queryKey: ['assessment-rubrics', attempt?.concept],
    queryFn: () => listRubrics({ concept: attempt!.concept, status: 'active', limit: 5 }),
    enabled: open && isTaking && hasEssayQuestion && !!attempt?.concept,
  });
  const activeRubric = rubricsRes?.data?.[0];

  useEffect(() => {
    if (!attempt) return;
    const seedDrafts: Record<string, AnswerDraft> = {};
    const seedFlags: Record<string, boolean> = {};
    attempt.answers.forEach((a) => {
      seedDrafts[a.question] = { selectedOptionIndex: a.selectedOptionIndex, essayText: a.essayText };
      seedFlags[a.question] = !!a.flagged;
    });
    setDrafts(seedDrafts);
    setFlags(seedFlags);
    setResult(null);
  }, [attempt]);

  const saveDraftMutation = useMutation({
    mutationFn: () =>
      saveAssessmentDraft(assessmentId as string, {
        answers: Object.entries(drafts).map(([question, a]) => ({ question, ...a })),
      }),
    onSuccess: () => toast('Đã lưu nháp bài làm'),
  });

  const flagMutation = useMutation({
    mutationFn: ({ question, flagged }: { question: string; flagged: boolean }) =>
      setAssessmentFlag(assessmentId as string, question, flagged),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitAssessment(assessmentId as string, {
        answers: Object.entries(drafts).map(([question, a]) => ({ question, ...a })),
      }),
    onSuccess: (graded) => {
      setResult(graded);
      queryClient.invalidateQueries({ queryKey: assessmentKeys.all });
      toast('Đã nộp bài, xem kết quả bên dưới');
    },
    onError: () => toast('Nộp bài thất bại, thử lại sau.'),
  });

  const toggleFlag = (questionId: string) => {
    const next = !flags[questionId];
    setFlags((f) => ({ ...f, [questionId]: next }));
    flagMutation.mutate({ question: questionId, flagged: next });
  };

  const view = result ?? (attempt?.status === 'submitted' ? attempt : null);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent expandable size="lg" className="tw-scope flex max-h-[85vh] flex-col">
        <DialogHeader>
          <DialogTitle>{view ? 'Kết quả bài làm' : 'Làm bài đánh giá'}</DialogTitle>
        </DialogHeader>

        <DialogBody>
          {loadingAttempt && <p className="text-sm text-muted-foreground">Đang tải…</p>}

          {view && (
            <div className="flex flex-col gap-4">
              <div
                className={cn(
                  'flex items-center gap-3 rounded-card border p-4',
                  view.passed ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5',
                )}
              >
                {view.passed ? (
                  <CheckCircle2 className="h-6 w-6 text-success" />
                ) : (
                  <XCircle className="h-6 w-6 text-danger" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-bold text-foreground">{view.score}%</div>
                  <div className="text-sm text-muted-foreground">{view.passed ? 'Đạt' : 'Chưa đạt'}</div>
                </div>
                {/* S12: dedicated results screen (stat breakdown theo chủ đề, Mức sẵn sàng thi…) —
                    opt-in from here so the inline summary/existing E2E assertions stay unchanged. */}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(PATHS.student.practiceResult(view._id))}
                >
                  Xem kết quả chi tiết
                </Button>
              </div>

              {view.answers.map((a) => (
                <div key={a.question} className="rounded-card border border-border p-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">{a.questionText || a.question}</p>
                    {a.isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-danger" />
                    )}
                  </div>
                  {a.essayText && <p className="text-sm text-muted-foreground">Bài làm: {a.essayText}</p>}
                  {a.correctAnswer && (
                    <p className="text-sm text-muted-foreground">Đáp án đúng: {a.correctAnswer}</p>
                  )}
                  {a.feedback && (
                    <p className="mt-1 text-sm italic text-muted-foreground">Nhận xét AI: {a.feedback}</p>
                  )}
                  <ReportQuestionIssueButton questionId={a.question} />
                </div>
              ))}
            </div>
          )}

          {!view && !loadingAttempt && questions && (
            <div className="flex flex-col gap-4">
              {questions.map((q: Question, idx) => (
                <div key={q._id} className="rounded-card border border-border p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground">
                      Câu {idx + 1}. {q.text}
                    </p>
                    <button
                      type="button"
                      aria-label="Đánh dấu xem lại"
                      onClick={() => toggleFlag(q._id)}
                      className={cn('shrink-0', flags[q._id] ? 'text-warning' : 'text-muted-foreground')}
                    >
                      <Flag className="h-4 w-4" />
                    </button>
                  </div>

                  {q.type === 'mcq' || q.type === 'true_false' ? (
                    <div className="flex flex-col gap-2">
                      {q.options.map((opt, optIdx) => (
                        <label key={optIdx} className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="radio"
                            name={`q-${q._id}`}
                            checked={drafts[q._id]?.selectedOptionIndex === optIdx}
                            onChange={() =>
                              setDrafts((d) => ({ ...d, [q._id]: { selectedOptionIndex: optIdx } }))
                            }
                          />
                          {opt.text}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={drafts[q._id]?.essayText ?? ''}
                        onChange={(e) => setDrafts((d) => ({ ...d, [q._id]: { essayText: e.target.value } }))}
                        rows={4}
                        placeholder="Nhập câu trả lời tự luận của bạn…"
                        className="w-full rounded-control border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      {activeRubric && (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs">
                          <p className="mb-1 font-semibold text-primary">
                            Tiêu chí chấm điểm ({activeRubric.title} · {activeRubric.totalPoints} điểm):
                          </p>
                          <ul className="flex flex-col gap-0.5 text-muted-foreground">
                            {activeRubric.criteria.map((c, ci) => (
                              <li key={ci}>
                                • <strong className="text-foreground">{c.name}</strong> ({c.weightPct}%)
                                {c.description ? `: ${c.description}` : ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  <ReportQuestionIssueButton questionId={q._id} />
                </div>
              ))}
            </div>
          )}
        </DialogBody>

        {!view && (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => saveDraftMutation.mutate()}
              disabled={saveDraftMutation.isPending}
            >
              Lưu nháp
            </Button>
            <Button
              type="button"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending || !questions}
            >
              {submitMutation.isPending ? 'Đang nộp…' : 'Nộp bài'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
