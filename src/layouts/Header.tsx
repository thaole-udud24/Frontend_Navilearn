import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Bell, Grid3x3, LogOut, Menu, Moon, User } from 'lucide-react';

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
}

const LANGUAGES = [
  { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
];

export function Header({ title, breadcrumb, userName, roleLabel, notificationCount = 0, onMobileMenuClick }: HeaderProps) {
  const [lang, setLang] = useState(LANGUAGES[0]);
  const reduced = useReducedMotion();
  const initial = userName.trim().charAt(0).toUpperCase();

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-control px-2 py-1 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                {initial}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-semibold leading-tight">{userName}</span>
                <span className="block text-xs leading-tight text-white/80">{roleLabel}</span>
              </span>
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
            <DropdownMenuItem className="text-danger">
              <LogOut className="h-4 w-4" /> Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
