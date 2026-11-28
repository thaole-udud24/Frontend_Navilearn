import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Settings as SettingsIcon } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  listNotificationItems,
  markAllNotificationsRead,
  markNotificationRead,
  notificationItemKeys,
} from '@/services/notification';
import type { NotificationCategory, NotificationItem } from '@/services/notification/types';

type FilterKey = 'all' | 'unread' | NotificationCategory;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unread', label: 'Chưa đọc' },
  { key: 'hoc_tap', label: 'Học tập' },
  { key: 'he_thong', label: 'Hệ thống' },
];

function relativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

// N13: real page wired to the existing notification module's read endpoints — honestly empty until
// a real trigger fires (today: adaptive.service.replan, see adaptive.service.js). No fake content.
export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<FilterKey>('all');

  const filters = {
    limit: 100,
    ...(filter === 'unread' ? { read: false } : {}),
    ...(filter === 'hoc_tap' || filter === 'he_thong' ? { category: filter } : {}),
  };

  const { data, isLoading } = useQuery({
    queryKey: notificationItemKeys.list(filters),
    queryFn: () => listNotificationItems(filters),
  });
  const items = data?.data ?? [];

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationItemKeys.all }),
  });

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationItemKeys.all }),
  });

  const openItem = (item: NotificationItem) => {
    if (!item.read) readMutation.mutate(item._id);
    if (item.link) navigate(item.link);
  };

  return (
    <AppShell
      menu={studentMenu}
      title="Thông báo"
      breadcrumb={['Trang chủ', 'Thông báo']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-foreground">Thông báo</h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            <CheckCheck className="h-4 w-4" /> Đánh dấu đã đọc tất cả
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate(PATHS.student.settings)}>
            <SettingsIcon className="h-4 w-4" /> Cài đặt
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
              filter === f.key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-muted',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <ListSkeleton rows={4} />}
      {!isLoading && items.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có thông báo nào.</p>
      )}

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <button
            key={item._id}
            type="button"
            onClick={() => openItem(item)}
            className={cn(
              'flex items-start gap-3 rounded-card border p-4 text-left shadow-card transition-colors hover:bg-muted',
              item.read ? 'border-border bg-card' : 'border-primary/30 bg-primary-soft/40',
            )}
          >
            <Bell
              className={cn('mt-0.5 h-4 w-4 shrink-0', item.read ? 'text-muted-foreground' : 'text-primary')}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={cn('text-sm text-foreground', !item.read && 'font-bold')}>{item.title}</p>
                <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(item.createdAt)}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{item.content}</p>
            </div>
          </button>
        ))}
      </div>
    </AppShell>
  );
}
