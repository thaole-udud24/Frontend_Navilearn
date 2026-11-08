import { Alert } from 'antd';
import { PageHeader } from '@/components/PageHeader';

// BR-02/BR-35: assessment attempts are personal learning data — admins never read them directly.
export default function AdminAssessmentItemsPage() {
  return (
    <div>
      <PageHeader title="Bài làm của học sinh" />
      <Alert
        type="info"
        message="Dữ liệu cá nhân"
        description="Theo quy định (BR-02/BR-35), admin không được xem trực tiếp bài làm của từng học sinh. Xem số liệu tổng hợp tại mục Báo cáo."
      />
    </div>
  );
}
