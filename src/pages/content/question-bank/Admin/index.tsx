import { Button, Popconfirm, Tag } from 'antd';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/CustomTable';
import { Loading } from '@/components/Loading';
import { usePagedList } from '@/hooks/usePagedList';
import { useQueryErrorMessage } from '@/hooks/useQueryErrorMessage';
import { useAdminQuestionList, useArchiveQuestion, useConceptOptions, useCreateQuestion } from './hooks/useAdminQuestionBankItems';
import { CreateItemForm } from './components/CreateItemForm';
import type { Question } from '@/services/question-bank/types';

export default function AdminQuestionBankItemsPage() {
  const { paging, setPage } = usePagedList();
  const { data, isLoading, error } = useAdminQuestionList(paging);
  const { data: conceptData } = useConceptOptions();
  const createMutation = useCreateQuestion();
  const archiveMutation = useArchiveQuestion();
  const errorMessage = useQueryErrorMessage(error);

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader title="Ngân hàng câu hỏi" />
      <CreateItemForm
        loading={createMutation.isPending}
        concepts={conceptData?.data ?? []}
        onSubmit={(values) => createMutation.mutate(values)}
      />
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <DataTable<Question>
        rowKey="_id"
        dataSource={data?.data ?? []}
        meta={data?.meta}
        onPageChange={setPage}
        columns={[
          { title: 'Nội dung', dataIndex: 'text' },
          { title: 'Loại', dataIndex: 'type', render: (t: string) => <Tag>{t === 'mcq' ? 'Trắc nghiệm' : 'Tự luận'}</Tag> },
          { title: 'Độ khó', dataIndex: 'difficulty' },
          { title: 'Điểm', dataIndex: 'points' },
          { title: 'Trạng thái', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
          {
            title: 'Hành động',
            render: (_, record) =>
              record.status === 'active' && (
                <Popconfirm title="Lưu trữ câu hỏi này?" onConfirm={() => archiveMutation.mutate(record._id)}>
                  <Button size="small" danger>
                    Lưu trữ
                  </Button>
                </Popconfirm>
              ),
          },
        ]}
      />
    </div>
  );
}
