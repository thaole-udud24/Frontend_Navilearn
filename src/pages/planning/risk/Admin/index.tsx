import { GenericScaffoldAdminPage } from '@/components/GenericScaffoldAdminPage';
import { listRiskItems, updateRiskItemStatus } from '@/services/risk';
import type { RiskItem } from '@/services/risk/types';

export default function AdminRiskItemsPage() {
  return (
    <GenericScaffoldAdminPage<RiskItem>
      pageTitle="Ngưỡng cảnh báo"
      breadcrumb={['Trang chủ', 'Vận hành hệ thống', 'Cấu hình hệ thống', 'Ngưỡng cảnh báo']}
      searchPlaceholder="Tìm theo tiêu đề…"
      emptyLabel="Chưa có ngưỡng cảnh báo nào"
      list={listRiskItems}
      updateStatus={updateRiskItemStatus}
    />
  );
}
