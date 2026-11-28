import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getProfile, updateProfile } from '@/services/account/account.profile.api';
import { accountKeys } from '@/services/account/queryKeys';
import { toApiError } from '@/services/apiError';

// Same weekday-index convention as PlanningGoal.restDays (0 = Sunday .. 6 = Saturday, Date#getDay()).
const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** N14 "Nhắc học": giờ nhắc + ngày nghỉ mặc định — real student-level DEFAULTS (User.notificationHour/
 * defaultRestDays), stored for a future goal-wizard default-prefill; this screen only stores the
 * preference, it does not send any reminder itself (out of scope). */
export function StudyReminderSection() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: accountKeys.profile, queryFn: getProfile });
  const profile = profileQuery.data;

  const [notificationHour, setNotificationHour] = useState(20);
  const [restDays, setRestDays] = useState<number[]>([]);

  useEffect(() => {
    if (!profile) return;
    setNotificationHour(profile.notificationHour);
    setRestDays(profile.defaultRestDays);
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () => updateProfile({ notificationHour, defaultRestDays: restDays }),
    onSuccess: (next) => {
      queryClient.setQueryData(accountKeys.profile, next);
      toast.success('Đã lưu thiết lập nhắc học');
    },
    onError: (error) => toast.error(toApiError(error).message),
  });

  const toggleRestDay = (d: number) =>
    setRestDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  if (profileQuery.isLoading) return <p className="text-sm text-muted-foreground">Đang tải…</p>;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">Nhắc học</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Giờ nhắc và ngày nghỉ mặc định — dùng làm gợi ý ban đầu khi bạn tạo mục tiêu ôn thi mới. Đây chỉ là
          tùy chọn lưu lại, hệ thống chưa gửi thông báo nhắc học tự động.
        </p>
      </div>

      <label className="text-sm">
        Giờ nhắc mỗi ngày
        <Input
          className="mt-1 w-32"
          type="number"
          min={0}
          max={23}
          value={notificationHour}
          onChange={(e) => setNotificationHour(Math.min(23, Math.max(0, Math.round(Number(e.target.value)) || 0)))}
        />
        <span className="ml-2 text-xs text-muted-foreground">giờ (0-23)</span>
      </label>

      <div>
        <p className="mb-1.5 text-sm font-medium">Ngày nghỉ mặc định</p>
        <div className="flex gap-1.5">
          {WEEKDAY_LABELS.map((label, d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleRestDay(d)}
              className={`h-8 w-9 rounded-control border text-xs font-medium transition-colors ${
                restDays.includes(d)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending && <Loader2 className="animate-spin" />}
          Lưu thiết lập
        </Button>
      </div>
    </div>
  );
}
