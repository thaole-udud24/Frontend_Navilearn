import { AccountPageFrame } from '../components/AccountPageFrame';
import { PasswordSection } from '../components/PasswordSection';

/** FE-ADM-86: đổi mật khẩu của quản trị viên. */
export default function AdminChangePasswordPage() {
  return (
    <AccountPageFrame title="Đổi mật khẩu" description="Đặt mật khẩu mới cho tài khoản quản trị.">
      <PasswordSection />
    </AccountPageFrame>
  );
}
