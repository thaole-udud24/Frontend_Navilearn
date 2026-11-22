import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { DataTablePage } from '@/components/DataTablePage';
import { listAssessmentConfigs } from '@/services/assessment-config';
import { startAssessment } from '@/services/assessment';
import type { AssessmentConfig } from '@/services/assessment-config/types';

const columns: ColumnDef<AssessmentConfig>[] = [
  { accessorKey: 'title', header: 'Tên đề bài' },
  { id: 'questionCount', header: 'Số câu hỏi', cell: ({ row }) => row.original.questions.length },
  { accessorKey: 'passScore', header: 'Điểm đạt', cell: ({ getValue }) => `${getValue<number>()}%` },
  {
    accessorKey: 'timeLimitMinutes',
    header: 'Thời gian',
    cell: ({ getValue }) => {
      const minutes = getValue<number>();
      return minutes ? `${minutes} phút` : 'Không giới hạn';
    },
  },
];

export default function ExamLibraryPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const startMutation = useMutation({ mutationFn: (assessmentConfigId: string) => startAssessment(assessmentConfigId) });

  return (
    <AppShell
      menu={studentMenu}
      title="Thư viện đề thi"
      breadcrumb={['Trang chủ', 'Thư viện đề thi']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-4 text-xl font-bold text-foreground">Thư viện đề thi</h1>
      <DataTablePage<AssessmentConfig>
        columns={columns}
        getRowId={(r) => r._id}
        searchPlaceholder="Tìm theo tên đề bài…"
        emptyLabel="Chưa có đề thi/luyện tập nào khả dụng"
        fetcher={async ({ page, pageSize, search }) => {
          // shortcut: BE assessment-config list has no text-search param yet — fetch one page
          // (cap 100) and filter/paginate client-side; upgrade to a server `q` param if the
          // catalog grows past that.
          const res = await listAssessmentConfigs({ page: 1, limit: 100, status: 'active' });
          const filtered = search
            ? res.data.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
            : res.data;
          const start = (page - 1) * pageSize;
          return { data: filtered.slice(start, start + pageSize), total: filtered.length };
        }}
        rowActions={[
          {
            key: 'start',
            label: 'Bắt đầu làm bài',
            onSelect: (row) => {
              startMutation.mutate(row._id, { onSuccess: () => navigate(PATHS.student.assessment) });
            },
          },
        ]}
      />
    </AppShell>
  );
}
