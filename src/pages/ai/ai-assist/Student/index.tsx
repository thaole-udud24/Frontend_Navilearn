import { Alert } from 'antd';
import { PageHeader } from '@/components/PageHeader';

// Only admins trigger AI question generation; students never call this API directly.
export default function AiAssistItemsPage() {
  return (
    <div>
      <PageHeader title="AI hỗ trợ" />
      <Alert type="info" message="Không áp dụng" description="Tính năng này chỉ dành cho quản trị viên." />
    </div>
  );
}
