import { useState } from 'react';
import { Button, Tag } from 'antd';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/CustomTable';
import { Loading } from '@/components/Loading';
import { usePagedList } from '@/hooks/usePagedList';
import { useQueryErrorMessage } from '@/hooks/useQueryErrorMessage';
import { useAssessmentList } from './hooks/useAssessmentItems';
import { TakeAssessmentModal } from './components/TakeAssessmentModal';
import type { Assessment } from '@/services/assessment/types';

// index.tsx only composes layout and calls hooks — no business logic here.
export default function AssessmentItemsPage() {
  const { paging, setPage } = usePagedList();
  const { data, isLoading, error } = useAssessmentList(paging);
  const errorMessage = useQueryErrorMessage(error);
  const [taking, setTaking] = useState<Assessment | null>(null);

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader title="Bài làm của tôi" />
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <DataTable<Assessment>
        rowKey="_id"
        dataSource={data?.data ?? []}
        meta={data?.meta}
        onPageChange={setPage}
        columns={[
          { title: 'Trạng thái', dataIndex: 'status', render: (s: string) => <Tag>{s === 'in_progress' ? 'Đang làm' : 'Đã nộp'}</Tag> },
          { title: 'Điểm', dataIndex: 'score', render: (s: number, r) => (r.status === 'submitted' ? `${s}%` : '-') },
          {
            title: 'Kết quả',
            render: (_, r) =>
              r.status === 'submitted' ? <Tag color={r.passed ? 'green' : 'red'}>{r.passed ? 'Đạt' : 'Chưa đạt'}</Tag> : '-',
          },
          {
            title: 'Hành động',
            render: (_, record) =>
              record.status === 'in_progress' && <Button type="primary" onClick={() => setTaking(record)}>Làm bài</Button>,
          },
        ]}
      />
      {taking && (
        <TakeAssessmentModal
          assessmentId={taking._id}
          assessmentConfigId={taking.assessmentConfig}
          onClose={() => setTaking(null)}
        />
      )}
    </div>
  );
}
