import { createElement } from 'react';
import { PATHS } from '@/routes/paths';
import AuthPage from '@/pages/auth/AuthPage';
import Forbidden from '@/pages/exception/403';
import NotFound from '@/pages/exception/404';

// Guarded by GuestRoute: an already-logged-in session must never land back here with no way out.
export const guestAuthRoutes = [{ path: PATHS.login, element: createElement(AuthPage) }];

// Not guest-only: a logged-in user can legitimately land on 403 (wrong role) or 404.
export const exceptionRoutes = [
  { path: PATHS.forbidden, element: createElement(Forbidden) },
  { path: PATHS.notFound, element: createElement(NotFound) },
];
