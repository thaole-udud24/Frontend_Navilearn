import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { DataTablePage } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import { listQuestions } from '@/services/question-bank';
import type { Question, QuestionType } from '@/services/question-bank/types';
import { ReportQuestionIssueButton } from './components/ReportQuestionIssueButton';

const DIFFICULTY_LABEL: Record<Question['difficulty'], string> = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
};

const TYPE_LABEL: Record<QuestionType, string> = {
  mcq: 'Trắc nghiệm',
  true_false: 'Đúng/sai',
  essay: 'Tự luận',
};

const columns: ColumnDef<Question>[] = [
  { accessorKey: 'text', header: 'Nội dung câu hỏi' },
  {
    accessorKey: 'type',
    header: 'Loại',
    cell: ({ getValue }) => <StatusBadge variant="info">{TYPE_LABEL[getValue<QuestionType>()]}</StatusBadge>,
  },
  {
    accessorKey: 'difficulty',
    header: 'Độ khó',
    cell: ({ getValue }) => DIFFICULTY_LABEL[getValue<Question['difficulty']>()],
  },
  {
    id: 'report',
    header: '',
    cell: ({ row }) => <ReportQuestionIssueButton questionId={row.original._id} />,
  },
];

// Browse-only: the backend strips correct options/reference answer for students (same guarantee
// as the legacy question-bank-items page). Taking a graded attempt happens from "Thư viện đề thi".
export default function PracticePage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <AppShell
      menu={studentMenu}
      title="Luyện tập"
      breadcrumb={['Trang chủ', 'Luyện tập']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-4 text-xl font-bold text-foreground">Luyện tập</h1>
      <DataTablePage<Question>
        columns={columns}
        getRowId={(r) => r._id}
        searchPlaceholder="Tìm câu hỏi…"
        emptyLabel="Chưa có câu hỏi tham khảo nào"
        fetcher={async ({ page, pageSize }) => {
          const res = await listQuestions({ page, limit: pageSize });
          return { data: res.data, total: res.meta?.total ?? res.data.length };
        }}
      />
    </AppShell>
  );
}
