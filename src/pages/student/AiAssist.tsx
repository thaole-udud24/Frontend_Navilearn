import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Bot, Flag, Send, Sparkles, Star, Trash2, User } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTablePage } from '@/components/DataTablePage';
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
import type { AiAssistLog } from '@/services/ai-assist/types';

const KIND_LABEL: Record<string, string> = {
  generate_question: 'Sinh câu hỏi (admin)',
  practice_question: 'Sinh câu hỏi luyện tập',
  grade_essay: 'Chấm tự luận',
  essay_feedback: 'Nhận xét tự luận',
  qa: 'Hỏi đáp',
  explain_wrong: 'Giải thích câu sai',
};

type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'ai'; text: string }
  | { id: string; role: 'ai-practice'; text: string; options: { text: string }[] }
  | { id: string; role: 'ai-essay-form'; questionText: string; answerText: string };

export default function AiAssistPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [historyKey, setHistoryKey] = useState(0);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [concept, setConcept] = useState('');
  const [composer, setComposer] = useState('');

  const pushMessage = (m: ChatMessage) => setMessages((prev) => [...prev, m]);

  const askMutation = useMutation({
    mutationFn: (q: string) => askAi({ question: q, concept: concept || undefined }),
    onSuccess: (res) => pushMessage({ id: crypto.randomUUID(), role: 'ai', text: res.answer }),
    onError: () => toast('AI chưa trả lời được, thử lại sau.'),
  });

  const practiceMutation = useMutation({
    mutationFn: () => practiceQuestion({ concept: concept || 'tong-quat' }),
    onSuccess: (res) => {
      if (!res.valid) toast('AI sinh câu hỏi chưa đúng định dạng, thử lại.');
      pushMessage({ id: crypto.randomUUID(), role: 'ai-practice', text: res.text, options: res.options });
    },
    onError: () => toast('Không sinh được câu hỏi luyện tập, thử lại sau.'),
  });

  const essayMutation = useMutation({
    mutationFn: (vars: { questionText: string; answerText: string }) => essayFeedback(vars),
    onSuccess: (res) => pushMessage({ id: crypto.randomUUID(), role: 'ai', text: res.feedback }),
    onError: () => toast('AI chưa nhận xét được, thử lại sau.'),
  });

  const sendQuestion = () => {
    if (!composer.trim()) return;
    pushMessage({ id: crypto.randomUUID(), role: 'user', text: composer });
    askMutation.mutate(composer);
    setComposer('');
  };

  const columns: ColumnDef<AiAssistLog>[] = [
    {
      accessorKey: 'kind',
      header: 'Loại',
      cell: ({ getValue }) => KIND_LABEL[getValue<string>()] ?? getValue<string>(),
    },
    {
      accessorKey: 'prompt',
      header: 'Câu hỏi / Nội dung',
      cell: ({ getValue }) => <span className="line-clamp-2">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'response',
      header: 'Trả lời của AI',
      cell: ({ getValue }) => <span className="line-clamp-2">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'rating',
      header: 'Đánh giá',
      cell: ({ getValue }) => {
        const r = getValue<number | undefined>();
        if (!r) return '—';
        return (
          <span className="inline-flex items-center gap-1">
            {r}/5 <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          </span>
        );
      },
    },
    {
      accessorKey: 'reported',
      header: 'Báo cáo',
      cell: ({ getValue }) => (getValue<boolean>() ? <Flag className="h-4 w-4 text-danger" /> : '—'),
    },
  ];

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
      <div className="flex flex-col gap-5">
        {/* Greeting banner */}
        <div className="flex items-center justify-between gap-4 rounded-card bg-gradient-to-r from-primary to-indigo-500 p-5 text-primary-foreground shadow-card">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="h-5 w-5" /> Chào {user?.fullName ?? 'bạn'}! Hôm nay mình cùng giải quyết
              môn học nào?
            </h1>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Đặt câu hỏi, xin AI tạo câu luyện tập, hoặc nhờ nhận xét bài tự luận — ngay trong khung chat bên
              dưới.
            </p>
          </div>
          <Input
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Mã kiến thức…"
            className="hidden w-48 bg-white/90 text-foreground sm:block"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={practiceMutation.isPending}
            onClick={() => practiceMutation.mutate()}
          >
            {practiceMutation.isPending ? 'Đang tạo…' : 'Tạo câu hỏi luyện tập'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              pushMessage({
                id: crypto.randomUUID(),
                role: 'ai-essay-form',
                questionText: '',
                answerText: '',
              })
            }
          >
            Nhận xét bài tự luận
          </Button>
        </div>

        {/* Chat timeline */}
        <div className="flex min-h-[320px] flex-col gap-3 rounded-card border border-border bg-card p-4 shadow-card">
          {messages.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Chưa có cuộc trò chuyện nào — hãy đặt câu hỏi ở ô bên dưới.
            </p>
          )}

          {messages.map((m) => {
            if (m.role === 'user') {
              return (
                <div key={m.id} className="flex items-start justify-end gap-2">
                  <p className="max-w-[75%] rounded-card bg-primary px-3 py-2 text-sm text-primary-foreground">
                    {m.text}
                  </p>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </span>
                </div>
              );
            }
            if (m.role === 'ai') {
              return (
                <div key={m.id} className="flex items-start gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Bot className="h-4 w-4" />
                  </span>
                  <p className="max-w-[75%] rounded-card bg-muted px-3 py-2 text-sm text-foreground">
                    {m.text}
                  </p>
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

        {/* Composer */}
        <div className="flex gap-2 rounded-card border border-border bg-card p-3 shadow-card">
          <Input
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendQuestion()}
            placeholder="Nhập câu hỏi của bạn…"
            className="flex-1"
          />
          <Button type="button" disabled={!composer.trim() || askMutation.isPending} onClick={sendQuestion}>
            <Send className="h-4 w-4" /> {askMutation.isPending ? 'Đang gửi…' : 'Giải đáp ngay'}
          </Button>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-foreground">Lịch sử tương tác với AI</h3>
          <DataTablePage<AiAssistLog>
            key={historyKey}
            columns={columns}
            getRowId={(r) => r._id}
            searchPlaceholder="Tìm trong lịch sử…"
            emptyLabel="Chưa có tương tác nào với AI"
            fetcher={async ({ page, pageSize }) => {
              const res = await listAiAssistLogs({ page, limit: pageSize });
              return { data: res.data, total: res.meta?.total ?? res.data.length };
            }}
            rowActions={[
              {
                key: 'rate',
                label: 'Đánh giá 5 sao',
                icon: <Star className="h-4 w-4" />,
                onSelect: async (row) => {
                  await rateAiAssistLog(row._id, 5);
                  toast('Đã đánh giá câu trả lời');
                  setHistoryKey((k) => k + 1);
                },
              },
              {
                key: 'report',
                label: 'Báo câu trả lời không phù hợp',
                icon: <Flag className="h-4 w-4" />,
                onSelect: async (row) => {
                  await reportAiAssistLog(row._id, 'Nội dung không phù hợp hoặc không chính xác');
                  toast('Đã gửi báo cáo');
                  setHistoryKey((k) => k + 1);
                },
              },
              {
                key: 'delete',
                label: 'Xoá',
                danger: true,
                icon: <Trash2 className="h-4 w-4" />,
                onSelect: async (row) => {
                  await removeAiAssistLog(row._id);
                  toast('Đã xoá khỏi lịch sử');
                  setHistoryKey((k) => k + 1);
                },
              },
            ]}
          />
        </div>
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
      <div className="w-full max-w-md rounded-card bg-muted p-3">
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
            Đây là câu hỏi luyện tập do AI tạo để tham khảo — đáp án đúng do AI đề xuất, không tính điểm chính
            thức.
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
      <div className="w-full max-w-md rounded-card bg-muted p-3">
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
