import { Tag } from 'antd';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/CustomTable';
import { Loading } from '@/components/Loading';
import { usePagedList } from '@/hooks/usePagedList';
import { useQueryErrorMessage } from '@/hooks/useQueryErrorMessage';
import { useAdminAccountItemList as useAccountItemList } from './hooks/useAdminAccountItems';
import type { AccountItem } from '@/services/account/types';

export default function AdminAccountItemsPage() {
  const { paging, setPage } = usePagedList();
  const { data, isLoading, error } = useAccountItemList(paging);
  const errorMessage = useQueryErrorMessage(error);

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader title="Account items – quản trị (scaffold – business logic pending)" />
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <DataTable<AccountItem>
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
