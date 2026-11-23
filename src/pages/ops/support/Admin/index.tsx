import { GenericScaffoldAdminPage } from '@/components/GenericScaffoldAdminPage';
import { listSupportItems, updateSupportItemStatus } from '@/services/support';
import type { SupportItem } from '@/services/support/types';

export default function AdminSupportItemsPage() {
  return (
    <GenericScaffoldAdminPage<SupportItem>
      pageTitle="Hỗ trợ"
      breadcrumb={['Trang chủ', 'Vận hành hệ thống', 'Hỗ trợ']}
      searchPlaceholder="Tìm theo tiêu đề…"
      emptyLabel="Chưa có yêu cầu hỗ trợ nào"
      list={listSupportItems}
      updateStatus={updateSupportItemStatus}
    />
  );
}
