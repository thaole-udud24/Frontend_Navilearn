import { GenericScaffoldAdminPage } from '@/components/GenericScaffoldAdminPage';
import { listMonitoringItems, updateMonitoringItemStatus } from '@/services/monitoring';
import type { MonitoringItem } from '@/services/monitoring/types';

export default function AdminMonitoringItemsPage() {
  return (
    <GenericScaffoldAdminPage<MonitoringItem>
      pageTitle="Giám sát"
      breadcrumb={['Trang chủ', 'Vận hành hệ thống', 'Giám sát']}
      searchPlaceholder="Tìm theo tiêu đề…"
      emptyLabel="Chưa có bản ghi giám sát nào"
      list={listMonitoringItems}
      updateStatus={updateMonitoringItemStatus}
    />
  );
}
