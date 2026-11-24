import { Outlet, useNavigate } from 'react-router-dom';

import { studentMenu } from '@/config/menu.student';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { AppShell } from './AppShell';

/** Wraps student pages that only supply their content: sidebar, header and sign-out come from here. */
export function StudentAppShellLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <AppShell
      menu={studentMenu}
      title="NaviLearn"
      userName={user?.fullName ?? 'Sinh viên'}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <Outlet />
    </AppShell>
  );
}
