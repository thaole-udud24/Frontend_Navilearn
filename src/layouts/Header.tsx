import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Bell, ChevronDown, Grid3x3, LogOut, Menu, Moon, Search, User } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  title: string;
  breadcrumb?: string[];
  userName: string;
  roleLabel: string;
  notificationCount?: number;
  onMobileMenuClick: () => void;
  /** Compact single-row topbar (hamburger + inline breadcrumb + search + bell + avatar) with
   * no colored heading band — used by pages whose own content already carries the greeting
   * (e.g. the student dashboard's HeroBanner). Default keeps the original banner-style header. */
  compact?: boolean;
  onToggleSidebar?: () => void;
  onLogout?: () => void;
}

const LANGUAGES = [
  { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
];

function AvatarMenu({ userName, roleLabel, onLogout, light }: { userName: string; roleLabel: string; onLogout?: () => void; light?: boolean }) {
  const initial = userName.trim().charAt(0).toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-1.5 rounded-control px-1.5 py-1 focus-visible:outline-none focus-visible:ring-2',
            light ? 'hover:bg-muted focus-visible:ring-ring' : 'hover:bg-white/10 focus-visible:ring-white',
          )}
        >
          <span
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold',
              light ? 'bg-gradient-to-br from-primary to-primary-hover text-primary-foreground' : 'bg-white/20',
            )}
          >
            {initial}
          </span>
          <span className="hidden text-left sm:block">
            <span className={cn('block text-sm font-semibold leading-tight', light ? 'text-foreground' : 'text-white')}>
              {userName}
            </span>
            {!light && <span className="block text-xs leading-tight text-white/80">{roleLabel}</span>}
          </span>
          <ChevronDown className={cn('h-4 w-4', light ? 'text-muted-foreground' : 'text-white/80')} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="tw-scope w-48" align="end">
        <DropdownMenuItem>
          <User className="h-4 w-4" /> Hồ sơ
        </DropdownMenuItem>
        <DropdownMenuItem>
          <User className="h-4 w-4" /> Đổi mật khẩu
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Moon className="h-4 w-4" /> Giao diện sáng/tối
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-danger" onSelect={onLogout}>
          <LogOut className="h-4 w-4" /> Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header({
  title,
  breadcrumb,
  userName,
  roleLabel,
  notificationCount = 0,
  onMobileMenuClick,
  compact,
  onToggleSidebar,
  onLogout,
}: HeaderProps) {
  const [lang, setLang] = useState(LANGUAGES[0]);
  const reduced = useReducedMotion();

  if (compact) {
    return (
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            aria-label="Thu gọn / mở rộng thanh điều hướng"
            onClick={onToggleSidebar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            type="button"
            aria-label="Mở menu"
            onClick={onMobileMenuClick}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-muted-foreground hover:bg-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 truncate text-sm md:flex">
            {breadcrumb?.map((crumb, i) => (
              <span key={crumb} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted-foreground">›</span>}
                <span className={i === (breadcrumb.length ?? 0) - 1 ? 'font-bold text-foreground' : 'text-muted-foreground'}>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>

          <div className="flex-1" />

          <label className="relative hidden w-full max-w-md md:block">
            <span className="sr-only">Tìm kiếm</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Tìm kiếm..."
              className="h-11 w-full rounded-control border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <div className="flex-1" />

          <motion.button
            type="button"
            aria-label="Thông báo"
            animate={notificationCount > 0 && !reduced ? { rotate: [0, -8, 8, -8, 0] } : undefined}
            transition={{ duration: 0.5, repeat: notificationCount > 0 ? Infinity : 0, repeatDelay: 3 }}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {notificationCount}
              </span>
            )}
          </motion.button>

          <AvatarMenu userName={userName} roleLabel={roleLabel} onLogout={onLogout} light />
        </div>
      </header>
    );
  }

  return (
    <header
      className="sticky top-0 z-30 text-primary-foreground"
      style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
    >
      <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          aria-label="Mở menu"
          onClick={onMobileMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-control hover:bg-white/10 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Thu gọn / mở rộng thanh điều hướng"
          onClick={onToggleSidebar}
          className="hidden h-10 w-10 items-center justify-center rounded-control hover:bg-white/10 lg:flex"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex-1" />

        <button
          type="button"
          aria-label="Ứng dụng"
          className="flex h-10 w-10 items-center justify-center rounded-control bg-white text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Grid3x3 className="h-5 w-5" />
        </button>

        <motion.button
          type="button"
          aria-label="Thông báo"
          animate={notificationCount > 0 && !reduced ? { rotate: [0, -8, 8, -8, 0] } : undefined}
          transition={{ duration: 0.5, repeat: notificationCount > 0 ? Infinity : 0, repeatDelay: 3 }}
          className="relative flex h-10 w-10 items-center justify-center rounded-control bg-white text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white">
              {notificationCount}
            </span>
          )}
        </motion.button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Chọn ngôn ngữ"
              className="flex h-10 items-center gap-1 rounded-control px-2 text-lg hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {lang.flag}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="tw-scope" align="end">
            {LANGUAGES.map((l) => (
              <DropdownMenuItem key={l.code} onSelect={() => setLang(l)}>
                <span className="mr-2">{l.flag}</span>
                {l.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <AvatarMenu userName={userName} roleLabel={roleLabel} onLogout={onLogout} />
      </div>

      <div className="px-4 pb-6 pt-1 sm:px-6">
        <div className="flex items-start gap-2">
          <span className={cn('mt-2 inline-block h-2 w-3 shrink-0 rounded-sm bg-danger')} />
          <div>
            <h1 className="text-[28px] font-bold leading-tight text-white">{title}</h1>
            {breadcrumb && breadcrumb.length > 0 && (
              <p className="text-sm text-white/70">{breadcrumb.join(' / ')}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
