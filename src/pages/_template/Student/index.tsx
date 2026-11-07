import { Tag } from 'antd';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/CustomTable';
import { Loading } from '@/components/Loading';
import { usePagedList } from '@/hooks/usePagedList';
import { useQueryErrorMessage } from '@/hooks/useQueryErrorMessage';
import { useCreateTemplateItem, useTemplateItemList } from './hooks/useTemplateItems';
import { CreateItemForm } from './components/CreateItemForm';
import type { TemplateItem } from '@/services/_template/types';

// index.tsx only composes layout and calls hooks — no business logic here.
export default function TemplateItemsPage() {
  const { paging, setPage } = usePagedList();
  const { data, isLoading, error } = useTemplateItemList(paging);
  const createMutation = useCreateTemplateItem();
  const errorMessage = useQueryErrorMessage(error);

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader title="Template items (demo module)" />
      <CreateItemForm loading={createMutation.isPending} onSubmit={(values) => createMutation.mutate(values)} />
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <DataTable<TemplateItem>
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
