import { createElement } from 'react';
import { PATHS } from '@/routes/paths';
import AuthPage from '@/pages/auth/AuthPage';
import Forbidden from '@/pages/exception/403';
import NotFound from '@/pages/exception/404';

export const authRoutes = [
  { path: PATHS.login, element: createElement(AuthPage) },
  { path: PATHS.forbidden, element: createElement(Forbidden) },
  { path: PATHS.notFound, element: createElement(NotFound) },
];
