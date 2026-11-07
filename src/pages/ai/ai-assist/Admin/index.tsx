import { Tag } from 'antd';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/CustomTable';
import { Loading } from '@/components/Loading';
import { usePagedList } from '@/hooks/usePagedList';
import { useQueryErrorMessage } from '@/hooks/useQueryErrorMessage';
import { useAdminAiAssistItemList as useAiAssistItemList } from './hooks/useAdminAiAssistItems';
import type { AiAssistItem } from '@/services/ai-assist/types';

export default function AdminAiAssistItemsPage() {
  const { paging, setPage } = usePagedList();
  const { data, isLoading, error } = useAiAssistItemList(paging);
  const errorMessage = useQueryErrorMessage(error);

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader title="AI assist items – quản trị (scaffold – business logic pending)" />
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <DataTable<AiAssistItem>
        rowKey="_id"
        dataSource={data?.data ?? []}
        meta={data?.meta}
        onPageChange={setPage}
        columns={[
          { title: 'Tiêu đề', dataIndex: 'title' },
          { title: 'Nội dung', dataIndex: 'content' },
          { title: 'Trạng thái', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
        ]}
      />
    </div>
  );
}
