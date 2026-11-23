import { GenericScaffoldAdminPage } from '@/components/GenericScaffoldAdminPage';
import { listAdminReportItems, updateAdminReportItemStatus } from '@/services/admin-report';
import type { AdminReportItem } from '@/services/admin-report/types';

export default function AdminReportItemsAdminPage() {
  return (
    <GenericScaffoldAdminPage<AdminReportItem>
      pageTitle="Báo cáo sự cố"
      breadcrumb={['Trang chủ', 'Vận hành hệ thống', 'Báo cáo sự cố']}
      searchPlaceholder="Tìm theo tiêu đề…"
      emptyLabel="Chưa có báo cáo nào"
      list={listAdminReportItems}
      updateStatus={updateAdminReportItemStatus}
    />
  );
}
