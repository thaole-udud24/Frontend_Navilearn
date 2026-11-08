import { Tag } from 'antd';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/CustomTable';
import { Loading } from '@/components/Loading';
import { usePagedList } from '@/hooks/usePagedList';
import { useQueryErrorMessage } from '@/hooks/useQueryErrorMessage';
import { useQuestionList } from './hooks/useQuestionBankItems';
import type { Question } from '@/services/question-bank/types';

// Browse-only: answers/correct options are stripped by the backend for students.
export default function QuestionBankItemsPage() {
  const { paging, setPage } = usePagedList();
  const { data, isLoading, error } = useQuestionList(paging);
  const errorMessage = useQueryErrorMessage(error);

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader title="Ngân hàng câu hỏi (tham khảo)" />
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
        ]}
      />
    </div>
  );
}
