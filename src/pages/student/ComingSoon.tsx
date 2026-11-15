import { useNavigate } from 'react-router-dom';
import { Construction } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';

interface ComingSoonProps {
  label: string;
}

const mockUser = { name: 'Minh Anh' };

/** Placeholder for sidebar items whose real feature isn't built yet, so a click never shows a
 * blank page — swap for the real page under the same route once it ships. */
export default function StudentComingSoon({ label }: ComingSoonProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  return (
    <AppShell
      menu={studentMenu}
      title={label}
      breadcrumb={['Trang chủ', label]}
      userName={mockUser.name}
      roleLabel="Sinh viên năm 2"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Construction className="h-8 w-8" />
        </span>
        <h2 className="text-lg font-bold text-foreground">{label}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Tính năng này đang được phát triển và sẽ sớm ra mắt. Cảm ơn bạn đã kiên nhẫn chờ đợi!
        </p>
      </div>
    </AppShell>
  );
}
