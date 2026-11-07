import { Tag } from 'antd';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/CustomTable';
import { Loading } from '@/components/Loading';
import { usePagedList } from '@/hooks/usePagedList';
import { useQueryErrorMessage } from '@/hooks/useQueryErrorMessage';
import { useCreateDataRetentionItem, useDataRetentionItemList } from './hooks/useDataRetentionItems';
import { CreateItemForm } from './components/CreateItemForm';
import type { DataRetentionItem } from '@/services/data-retention/types';

// index.tsx only composes layout and calls hooks — no business logic here.
export default function DataRetentionItemsPage() {
  const { paging, setPage } = usePagedList();
  const { data, isLoading, error } = useDataRetentionItemList(paging);
  const createMutation = useCreateDataRetentionItem();
  const errorMessage = useQueryErrorMessage(error);

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader title="Data retention items (scaffold – business logic pending)" />
      <CreateItemForm loading={createMutation.isPending} onSubmit={(values) => createMutation.mutate(values)} />
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <DataTable<DataRetentionItem>
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
