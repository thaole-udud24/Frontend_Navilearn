import { AccountPageFrame } from '../components/AccountPageFrame';
import { PasswordSection } from '../components/PasswordSection';

/** FE-STU-76: đổi mật khẩu khi đã đăng nhập. */
export default function StudentChangePasswordPage() {
  return (
    <AccountPageFrame title="Đổi mật khẩu" description="Đặt mật khẩu mới cho tài khoản của bạn.">
      <PasswordSection />
    </AccountPageFrame>
  );
}
