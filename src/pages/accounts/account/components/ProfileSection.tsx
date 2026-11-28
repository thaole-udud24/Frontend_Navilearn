import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/hooks/useAuth';
import { getProfile, updateProfile, uploadAvatar } from '@/services/account/account.profile.api';
import { accountKeys } from '@/services/account/queryKeys';
import { toApiError } from '@/services/apiError';
import { WEEKDAYS, type Profile, type Weekday } from '@/services/account/account.profile.types';
import { assetUrl } from '@/utils/assetUrl';

const DAY_LABEL: Record<Weekday, string> = {
  mon: 'Thứ 2',
  tue: 'Thứ 3',
  wed: 'Thứ 4',
  thu: 'Thứ 5',
  fri: 'Thứ 6',
  sat: 'Thứ 7',
  sun: 'Chủ nhật',
};

const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const FIELD_CLASS = 'mt-1 h-10 w-full rounded-control border border-input bg-card px-3 text-sm';

interface ProfileSectionProps {
  /** Admins have no study goals or availability (BR-56 applies to students). */
  variant: 'student' | 'admin';
}

/** FE-STU-73/74/75 and FE-ADM-85: view and edit the signed-in user's profile and avatar. */
export function ProfileSection({ variant }: ProfileSectionProps) {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const fileInput = useRef<HTMLInputElement>(null);
  const isStudent = variant === 'student';

  const [fullName, setFullName] = useState('');
  const [learningGoal, setLearningGoal] = useState('');
  const [locale, setLocale] = useState<'vi' | 'en'>('vi');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [availability, setAvailability] = useState<Record<Weekday, number>>(
    () => Object.fromEntries(WEEKDAYS.map((day) => [day, 0])) as Record<Weekday, number>,
  );

  const profileQuery = useQuery({ queryKey: accountKeys.profile, queryFn: getProfile });
  const profile = profileQuery.data;

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName);
    setLearningGoal(profile.learningGoal);
    setLocale(profile.locale);
    setTimezone(profile.timezone);
    setAvailability(profile.availability);
    const current = useAuthStore.getState().user;
    if (current && (current.avatarUrl !== profile.avatarUrl || current.fullName !== profile.fullName)) {
      setUser({ ...current, fullName: profile.fullName, avatarUrl: profile.avatarUrl });
    }
  }, [profile, setUser]);

  // Keep the header & sidebar (name + avatar) in step with what was just saved or loaded.
  const syncAuthUser = (next: Profile) => {
    queryClient.setQueryData(accountKeys.profile, next);
    const current = useAuthStore.getState().user;
    if (current) {
      setUser({ ...current, fullName: next.fullName, avatarUrl: next.avatarUrl });
    } else {
      setUser({
        id: next.id,
        email: next.email,
        fullName: next.fullName,
        role: variant,
        avatarUrl: next.avatarUrl,
      });
    }
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      updateProfile(
        isStudent
          ? { fullName, learningGoal, locale, timezone, availability }
          : { fullName, locale, timezone },
      ),
    onSuccess: (next) => {
      syncAuthUser(next);
      toast.success('Đã cập nhật hồ sơ');
    },
    onError: (error) => toast.error(toApiError(error).message),
  });

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (next) => {
      syncAuthUser(next);
      toast.success('Đã cập nhật ảnh đại diện');
    },
    onError: (error) => toast.error(toApiError(error).message),
  });

  const pickAvatar = (file: File | undefined) => {
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) return void toast.error('Ảnh đại diện chỉ nhận png, jpg, webp');
    if (file.size > AVATAR_MAX_BYTES) return void toast.error('Ảnh tối đa 2 MB');
    avatarMutation.mutate(file);
  };

  if (profileQuery.isLoading) return <p className="text-sm text-muted-foreground">Đang tải hồ sơ…</p>;
  if (profileQuery.isError || !profile) {
    return (
      <div className="flex items-center gap-3 text-sm text-danger">
        Không tải được hồ sơ.
        <Button variant="outline" size="sm" onClick={() => void profileQuery.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  const avatar = assetUrl(profile.avatarUrl);
  const canSave = fullName.trim().length > 0 && !saveMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Đổi ảnh đại diện"
          onClick={() => fileInput.current?.click()}
          disabled={avatarMutation.isPending}
          className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary-hover text-2xl font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {avatar ? (
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            profile.fullName.trim().charAt(0).toUpperCase()
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {avatarMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          </span>
        </button>
        <input
          ref={fileInput}
          className="hidden"
          type="file"
          accept={AVATAR_TYPES.join(',')}
          onChange={(e) => {
            pickAvatar(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">{profile.fullName}</p>
          <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">PNG, JPG hoặc WebP, tối đa 2 MB</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Họ tên
          <Input className="mt-1" value={fullName} maxLength={100} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label className="text-sm">
          Email
          <Input className="mt-1" value={profile.email} disabled />
        </label>
        <label className="text-sm">
          Ngôn ngữ
          <select className={FIELD_CLASS} value={locale} onChange={(e) => setLocale(e.target.value as 'vi' | 'en')}>
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className="text-sm">
          Múi giờ
          <select className={FIELD_CLASS} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</option>
            <option value="Asia/Bangkok">Asia/Bangkok</option>
            <option value="UTC">UTC</option>
          </select>
        </label>
      </div>

      {isStudent && (
        <>
          <label className="text-sm">
            Mục tiêu học tập
            <textarea
              className="mt-1 min-h-24 w-full rounded-control border border-input bg-card p-3 text-sm"
              maxLength={500}
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
            />
          </label>
          <div>
            <p className="mb-2 text-sm font-medium">Thời gian học khả dụng (phút/ngày)</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {WEEKDAYS.map((day) => (
                <label key={day} className="text-xs text-muted-foreground">
                  {DAY_LABEL[day]}
                  <Input
                    className="mt-1"
                    type="number"
                    min={0}
                    max={1440}
                    value={availability[day]}
                    onChange={(e) =>
                      setAvailability((old) => ({
                        ...old,
                        [day]: Math.min(1440, Math.max(0, Math.round(Number(e.target.value)) || 0)),
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <div>
        <Button disabled={!canSave} onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending && <Loader2 className="animate-spin" />}
          Lưu hồ sơ
        </Button>
      </div>
    </div>
  );
}
