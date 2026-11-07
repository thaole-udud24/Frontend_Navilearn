import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import type { Role } from '@/constants/enums';

interface ProtectedRouteProps {
  allow: Role[];
}

export function ProtectedRoute({ allow }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to={PATHS.login} replace />;
  if (!allow.includes(user.role)) return <Navigate to={PATHS.forbidden} replace />;
  return <Outlet />;
}
