import { GenericScaffoldAdminPage } from '@/components/GenericScaffoldAdminPage';
import { listSubjectItems, updateSubjectItemStatus } from '@/services/subject';
import type { SubjectItem } from '@/services/subject/types';

export default function AdminSubjectItemsPage() {
  return (
    <GenericScaffoldAdminPage<SubjectItem>
      pageTitle="Môn học"
      breadcrumb={['Trang chủ', 'Tài khoản & phân quyền', 'Môn học']}
      searchPlaceholder="Tìm theo tên môn học…"
      emptyLabel="Chưa có môn học nào"
      list={listSubjectItems}
      updateStatus={updateSubjectItemStatus}
    />
  );
}
