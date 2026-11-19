import { Outlet, useNavigate } from 'react-router-dom';

import { adminMenu } from '@/config/menu.admin';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { AppShell } from './AppShell';

/** Keeps scaffold/legacy admin pages inside the same modern shell as the Admin dashboard. */
export function AdminAppShellLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <AppShell
      menu={adminMenu}
      title="Quản trị hệ thống"
      breadcrumb={['Trang chủ', 'Quản trị hệ thống']}
      userName={user?.fullName ?? 'Administrator'}
      roleLabel="Quản trị viên"
      notificationCount={5}
      compactHeader
      area="admin"
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <Outlet />
    </AppShell>
  );
}
