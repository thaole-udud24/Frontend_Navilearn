import { Alert } from 'antd';
import { PageHeader } from '@/components/PageHeader';

// BR-02/BR-35: per-student mastery is personal learning data — admins never read it directly.
export default function AdminMasteryItemsPage() {
  return (
    <div>
      <PageHeader title="Mức độ thành thạo của học sinh" />
      <Alert
        type="info"
        message="Dữ liệu cá nhân"
        description="Theo quy định (BR-02/BR-35), admin không được xem trực tiếp mastery của từng học sinh. Xem số liệu tổng hợp tại mục Báo cáo."
      />
    </div>
  );
}
