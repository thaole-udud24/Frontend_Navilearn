import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { DataTablePage } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import { listIssueReports, resolveIssueReport } from '@/services/question-bank';
import type { QuestionIssueReport } from '@/services/question-bank/types';

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

  const columns: ColumnDef<QuestionIssueReport>[] = [
    {
      accessorKey: 'question',
      header: 'Câu hỏi',
      cell: ({ getValue }) => {
        const q = getValue<QuestionIssueReport['question']>();
        return typeof q === 'string' ? q : q.text;
      },
    },
    { accessorKey: 'reason', header: 'Lý do', cell: ({ getValue }) => REASON_LABEL[getValue<string>()] ?? getValue<string>() },
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
            key: 'fix',
            label: 'Đánh dấu đã xử lý',
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
            hidden: (row) => row.status !== 'open',
            onSelect: async (row) => {
              await resolveIssueReport(row._id, { action: 'dismiss' });
              toast('Đã bỏ qua báo lỗi');
              setTableKey((k) => k + 1);
            },
          },
        ]}
      />
    </AppShell>
  );
}
