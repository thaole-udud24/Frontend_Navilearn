import { GenericScaffoldStudentPage } from '@/components/GenericScaffoldAdminPage/StudentPage';
import { createSupportItem, listSupportItems } from '@/services/support';
import type { SupportItem } from '@/services/support/types';

export default function StudentSupportItemsPage() {
  return (
    <GenericScaffoldStudentPage<SupportItem>
      pageTitle="Yêu cầu hỗ trợ"
      breadcrumb={['Trang chủ', 'Yêu cầu hỗ trợ']}
      searchPlaceholder="Tìm theo tiêu đề…"
      emptyLabel="Bạn chưa gửi yêu cầu hỗ trợ nào"
      createLabel="Gửi yêu cầu hỗ trợ"
      titleFieldLabel="Tiêu đề"
      titlePlaceholder="vd: Không đăng nhập được vào hệ thống"
      contentFieldLabel="Mô tả chi tiết"
      contentPlaceholder="Mô tả sự cố hoặc yêu cầu của bạn…"
      list={listSupportItems}
      create={createSupportItem}
    />
  );
}
