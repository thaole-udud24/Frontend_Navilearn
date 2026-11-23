import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { ROLES } from '@/constants/enums';

// Inverse of ProtectedRoute: a session that's already logged in (restored on boot via `me()` in
// app.tsx, or still live from this tab) must never be stuck looking at the login screen with no
// way out except logging in again — bounce it to its dashboard instead.
export function GuestRoute() {
  const user = useAuthStore((s) => s.user);

  if (user)
    return <Navigate to={user.role === ROLES.ADMIN ? PATHS.admin.root : PATHS.student.root} replace />;
  return <Outlet />;
}
