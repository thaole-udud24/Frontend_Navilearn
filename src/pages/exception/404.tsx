import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PATHS } from '@/routes/paths';

export default function NotFound() {
  return (
    <div className="tw-scope flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
        <SearchX className="h-8 w-8" />
      </span>
      <h1 className="text-3xl font-bold text-foreground">404</h1>
      <p className="max-w-sm text-sm text-muted-foreground">Trang bạn tìm không tồn tại.</p>
      <Button asChild>
        <Link to={PATHS.login}>Về trang đăng nhập</Link>
      </Button>
    </div>
  );
}
