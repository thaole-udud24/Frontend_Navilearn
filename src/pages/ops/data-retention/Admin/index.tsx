import { GenericScaffoldAdminPage } from '@/components/GenericScaffoldAdminPage';
import { listDataRetentionItems, updateDataRetentionItemStatus } from '@/services/data-retention';
import type { DataRetentionItem } from '@/services/data-retention/types';

export default function AdminDataRetentionItemsPage() {
  return (
    <GenericScaffoldAdminPage<DataRetentionItem>
      pageTitle="Dữ liệu"
      breadcrumb={['Trang chủ', 'Vận hành hệ thống', 'Dữ liệu']}
      searchPlaceholder="Tìm theo tiêu đề…"
      emptyLabel="Chưa có yêu cầu lưu trữ/xoá dữ liệu nào"
      list={listDataRetentionItems}
      updateStatus={updateDataRetentionItemStatus}
    />
  );
}
