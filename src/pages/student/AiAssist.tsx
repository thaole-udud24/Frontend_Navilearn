import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Bot,
  Download,
  Flag,
  Plus,
  Quote,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { SubjectFilterPill } from '@/components/GlobalSubjectFilter';
import { useAuthStore } from '@/hooks/useAuth';
import { useSelectedSubject } from '@/hooks/useSubjectStore';
import { getSubjectId, getSubjectLabel } from '@/lib/subjectUtils';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  askAi,
  essayFeedback,
  listAiAssistLogs,
  practiceQuestion,
  rateAiAssistLog,
  removeAiAssistLog,
  reportAiAssistLog,
} from '@/services/ai-assist';
import type { AiAssistLog, AiAssistSource } from '@/services/ai-assist/types';

type ChatMode = 'explain' | 'practice' | 'essay';

type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'ai'; text: string; sources?: AiAssistSource[]; subjectLabel?: string }
  | { id: string; role: 'ai-practice'; text: string; options: { text: string }[] }
  | { id: string; role: 'ai-essay-form'; questionText: string; answerText: string };

const QUICK_PROMPTS = [
  'Tóm tắt trọng tâm chương đang học',
  'Giải thích khái niệm cốt lõi kèm ví dụ',
  'Tạo câu hỏi trắc nghiệm ôn tập nhanh',
];

export default function AiAssistPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const { selectedSubjectId, catalogSubjects } = useSelectedSubject();

  const [mode, setMode] = useState<ChatMode>('explain');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [concept, setConcept] = useState('');
  const [composer, setComposer] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [activeLogId, setActiveLogId] = useState<string | null>(null);

  const selectedSubject = useMemo(
    () => catalogSubjects.find((s) => getSubjectId(s) === selectedSubjectId) ?? null,
    [catalogSubjects, selectedSubjectId],
  );
  const subjectLabel = selectedSubject ? getSubjectLabel(selectedSubject) : 'Tất cả môn học';
  const effectiveConcept = concept.trim() || selectedSubjectId || undefined;

  const {
    data: logsRes,
    isFetching: logsFetching,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ['ai-assist-logs', selectedSubjectId ?? 'all'],
    queryFn: () => listAiAssistLogs({ page: 1, limit: 50, subjectId: selectedSubjectId ?? undefined }),
  });

  const logs = useMemo(() => logsRes?.data ?? [], [logsRes]);
  const filteredLogs = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        (l.prompt ?? '').toLowerCase().includes(q) ||
        (l.response ?? '').toLowerCase().includes(q),
    );
  }, [logs, historySearch]);

  const pushMessage = (m: ChatMessage) => setMessages((prev) => [...prev, m]);

  const askMutation = useMutation({
    mutationFn: (q: string) => askAi({ question: q, concept: effectiveConcept }),
    onSuccess: (res) => {
      pushMessage({
        id: crypto.randomUUID(),
        role: 'ai',
        text: res.answer,
        sources: res.sources,
        subjectLabel,
      });
      refetchLogs();
    },
    onError: () => toast('AI chưa trả lời được, thử lại sau.'),
  });

  const practiceMutation = useMutation({
    mutationFn: () => practiceQuestion({ concept: effectiveConcept || 'tong-quat' }),
    onSuccess: (res) => {
      if (!res.valid) toast('AI sinh câu hỏi chưa đúng định dạng, thử lại.');
      pushMessage({ id: crypto.randomUUID(), role: 'ai-practice', text: res.text, options: res.options });
      refetchLogs();
    },
    onError: () => toast('Không sinh được câu hỏi luyện tập, thử lại sau.'),
  });

  const essayMutation = useMutation({
    mutationFn: (vars: { questionText: string; answerText: string }) => essayFeedback(vars),
    onSuccess: (res) => {
      pushMessage({ id: crypto.randomUUID(), role: 'ai', text: res.feedback, subjectLabel });
      refetchLogs();
    },
    onError: () => toast('AI chưa nhận xét được, thử lại sau.'),
  });

  const sendQuestion = (textOverride?: string) => {
    const q = (textOverride ?? composer).trim();
    if (!q) return;
    setMode('explain');
    pushMessage({ id: crypto.randomUUID(), role: 'user', text: q });
    askMutation.mutate(q);
    if (!textOverride) setComposer('');
  };

  const handleOpenEssayForm = () => {
    setMode('essay');
    pushMessage({
      id: crypto.randomUUID(),
      role: 'ai-essay-form',
      questionText: '',
      answerText: '',
    });
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveLogId(null);
    setMode('explain');
  };

  const handleSelectHistory = (log: AiAssistLog) => {
    setActiveLogId(log._id);
    setMessages([
      { id: `${log._id}-u`, role: 'user', text: log.prompt },
      {
        id: `${log._id}-a`,
        role: 'ai',
        text: log.response,
        sources: log.sources,
        subjectLabel,
      },
    ]);
  };

  const handleExportLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lich-su-ai-tro-ly.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      menu={studentMenu}
      title="AI Trợ lý học tập"
      breadcrumb={['Trang chủ', 'AI Trợ lý học tập']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      {/* Header row with compact subject filter & concept code input */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">AI Trợ lý học tập</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Đặt câu hỏi, tạo câu hỏi luyện tập hoặc nhờ nhận xét bài tự luận theo môn học.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SubjectFilterPill />
          <Input
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Mã kiến thức…"
            className="h-9 w-36 rounded-card bg-card text-xs"
          />
        </div>
      </div>

      {/* Main 2-column workspace */}
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Left: Chat workspace */}
        <section className="flex min-h-[580px] flex-col overflow-hidden rounded-card border border-border bg-card shadow-card">
          {/* Mode bar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <button
              type="button"
              onClick={() => setMode('explain')}
              className={cn(
                'rounded-control px-3 py-1.5 text-xs font-semibold transition-colors',
                mode === 'explain'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border bg-card text-foreground hover:bg-muted',
              )}
            >
              Giải thích khái niệm
            </button>
            <button
              type="button"
              disabled={practiceMutation.isPending}
              onClick={() => {
                setMode('practice');
                practiceMutation.mutate();
              }}
              className={cn(
                'rounded-control px-3 py-1.5 text-xs font-semibold transition-colors',
                mode === 'practice'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border bg-card text-foreground hover:bg-muted',
              )}
            >
              {practiceMutation.isPending ? 'Đang tạo…' : 'Tạo câu hỏi luyện tập'}
            </button>
            <button
              type="button"
              onClick={handleOpenEssayForm}
              className={cn(
                'rounded-control px-3 py-1.5 text-xs font-semibold transition-colors',
                mode === 'essay'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border bg-card text-foreground hover:bg-muted',
              )}
            >
              Nhận xét bài tự luận
            </button>
            <button
              type="button"
              onClick={handleNewChat}
              className="ml-auto inline-flex items-center gap-1 rounded-control border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5" /> Cuộc trò chuyện mới
            </button>
          </div>

          {/* Chat messages */}
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Sparkles className="h-6 w-6" />
                </span>
                <p className="text-sm font-semibold text-foreground">
                  Chào {user?.fullName ?? 'bạn'}! Mình có thể hỗ trợ gì cho môn {subjectLabel}?
                </p>
                <p className="mt-1 max-w-md text-xs text-muted-foreground">
                  Nhập câu hỏi ở bên dưới, chọn một gợi ý nhanh, hoặc nhấn vào một cuộc trò chuyện ở cột Lịch sử bên phải.
                </p>
              </div>
            )}

            {messages.map((m) => {
              if (m.role === 'user') {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[82%] rounded-2xl bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground shadow-sm">
                      {m.text}
                    </div>
                  </div>
                );
              }

              if (m.role === 'ai') {
                return (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-border bg-muted/20 p-4 text-sm text-foreground"
                  >
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-primary">
                          <Sparkles className="h-3.5 w-3.5" />
                        </span>
                        AI Trợ lý học tập
                      </span>
                      <span className="text-xs text-muted-foreground">{m.subjectLabel ?? subjectLabel}</span>
                    </div>

                    <div className="whitespace-pre-wrap leading-relaxed text-foreground">{m.text}</div>

                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2.5">
                        <Quote className="h-3 w-3 shrink-0 text-muted-foreground" />
                        {m.sources.map((s, i) => (
                          <span
                            key={s.concept ?? i}
                            className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-medium text-primary"
                          >
                            {s.label}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-2.5">
                      <button
                        type="button"
                        onClick={() => practiceMutation.mutate()}
                        className="rounded-control border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        Tạo câu hỏi trắc nghiệm
                      </button>
                      <button
                        type="button"
                        onClick={() => sendQuestion(`Giải thích sâu hơn về: ${m.text.slice(0, 80)}`)}
                        className="rounded-control border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        Giải thích sâu hơn
                      </button>
                    </div>
                  </div>
                );
              }

              if (m.role === 'ai-practice') {
                return <PracticeCard key={m.id} text={m.text} options={m.options} />;
              }

              return (
                <EssayForm
                  key={m.id}
                  pending={essayMutation.isPending}
                  onSubmit={(questionText, answerText) => essayMutation.mutate({ questionText, answerText })}
                />
              );
            })}
          </div>

          {/* Quick suggestions + Composer */}
          <div className="border-t border-border bg-muted/15 p-4">
            <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Gợi ý nhanh:</span>
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendQuestion(q)}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendQuestion()}
                placeholder="Nhập câu hỏi, yêu cầu tạo đề hoặc dán đoạn bài tự luận cần nhận xét…"
                className="flex-1 bg-card"
              />
              <Button type="button" disabled={!composer.trim() || askMutation.isPending} onClick={() => sendQuestion()}>
                <Send className="h-4 w-4" /> {askMutation.isPending ? 'Đang gửi…' : 'Giải đáp ngay'}
              </Button>
            </div>
          </div>
        </section>

        {/* Right: Interaction History */}
        <aside className="flex h-[580px] flex-col overflow-hidden rounded-card border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-bold text-foreground">Lịch sử tương tác</h2>
            <button
              type="button"
              onClick={handleExportLogs}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Download className="h-3.5 w-3.5" /> Xuất dữ liệu
            </button>
          </div>

          <div className="border-b border-border p-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Tìm trong lịch sử…"
                className="h-8 w-full rounded-control border border-input bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </div>

          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
            {filteredLogs.length === 0 && (
              <p className="py-10 text-center text-xs text-muted-foreground">
                Chưa có tương tác nào phù hợp.
              </p>
            )}
            {filteredLogs.map((log) => {
              const active = activeLogId === log._id;
              return (
                <div
                  key={log._id}
                  className={cn(
                    'group rounded-xl border p-3 transition-colors',
                    active
                      ? 'border-primary bg-primary-soft/25'
                      : 'border-border bg-card hover:bg-muted/30',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectHistory(log)}
                    className="w-full text-left"
                  >
                    <p className="line-clamp-1 text-xs font-semibold text-foreground">{log.prompt}</p>
                    <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                      {log.rating ? ` · ${log.rating}/5 ★` : ''}
                    </p>
                  </button>
                  <div className="mt-2 flex items-center gap-2 opacity-75 group-hover:opacity-100">
                    <button
                      type="button"
                      title="Đánh giá 5 sao"
                      onClick={async () => {
                        await rateAiAssistLog(log._id, 5);
                        toast('Đã đánh giá câu trả lời');
                        refetchLogs();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-warning"
                    >
                      <Star className="h-3 w-3" /> 5 sao
                    </button>
                    <button
                      type="button"
                      title="Báo cáo"
                      onClick={async () => {
                        await reportAiAssistLog(log._id, 'Nội dung không phù hợp hoặc không chính xác');
                        toast('Đã gửi báo cáo');
                        refetchLogs();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <Flag className="h-3 w-3" /> Báo cáo
                    </button>
                    <button
                      type="button"
                      title="Xoá"
                      onClick={async () => {
                        await removeAiAssistLog(log._id);
                        toast('Đã xoá khỏi lịch sử');
                        refetchLogs();
                      }}
                      className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-danger"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            <span>{filteredLogs.length} cuộc trò chuyện gần đây</span>
            <button
              type="button"
              onClick={() => refetchLogs()}
              className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary"
            >
              <RefreshCw className={cn('h-3 w-3', logsFetching && 'animate-spin')} /> Làm mới
            </button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function PracticeCard({ text, options }: { text: string; options: { text: string }[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex items-start gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Bot className="h-4 w-4" />
      </span>
      <div className="w-full max-w-md rounded-2xl border border-border bg-muted/20 p-3.5">
        <p className="mb-2 text-sm font-medium text-foreground">{text}</p>
        <div className="flex flex-col gap-1.5">
          {options.map((o, i) => (
            <label
              key={i}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-control border px-3 py-1.5 text-sm',
                selected === i ? 'border-primary bg-primary-soft' : 'border-border bg-card',
              )}
            >
              <input
                type="radio"
                name="practice-option"
                checked={selected === i}
                onChange={() => setSelected(i)}
              />
              {o.text}
            </label>
          ))}
        </div>
        <Button
          type="button"
          size="sm"
          className="mt-2"
          disabled={selected === null}
          onClick={() => setChecked(true)}
        >
          Kiểm tra kết quả
        </Button>
        {checked && (
          <p className="mt-2 text-xs text-muted-foreground">
            Đây là câu hỏi luyện tập do AI tạo để tham khảo — đáp án đúng do AI đề xuất, không tính điểm chính thức.
          </p>
        )}
      </div>
    </div>
  );
}

function EssayForm({ pending, onSubmit }: { pending: boolean; onSubmit: (q: string, a: string) => void }) {
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  return (
    <div className="flex items-start gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Bot className="h-4 w-4" />
      </span>
      <div className="w-full max-w-md rounded-2xl border border-border bg-muted/20 p-3.5">
        <p className="mb-2 text-sm font-medium text-foreground">
          Dán đề bài và bài làm tự luận để mình nhận xét nhé:
        </p>
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Đề bài tự luận…"
          rows={2}
          className="mb-2 w-full rounded-control border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <textarea
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder="Bài làm của bạn…"
          rows={3}
          className="w-full rounded-control border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          type="button"
          size="sm"
          className="mt-2"
          disabled={!q || !a || pending}
          onClick={() => onSubmit(q, a)}
        >
          {pending ? 'Đang nhận xét…' : 'Gửi cho AI nhận xét'}
        </Button>
      </div>
    </div>
  );
}
