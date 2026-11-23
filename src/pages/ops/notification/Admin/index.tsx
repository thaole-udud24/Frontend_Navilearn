import { GenericScaffoldAdminPage } from '@/components/GenericScaffoldAdminPage';
import { listNotificationItems, updateNotificationItemStatus } from '@/services/notification';
import type { NotificationItem } from '@/services/notification/types';

export default function AdminNotificationItemsPage() {
  return (
    <GenericScaffoldAdminPage<NotificationItem>
      pageTitle="Thông báo"
      breadcrumb={['Trang chủ', 'Vận hành hệ thống', 'Thông báo']}
      searchPlaceholder="Tìm theo tiêu đề…"
      emptyLabel="Chưa có thông báo nào"
      list={listNotificationItems}
      updateStatus={updateNotificationItemStatus}
    />
  );
}
