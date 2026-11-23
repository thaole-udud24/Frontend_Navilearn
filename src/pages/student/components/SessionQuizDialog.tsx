import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PATHS } from '@/routes/paths';
import { getQuestion } from '@/services/question-bank';
import type { Question } from '@/services/question-bank/types';
import { submitSessionQuiz } from '@/services/planning';
import type { SessionQuizResult } from '@/services/planning/types';

interface SessionQuizDialogProps {
  planId: string;
  sessionId: string | null;
  questionIds: string[];
  onClose: () => void;
  /** Called once the quiz is passed — the caller marks the session done. */
  onPassed: () => void;
}

/** UC-PLN-TPL-03: the quiz gate between a roadmap session's theory and marking it done. On pass,
 * offers "Luyện tập thêm" (bài tập) as the natural next step instead of ending the loop here. */
export function SessionQuizDialog({
  planId,
  sessionId,
  questionIds,
  onClose,
  onPassed,
}: SessionQuizDialogProps) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SessionQuizResult | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setAnswers({});
    setResult(null);
    Promise.all(questionIds.map((id) => getQuestion(id)))
      .then(setQuestions)
      .catch(() => toast.error('Không tải được câu hỏi trắc nghiệm'))
      .finally(() => setLoading(false));
  }, [sessionId, questionIds]);

  const submit = async () => {
    if (!sessionId) return;
    if (Object.keys(answers).length < questions.length) {
      toast.error('Vui lòng trả lời hết các câu hỏi');
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitSessionQuiz(
        planId,
        sessionId,
        Object.entries(answers).map(([questionId, selectedOptionIndex]) => ({
          questionId,
          selectedOptionIndex,
        })),
      );
      setResult(res);
      if (res.passed) {
        toast.success(`Đạt ${res.scorePercent}% — buổi học đã được đánh dấu hoàn thành`);
        onPassed();
      } else {
        toast.error(`Chưa đạt (${res.scorePercent}%, cần từ 70%) — thử lại nhé`);
      }
    } catch {
      toast.error('Nộp bài thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!sessionId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="tw-scope max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trắc nghiệm trước khi hoàn thành</DialogTitle>
        </DialogHeader>

        {loading && <p className="py-6 text-center text-sm text-muted-foreground">Đang tải câu hỏi…</p>}

        {!loading && result && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            {result.passed ? (
              <CheckCircle2 className="h-12 w-12 text-success" />
            ) : (
              <XCircle className="h-12 w-12 text-danger" />
            )}
            <p className="text-2xl font-bold text-foreground">{result.scorePercent}%</p>
            <p className="text-sm text-muted-foreground">
              Đúng {result.correctCount}/{result.totalCount} câu
            </p>
            {result.passed ? (
              <Button type="button" variant="outline" onClick={() => navigate(PATHS.student.practice)}>
                Luyện tập thêm bài tập
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => setResult(null)}>
                Làm lại
              </Button>
            )}
          </div>
        )}

        {!loading && !result && (
          <div className="flex flex-col gap-4">
            {questions.map((q, qi) => (
              <div key={q._id} className="flex flex-col gap-2">
                <p className="text-sm font-medium text-foreground">
                  Câu {qi + 1}. {q.text}
                </p>
                <div className="flex flex-col gap-1.5">
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      className="flex cursor-pointer items-center gap-2 rounded-control border border-border p-2 text-sm hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <input
                        type="radio"
                        name={`q-${q._id}`}
                        checked={answers[q._id] === oi}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q._id]: oi }))}
                      />
                      {opt.text}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !result && (
          <DialogFooter>
            <Button type="button" onClick={submit} disabled={submitting}>
              Nộp bài
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
