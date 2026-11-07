import { createBrowserRouter } from 'react-router-dom';
import NotFound from '@/pages/exception/404';
import { StudentLayout } from '@/layouts/StudentLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { PATHS } from '@/routes/paths';
import { ROLES } from '@/constants/enums';
import { authRoutes } from '@/routes/authRoutes';
import { studentRoutes } from '@/routes/studentRoutes';
import { adminRoutes } from '@/routes/adminRoutes';

// Every link in the app resolves through PATHS, never a raw string.
export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: authRoutes,
  },
  {
    element: <ProtectedRoute allow={[ROLES.STUDENT]} />,
    children: [
      {
        path: PATHS.student.root,
        element: <StudentLayout />,
        children: studentRoutes,
      },
    ],
  },
  {
    element: <ProtectedRoute allow={[ROLES.ADMIN]} />,
    children: [
      {
        path: PATHS.admin.root,
        element: <AdminLayout />,
        children: adminRoutes,
      },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
