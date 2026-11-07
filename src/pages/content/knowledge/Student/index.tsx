import { Tag } from 'antd';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/CustomTable';
import { Loading } from '@/components/Loading';
import { usePagedList } from '@/hooks/usePagedList';
import { useQueryErrorMessage } from '@/hooks/useQueryErrorMessage';
import { useCreateKnowledgeItem, useKnowledgeItemList } from './hooks/useKnowledgeItems';
import { CreateItemForm } from './components/CreateItemForm';
import type { KnowledgeItem } from '@/services/knowledge/types';

// index.tsx only composes layout and calls hooks — no business logic here.
export default function KnowledgeItemsPage() {
  const { paging, setPage } = usePagedList();
  const { data, isLoading, error } = useKnowledgeItemList(paging);
  const createMutation = useCreateKnowledgeItem();
  const errorMessage = useQueryErrorMessage(error);

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader title="Knowledge items (scaffold – business logic pending)" />
      <CreateItemForm loading={createMutation.isPending} onSubmit={(values) => createMutation.mutate(values)} />
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <DataTable<KnowledgeItem>
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
