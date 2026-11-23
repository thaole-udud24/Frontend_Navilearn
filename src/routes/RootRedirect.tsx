import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { ROLES } from '@/constants/enums';

// `/` used to always force-redirect to `/login` regardless of auth state, so a logged-in session
// landing on the bare root got bounced through the login screen for no reason.
export function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  const target = user ? (user.role === ROLES.ADMIN ? PATHS.admin.root : PATHS.student.root) : PATHS.login;
  return <Navigate to={target} replace />;
}
