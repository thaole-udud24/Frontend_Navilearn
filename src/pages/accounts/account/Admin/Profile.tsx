import { AccountPageFrame } from '../components/AccountPageFrame';
import { ProfileSection } from '../components/ProfileSection';

/** FE-ADM-85: thiết lập cá nhân của quản trị viên (ảnh đại diện, ngôn ngữ, múi giờ). */
export default function AdminProfilePage() {
  return (
    <AccountPageFrame title="Hồ sơ quản trị viên" description="Cập nhật ảnh đại diện, ngôn ngữ và múi giờ.">
      <ProfileSection variant="admin" />
    </AccountPageFrame>
  );
}
