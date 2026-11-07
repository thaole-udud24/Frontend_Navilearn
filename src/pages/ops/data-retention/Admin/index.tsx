import { Tag } from 'antd';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/CustomTable';
import { Loading } from '@/components/Loading';
import { usePagedList } from '@/hooks/usePagedList';
import { useQueryErrorMessage } from '@/hooks/useQueryErrorMessage';
import { useAdminDataRetentionItemList as useDataRetentionItemList } from './hooks/useAdminDataRetentionItems';
import type { DataRetentionItem } from '@/services/data-retention/types';

export default function AdminDataRetentionItemsPage() {
  const { paging, setPage } = usePagedList();
  const { data, isLoading, error } = useDataRetentionItemList(paging);
  const errorMessage = useQueryErrorMessage(error);

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader title="Data retention items – quản trị (scaffold – business logic pending)" />
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
