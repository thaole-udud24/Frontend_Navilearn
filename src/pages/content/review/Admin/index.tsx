import { GenericScaffoldAdminPage } from '@/components/GenericScaffoldAdminPage';
import { listReviewItems, updateReviewItemStatus } from '@/services/review';
import type { ReviewItem } from '@/services/review/types';

export default function ReviewItemsAdminPage() {
  return (
    <GenericScaffoldAdminPage<ReviewItem>
      pageTitle="Đánh giá"
      breadcrumb={['Trang chủ', 'Vận hành hệ thống', 'Đánh giá']}
      searchPlaceholder="Tìm theo tiêu đề…"
      emptyLabel="Chưa có đánh giá nào"
      list={listReviewItems}
      updateStatus={updateReviewItemStatus}
    />
  );
}
