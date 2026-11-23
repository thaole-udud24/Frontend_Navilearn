import { GenericScaffoldStudentPage } from '@/components/GenericScaffoldAdminPage/StudentPage';
import { createSubjectItem, listSubjectItems } from '@/services/subject';
import type { SubjectItem } from '@/services/subject/types';

export default function StudentSubjectItemsPage() {
  return (
    <GenericScaffoldStudentPage<SubjectItem>
      pageTitle="Đề xuất môn học"
      breadcrumb={['Trang chủ', 'Đề xuất môn học']}
      searchPlaceholder="Tìm theo tên môn học…"
      emptyLabel="Bạn chưa gửi đề xuất môn học nào"
      createLabel="Đề xuất môn học"
      titleFieldLabel="Tên môn học"
      titlePlaceholder="vd: Mong muốn mở môn Xác suất thống kê"
      contentFieldLabel="Lý do đề xuất"
      contentPlaceholder="Vì sao bạn muốn đề xuất môn học này…"
      list={listSubjectItems}
      create={createSubjectItem}
    />
  );
}
