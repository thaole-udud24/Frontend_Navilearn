import { GenericScaffoldAdminPage } from '@/components/GenericScaffoldAdminPage';
import { listReportItems, updateReportItemStatus } from '@/services/report';
import type { ReportItem } from '@/services/report/types';

export default function AdminReportItemsPage() {
  return (
    <GenericScaffoldAdminPage<ReportItem>
      pageTitle="Báo cáo"
      breadcrumb={['Trang chủ', 'Vận hành hệ thống', 'Báo cáo']}
      searchPlaceholder="Tìm theo tiêu đề…"
      emptyLabel="Chưa có báo cáo nào"
      list={listReportItems}
      updateStatus={updateReportItemStatus}
    />
  );
}
