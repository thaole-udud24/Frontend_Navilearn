import { Outlet } from 'react-router-dom';

// Full-screen auth layout — no menu/header, just renders the active auth page.
export function AuthLayout() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Outlet />
    </div>
  );
}
