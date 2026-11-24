import { AccountPageFrame } from '../components/AccountPageFrame';
import { ProfileSection } from '../components/ProfileSection';

/** FE-STU-73/74/75: hồ sơ, thiết lập học tập và ảnh đại diện. */
export default function StudentProfilePage() {
  return (
    <AccountPageFrame title="Hồ sơ" description="Xem và cập nhật thông tin cá nhân, ảnh đại diện và thiết lập học tập.">
      <ProfileSection variant="student" />
    </AccountPageFrame>
  );
}
