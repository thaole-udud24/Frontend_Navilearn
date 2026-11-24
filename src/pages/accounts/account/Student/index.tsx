import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/layouts/AppShell';
import { studentMenu } from '@/config/menu.student';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { Button } from '@/components/ui/button';
import {
  deleteMyAccount,
  listSessions,
  revokeOtherSessions,
  revokeSession,
} from '@/services/account/account.profile.api';
import { accountKeys } from '@/services/account/queryKeys';
import { PasswordSection } from '../components/PasswordSection';
import { ProfileSection } from '../components/ProfileSection';

const SECTION = 'rounded-card border border-border bg-card p-5 shadow-card';

/** Cài đặt tài khoản: hồ sơ, mật khẩu, phiên đăng nhập và xóa tài khoản trên một trang. */
export default function StudentAccountPage() {
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const sessionsQuery = useQuery({ queryKey: accountKeys.sessions, queryFn: listSessions });

  const signOut = () => {
    logout();
    navigate(PATHS.login);
  };

  return (
    <AppShell
      menu={studentMenu}
      title="Cài đặt tài khoản"
      breadcrumb={['Trang chủ', 'Cài đặt']}
      userName={authUser?.fullName ?? 'Sinh viên'}
      roleLabel="Sinh viên"
      onLogout={signOut}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <section className={SECTION}>
          <h2 className="mb-4 text-lg font-semibold">Hồ sơ và thiết lập học tập</h2>
          <ProfileSection variant="student" />
        </section>
        <section className={SECTION}>
          <h2 className="mb-4 text-lg font-semibold">Đổi mật khẩu</h2>
          <PasswordSection />
        </section>
        <section className={SECTION}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Phiên đăng nhập</h2>
            <Button
              variant="outline"
              onClick={async () => {
                await revokeOtherSessions();
                sessionsQuery.refetch();
              }}
            >
              Đăng xuất phiên khác
            </Button>
          </div>
          {!sessionsQuery.data?.length && !sessionsQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Không có phiên đăng nhập nào.</p>
          )}
          <div className="flex flex-col gap-2">
            {sessionsQuery.data?.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-control border border-border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {session.userAgent || 'Thiết bị không xác định'} {session.current && '(hiện tại)'}
                  </p>
                  <p className="text-muted-foreground">{session.ip}</p>
                </div>
                {!session.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await revokeSession(session.id);
                      sessionsQuery.refetch();
                    }}
                  >
                    Thu hồi
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-card border border-danger/30 bg-card p-5">
          <h2 className="font-semibold text-danger">Xóa tài khoản vĩnh viễn</h2>
          <p className="my-3 text-sm text-muted-foreground">
            Toàn bộ dữ liệu liên quan sẽ bị xóa và không thể khôi phục. Hãy xuất dữ liệu cần giữ trước khi
            tiếp tục.
          </p>
          <Button
            variant="destructive"
            onClick={async () => {
              const password = window.prompt('Nhập lại mật khẩu để xác nhận xóa tài khoản');
              if (!password || !window.confirm('Bạn chắc chắn muốn xóa vĩnh viễn tài khoản?')) return;
              await deleteMyAccount(password);
              signOut();
            }}
          >
            Xóa tài khoản
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
