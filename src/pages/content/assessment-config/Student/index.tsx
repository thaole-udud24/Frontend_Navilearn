import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/CustomTable';
import { Loading } from '@/components/Loading';
import { usePagedList } from '@/hooks/usePagedList';
import { useQueryErrorMessage } from '@/hooks/useQueryErrorMessage';
import { PATHS } from '@/routes/paths';
import { useAssessmentConfigList, useStartAssessment } from './hooks/useAssessmentConfigItems';
import type { AssessmentConfig } from '@/services/assessment-config/types';

// index.tsx only composes layout and calls hooks — no business logic here.
export default function AssessmentConfigItemsPage() {
  const navigate = useNavigate();
  const { paging, setPage } = usePagedList();
  const { data, isLoading, error } = useAssessmentConfigList(paging);
  const startMutation = useStartAssessment();
  const errorMessage = useQueryErrorMessage(error);

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader title="Đề kiểm tra / luyện tập" />
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <DataTable<AssessmentConfig>
        rowKey="_id"
        dataSource={data?.data ?? []}
        meta={data?.meta}
        onPageChange={setPage}
        columns={[
          { title: 'Tên đề bài', dataIndex: 'title' },
          { title: 'Số câu hỏi', render: (_, r) => r.questions.length },
          { title: 'Điểm đạt (%)', dataIndex: 'passScore' },
          {
            title: 'Hành động',
            render: (_, record) => (
              <Button
                type="primary"
                loading={startMutation.isPending}
                onClick={() =>
                  startMutation.mutate(record._id, {
                    onSuccess: () => navigate(PATHS.student.assessmentItems),
                  })
                }
              >
                Bắt đầu làm bài
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
