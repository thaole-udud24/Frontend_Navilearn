import { useState } from 'react';
import { Button, Popconfirm, Tag } from 'antd';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/CustomTable';
import { Loading } from '@/components/Loading';
import { usePagedList } from '@/hooks/usePagedList';
import { useQueryErrorMessage } from '@/hooks/useQueryErrorMessage';
import {
  useAdminAssessmentConfigList,
  useArchiveAssessmentConfig,
  useConceptOptions,
  useCreateAssessmentConfig,
  useQuestionsByConcept,
} from './hooks/useAdminAssessmentConfigItems';
import { CreateItemForm } from './components/CreateItemForm';
import type { AssessmentConfig } from '@/services/assessment-config/types';

export default function AdminAssessmentConfigItemsPage() {
  const { paging, setPage } = usePagedList();
  const { data, isLoading, error } = useAdminAssessmentConfigList(paging);
  const { data: conceptData } = useConceptOptions();
  const [conceptId, setConceptId] = useState<string>();
  const { data: questionData } = useQuestionsByConcept(conceptId);
  const createMutation = useCreateAssessmentConfig();
  const archiveMutation = useArchiveAssessmentConfig();
  const errorMessage = useQueryErrorMessage(error);

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader title="Quản lý đề kiểm tra/luyện tập" />
      <CreateItemForm
        loading={createMutation.isPending}
        concepts={conceptData?.data ?? []}
        questions={questionData?.data ?? []}
        onConceptChange={setConceptId}
        onSubmit={(values) => createMutation.mutate(values)}
      />
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
          { title: 'Trạng thái', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
          {
            title: 'Hành động',
            render: (_, record) =>
              record.status === 'active' && (
                <Popconfirm title="Lưu trữ đề bài này?" onConfirm={() => archiveMutation.mutate(record._id)}>
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
