import { GenericScaffoldStudentPage } from '@/components/GenericScaffoldAdminPage/StudentPage';
import { createRiskItem, listRiskItems } from '@/services/risk';
import type { RiskItem } from '@/services/risk/types';

export default function StudentRiskItemsPage() {
  return (
    <GenericScaffoldStudentPage<RiskItem>
      pageTitle="Báo cáo rủi ro học tập"
      breadcrumb={['Trang chủ', 'Báo cáo rủi ro học tập']}
      searchPlaceholder="Tìm theo tiêu đề…"
      emptyLabel="Bạn chưa gửi báo cáo rủi ro nào"
      createLabel="Báo cáo rủi ro"
      titleFieldLabel="Tiêu đề"
      titlePlaceholder="vd: Có nguy cơ bị tụt lại ở môn Giải tích"
      contentFieldLabel="Mô tả chi tiết"
      contentPlaceholder="Mô tả vấn đề bạn đang gặp phải…"
      list={listRiskItems}
      create={createRiskItem}
    />
  );
}
