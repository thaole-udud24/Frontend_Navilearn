import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, MessageSquareReply, Pencil, XCircle } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { DataTablePage } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import { getQuestion, listIssueReports, replyIssueReport, resolveIssueReport } from '@/services/question-bank';
import type { Question, QuestionIssueReport } from '@/services/question-bank/types';
import type { ApiError } from '@/services/apiError';
// B2 "Sửa câu hỏi ngay tại chỗ": reuse the exact same edit dialog/mutation QuestionBankAdmin uses —
// no parallel editor.
import { QuestionFormDialog } from './QuestionBankAdmin';

const REASON_LABEL: Record<string, string> = {
  wrong_answer: 'Đáp án sai',
  unclear: 'Đề bài không rõ',
  typo: 'Lỗi chính tả',
  duplicate: 'Trùng câu hỏi khác',
  other: 'Khác',
};

export default function IssueReportsAdmin() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const columns: ColumnDef<QuestionIssueReport>[] = [
    {
      accessorKey: 'question',
      header: 'Câu hỏi',
      cell: ({ getValue }) => {
        const q = getValue<QuestionIssueReport['question']>();
        return typeof q === 'string' ? q : q?.text ?? '(Câu hỏi đã bị xoá)';
      },
    },
    {
      accessorKey: 'reason',
      header: 'Lý do',
      cell: ({ getValue }) => REASON_LABEL[getValue<string>()] ?? getValue<string>(),
    },
    { accessorKey: 'description', header: 'Mô tả' },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ getValue }) => {
        const v = getValue<string>();
        if (v === 'open') return <StatusBadge variant="warning">Đang mở</StatusBadge>;
        if (v === 'resolved') return <StatusBadge variant="success">Đã xử lý</StatusBadge>;
        return <StatusBadge variant="neutral">Đã bỏ qua</StatusBadge>;
      },
    },
    {
      accessorKey: 'reply',
      header: 'Phản hồi SV',
      cell: ({ getValue }) => getValue<string>() || '—',
    },
  ];

  return (
    <AppShell
      menu={adminMenu}
      title="Báo lỗi câu hỏi"
      breadcrumb={['Trang chủ', 'Ngân hàng câu hỏi', 'Báo lỗi']}
      userName={user?.fullName ?? ''}
      roleLabel="Quản trị viên"
      compactHeader
      area="admin"
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-4 text-xl font-bold text-foreground">Báo lỗi câu hỏi</h1>
      <DataTablePage<QuestionIssueReport>
        key={tableKey}
        columns={columns}
        getRowId={(r) => r._id}
        searchPlaceholder="Tìm trong báo lỗi…"
        emptyLabel="Chưa có báo lỗi nào từ sinh viên"
        fetcher={async ({ page, pageSize }) => {
          const res = await listIssueReports({ page, limit: pageSize });
          return { data: res.data, total: res.meta?.total ?? res.data.length };
        }}
        rowActions={[
          {
            key: 'edit-question',
            label: 'Sửa câu hỏi ngay tại chỗ',
            icon: <Pencil />,
            hidden: (row) => typeof row.question === 'string' || !row.question,
            onSelect: async (row) => {
              const questionId = typeof row.question === 'string' ? row.question : row.question._id;
              try {
                const full = await getQuestion(questionId);
                setEditingQuestion(full);
              } catch (err) {
                toast((err as ApiError)?.message || 'Không tải được câu hỏi');
              }
            },
          },
          {
            key: 'reply',
            label: 'Gửi phản hồi SV',
            icon: <MessageSquareReply />,
            onSelect: async (row) => {
              const message = window.prompt('Nội dung phản hồi gửi cho sinh viên đã báo lỗi:', row.reply ?? '');
              if (!message) return;
              try {
                await replyIssueReport(row._id, message);
                toast('Đã gửi phản hồi cho sinh viên');
                setTableKey((k) => k + 1);
              } catch (err) {
                toast((err as ApiError)?.message || 'Gửi phản hồi thất bại');
              }
            },
          },
          {
            key: 'fix',
            label: 'Đánh dấu đã xử lý',
            icon: <CheckCircle2 />,
            hidden: (row) => row.status !== 'open',
            onSelect: async (row) => {
              const resolution = window.prompt('Ghi chú xử lý (không bắt buộc)') ?? '';
              await resolveIssueReport(row._id, { action: 'fix', resolution });
              toast('Đã xử lý báo lỗi');
              setTableKey((k) => k + 1);
            },
          },
          {
            key: 'dismiss',
            label: 'Bỏ qua',
            icon: <XCircle />,
            danger: true,
            hidden: (row) => row.status !== 'open',
            onSelect: async (row) => {
              await resolveIssueReport(row._id, { action: 'dismiss' });
              toast('Đã bỏ qua báo lỗi');
              setTableKey((k) => k + 1);
            },
          },
        ]}
      />
      <QuestionFormDialog
        open={!!editingQuestion}
        onClose={() => setEditingQuestion(null)}
        editing={editingQuestion}
        onSaved={() => setTableKey((k) => k + 1)}
      />
    </AppShell>
  );
}
