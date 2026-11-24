import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { listStudentSubjects, studentSubjectKeys } from '@/services/student-subject';
import { AssetLibrary } from './components/AssetLibrary';

/** Same document library as "Tài liệu học tập", scoped to only the môn học this student has
 * already added under "Khoá học của tôi" — real scoping from student-subject, never a fabricated
 * subset. */
export default function CourseResourcesPage() {
  const { data } = useQuery({
    queryKey: studentSubjectKeys.list({ limit: 50 }),
    queryFn: () => listStudentSubjects({ limit: 50 }),
  });
  const conceptIds = useMemo(
    () =>
      (data?.data ?? [])
        .filter((s) => !!s.concept) // skip self-made subjects (ST-01) — they have no Concept/assets
        .map((s) => (typeof s.concept === 'string' ? s.concept : s.concept!._id)),
    [data],
  );

  return (
    <AssetLibrary
      title="Tài nguyên khoá"
      breadcrumbLabel="Tài nguyên khoá"
      description="Tài liệu thuộc các môn học bạn đã tham gia."
      emptyHint={
        conceptIds.length === 0
          ? 'Bạn chưa tham gia môn học nào — thêm môn ở "Khoá học của tôi" để xem tài liệu riêng của môn đó.'
          : 'Các môn học bạn đã tham gia chưa có tài liệu nào được đăng tải.'
      }
      scopeConceptIds={conceptIds}
    />
  );
}
