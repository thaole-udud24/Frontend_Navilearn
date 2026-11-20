import { useEffect, useState } from 'react';
import { ConfigProvider } from 'antd';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from '@/services/queryClient';
import { router } from '@/routes';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { useAuthStore } from '@/hooks/useAuth';
import { me } from '@/services/account/account.auth.api';
import { STORAGE_KEYS } from '@/constants/storageKeys';

// Entry composition only — attaches providers, no business logic.
export function App() {
  const setUser = useAuthStore((state) => state.setUser);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;
    const hasSession = Boolean(
      localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
    );

    if (!hasSession) {
      setAuthReady(true);
      return () => { active = false; };
    }

    me()
      .then((user) => { if (active) setUser(user); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setAuthReady(true); });

    return () => { active = false; };
  }, [setUser]);

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Đang khôi phục phiên đăng nhập…</div>;
  }

  return (
    <ErrorBoundary>
      <ConfigProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster position="top-right" />
        </QueryClientProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
}
