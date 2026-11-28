import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  ChevronDown,
  Flame,
  Globe,
  Grid3x3,
  KeyRound,
  LogOut,
  Menu,
  Moon,
  Search,
  Trophy,
  User,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { assetUrl } from '@/utils/assetUrl';
import { accountKeys, getBadges, getStreak } from '@/services/account';
import {
  listNotificationItems,
  markAllNotificationsRead,
  markNotificationRead,
  notificationItemKeys,
} from '@/services/notification';
import type { NotificationItem } from '@/services/notification/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  { code: 'vi', short: 'VI', label: 'Tiếng Việt' },
  { code: 'en', short: 'EN', label: 'English' },
];

function NotificationBell({ compact, notificationCountOverride }: { compact?: boolean; notificationCountOverride?: number }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reduced = useReducedMotion();
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);

  const { data: listRes, isLoading } = useQuery({
    queryKey: notificationItemKeys.list({ limit: 8 }),
    queryFn: () => listNotificationItems({ limit: 8 }),
    enabled: !!user,
    staleTime: 30_000,
  });

  const { data: unreadRes } = useQuery({
    queryKey: notificationItemKeys.list({ read: false, limit: 1 }),
    queryFn: () => listNotificationItems({ read: false, limit: 1 }),
    enabled: !!user,
    staleTime: 30_000,
  });

  const items = listRes?.data ?? [];
  const unreadCount =
    notificationCountOverride && notificationCountOverride > 0
      ? notificationCountOverride
      : (unreadRes?.meta?.total ?? items.filter((n) => !n.read).length);

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: notificationItemKeys.all }),
  });

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: notificationItemKeys.all }),
  });

  const handleOpenItem = (item: NotificationItem) => {
    if (!item.read) readMutation.mutate(item._id);
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  const notificationsPath = user?.role === 'admin' ? PATHS.admin.notificationItems : PATHS.student.notifications;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <motion.button
          type="button"
          aria-label="Thông báo"
          data-testid="header-notification-bell"
          animate={unreadCount > 0 && !reduced ? { rotate: [0, -8, 8, -8, 0] } : undefined}
          transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3 }}
          className={cn(
            'relative flex h-10 w-10 shrink-0 items-center justify-center bg-card text-foreground focus-visible:outline-none focus-visible:ring-2',
            compact
              ? 'rounded-full border border-border shadow-card focus-visible:ring-ring'
              : 'rounded-control bg-white focus-visible:ring-white',
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              data-testid="header-notification-badge"
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </motion.button>
      </PopoverTrigger>
      <PopoverContent align="end" className="tw-scope w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-bold text-foreground">Thông báo</span>
          {unreadCount > 0 && (
            <button
              type="button"
              disabled={markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Đánh dấu đã đọc tất cả
            </button>
          )}
        </div>
        <div className="max-h-80 divide-y divide-border overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Đang tải thông báo…</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Chưa có thông báo nào.</div>
          ) : (
            items.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => handleOpenItem(item)}
                className={cn(
                  'flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/60',
                  !item.read && 'bg-primary/5',
                )}
              >
                <span
                  className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    item.read ? 'bg-transparent' : 'bg-primary',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className={cn('line-clamp-1 text-xs text-foreground', !item.read ? 'font-bold' : 'font-medium')}>
                    {item.title}
                  </p>
                  {item.content && <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{item.content}</p>}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
        <div className="border-t border-border p-2 text-center">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate(notificationsPath);
            }}
            className="w-full rounded-control py-1.5 text-xs font-semibold text-primary hover:bg-muted"
          >
            Xem tất cả thông báo
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AvatarMenu({
  userName,
  roleLabel,
  onLogout,
  light,
}: {
  userName: string;
  roleLabel: string;
  onLogout?: () => void;
  light?: boolean;
}) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const initial = userName.trim().charAt(0).toUpperCase();
  const avatar = assetUrl(user?.avatarUrl);
  const isAdmin = user?.role === 'admin';
  const profilePath = isAdmin ? PATHS.admin.profile : PATHS.student.profile;
  const passwordPath = isAdmin ? PATHS.admin.changePassword : PATHS.student.changePassword;
  // Pages may pass their own handler; otherwise the menu signs out by itself so it works everywhere.
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    logout();
    navigate(PATHS.login);
  };
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
              'flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-sm font-bold',
              light
                ? 'bg-gradient-to-br from-primary to-primary-hover text-primary-foreground'
                : 'bg-white/20',
            )}
          >
            {avatar ? (
              <img src={avatar} alt={userName} className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </span>
          <span className="hidden text-left sm:block">
            <span
              className={cn(
                'block text-sm font-semibold leading-tight',
                light ? 'text-foreground' : 'text-white',
              )}
            >
              {userName}
            </span>
            {!light && <span className="block text-xs leading-tight text-white/80">{roleLabel}</span>}
          </span>
          <ChevronDown className={cn('h-4 w-4', light ? 'text-muted-foreground' : 'text-white/80')} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="tw-scope w-48" align="end">
        <DropdownMenuItem onSelect={() => navigate(profilePath)}>
          <User className="h-4 w-4" /> Hồ sơ
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate(passwordPath)}>
          <KeyRound className="h-4 w-4" /> Đổi mật khẩu
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Moon className="h-4 w-4" /> Giao diện sáng/tối
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-danger" onSelect={handleLogout}>
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
  const [badgesOpen, setBadgesOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role === 'student';

  const { data: streak } = useQuery({
    queryKey: accountKeys.streak,
    queryFn: getStreak,
    enabled: isStudent,
    staleTime: 60_000,
  });

  const { data: badgesData } = useQuery({
    queryKey: accountKeys.badges,
    queryFn: getBadges,
    enabled: isStudent && badgesOpen,
  });

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

          {isStudent && (
            <>
              <button
                type="button"
                onClick={() => setBadgesOpen(true)}
                title={`Chuỗi ngày học: ${streak?.current ?? 0} ngày · Kỷ lục: ${streak?.longest ?? 0} ngày`}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-90',
                  streak?.activeToday
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-border bg-muted/40 text-muted-foreground',
                )}
              >
                <Flame className={cn('h-3.5 w-3.5', streak?.activeToday ? 'fill-amber-500 text-amber-500' : '')} />
                <span>{streak?.current ?? 0} ngày</span>
              </button>
              <Dialog open={badgesOpen} onOpenChange={setBadgesOpen}>
                <DialogContent className="tw-scope max-w-md">
                  <DialogHeader>
                    <DialogTitle>Chuỗi ngày học & Tủ huy hiệu</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-center">
                        <p className="flex items-center justify-center gap-1.5 text-2xl font-bold text-amber-700">
                          <Flame className="h-6 w-6 fill-amber-500 text-amber-500" />
                          <span>{streak?.current ?? 0}</span>
                        </p>
                        <p className="text-xs text-amber-800">Chuỗi hiện tại (ngày)</p>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
                        <p className="text-2xl font-bold text-foreground">{streak?.longest ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Kỷ lục dài nhất (ngày)</p>
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">
                        Huy hiệu mốc chuỗi
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(badgesData?.catalog ?? []).map((b) => {
                          const earned = (badgesData?.earned ?? []).find((e) => e.code === b.code);
                          return (
                            <div
                              key={b.code}
                              className={cn(
                                'flex items-center gap-2 rounded-xl border p-2.5 text-xs',
                                earned
                                  ? 'border-amber-300 bg-amber-50/60 text-foreground'
                                  : 'border-border bg-muted/20 text-muted-foreground opacity-65',
                              )}
                            >
                              <Trophy
                                className={cn(
                                  'h-4 w-4 shrink-0',
                                  earned ? 'text-amber-500' : 'text-muted-foreground',
                                )}
                              />
                              <div className="min-w-0">
                                <p className="truncate font-semibold">{b.name}</p>
                                <p className="text-[11px]">Mốc {b.thresholdDays} ngày</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}

          <NotificationBell compact notificationCountOverride={notificationCount} />

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

        <NotificationBell notificationCountOverride={notificationCount} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Chọn ngôn ngữ"
              className="flex h-10 items-center gap-1.5 rounded-control px-2.5 text-xs font-semibold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Globe className="h-4 w-4" />
              <span>{lang.short}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="tw-scope" align="end">
            {LANGUAGES.map((l) => (
              <DropdownMenuItem key={l.code} onSelect={() => setLang(l)}>
                <span className="mr-2 font-mono text-xs font-semibold text-muted-foreground">{l.short}</span>
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
