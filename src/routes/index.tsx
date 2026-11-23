import { createBrowserRouter } from 'react-router-dom';
import NotFound from '@/pages/exception/404';
import { StudentLayout } from '@/layouts/StudentLayout';
import { AdminAppShellLayout } from '@/layouts/AdminAppShellLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { GuestRoute } from '@/routes/GuestRoute';
import { RootRedirect } from '@/routes/RootRedirect';
import { PATHS } from '@/routes/paths';
import { ROLES } from '@/constants/enums';
import { exceptionRoutes, guestAuthRoutes } from '@/routes/authRoutes';
import { studentComingSoonRoutes, studentIndexRoute, studentLegacyRoutes } from '@/routes/studentRoutes';
import { adminIndexRoute, adminLegacyRoutes, adminNewRoutes } from '@/routes/adminRoutes';

// Every link in the app resolves through PATHS, never a raw string.
export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  {
    element: <AuthLayout />,
    children: [{ element: <GuestRoute />, children: guestAuthRoutes }, ...exceptionRoutes],
  },
  {
    element: <ProtectedRoute allow={[ROLES.STUDENT]} />,
    children: [
      {
        path: PATHS.student.root,
        children: [
          studentIndexRoute,
          ...studentComingSoonRoutes,
          { element: <StudentLayout />, children: studentLegacyRoutes },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allow={[ROLES.ADMIN]} />,
    children: [
      {
        path: PATHS.admin.root,
        children: [
          adminIndexRoute,
          ...adminNewRoutes,
          { element: <AdminAppShellLayout />, children: adminLegacyRoutes },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
