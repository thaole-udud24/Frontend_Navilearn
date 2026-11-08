import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/CustomTable';
import { Loading } from '@/components/Loading';
import { usePagedList } from '@/hooks/usePagedList';
import { useQueryErrorMessage } from '@/hooks/useQueryErrorMessage';
import { useConceptList } from './hooks/useKnowledgeItems';
import type { Concept } from '@/services/knowledge/types';

// index.tsx only composes layout and calls hooks — no business logic here.
export default function KnowledgeItemsPage() {
  const { paging, setPage } = usePagedList();
  const { data, isLoading, error } = useConceptList(paging);
  const errorMessage = useQueryErrorMessage(error);

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader title="Danh sách khái niệm" />
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <DataTable<Concept>
        rowKey="_id"
        dataSource={data?.data ?? []}
        meta={data?.meta}
        onPageChange={setPage}
        columns={[
          { title: 'Tên khái niệm', dataIndex: 'name' },
          { title: 'Mô tả', dataIndex: 'description' },
        ]}
      />
    </div>
  );
}
