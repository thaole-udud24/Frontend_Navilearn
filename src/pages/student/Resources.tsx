import { AssetLibrary } from './components/AssetLibrary';

/** Toàn bộ tài liệu nguồn đã được admin xuất bản, không giới hạn theo môn học của riêng học sinh
 * này — xem "Tài nguyên khoá" (CourseResources.tsx) cho tài liệu chỉ thuộc các môn đã tham gia. */
export default function ResourcesPage() {
  return (
    <AssetLibrary
      title="Tài liệu học tập"
      breadcrumbLabel="Tài liệu học tập"
      description="Tài liệu tham khảo do giảng viên/quản trị viên chia sẻ cho toàn bộ môn học."
      emptyHint="Giảng viên chưa đăng tải tài liệu nào. Quay lại sau nhé."
    />
  );
}
