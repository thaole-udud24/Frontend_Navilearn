import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AppShell } from '@/layouts/AppShell';
import { studentMenu } from '@/config/menu.student';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { changePassword, deleteMyAccount, getProfile, listSessions, revokeOtherSessions, revokeSession, updateProfile, uploadAvatar } from '@/services/account/account.profile.api';
import { WEEKDAYS, type Weekday } from '@/services/account/account.profile.types';

const DAY_LABEL: Record<Weekday, string> = { mon: 'Thứ 2', tue: 'Thứ 3', wed: 'Thứ 4', thu: 'Thứ 5', fri: 'Thứ 6', sat: 'Thứ 7', sun: 'Chủ nhật' };

export default function StudentAccountPage() {
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [fullName, setFullName] = useState('');
  const [learningGoal, setLearningGoal] = useState('');
  const [locale, setLocale] = useState<'vi' | 'en'>('vi');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [availability, setAvailability] = useState<Record<Weekday, number>>(() => Object.fromEntries(WEEKDAYS.map((day) => [day, 0])) as Record<Weekday, number>);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const profileQuery = useQuery({ queryKey: ['account', 'profile'], queryFn: getProfile });
  const sessionsQuery = useQuery({ queryKey: ['account', 'sessions'], queryFn: listSessions });
  const profile = profileQuery.data;

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName); setLearningGoal(profile.learningGoal); setLocale(profile.locale);
    setTimezone(profile.timezone); setAvailability(profile.availability);
  }, [profile]);

  const signOut = () => { logout(); navigate(PATHS.login); };
  const saveProfile = async () => {
    try { await updateProfile({ fullName, learningGoal, locale, timezone, availability }); await profileQuery.refetch(); toast.success('Đã cập nhật hồ sơ và thiết lập học tập'); }
    catch { toast.error('Không thể cập nhật hồ sơ'); }
  };

  return <AppShell menu={studentMenu} title="Cài đặt tài khoản" breadcrumb={['Trang chủ', 'Cài đặt']} userName={profile?.fullName ?? authUser?.fullName ?? 'Sinh viên'} roleLabel="Sinh viên">
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <section className="rounded-card border border-border bg-card p-5 shadow-card">
        <h2 className="mb-4 text-lg font-semibold">Hồ sơ và thiết lập học tập</h2>
        {profileQuery.isLoading ? <p className="text-sm text-muted-foreground">Đang tải hồ sơ…</p> : <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Họ tên<Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} /></label>
            <label className="text-sm">Email<Input className="mt-1" value={profile?.email ?? ''} disabled /></label>
            <label className="text-sm">Ngôn ngữ<select className="mt-1 h-10 w-full rounded-control border border-input bg-card px-3" value={locale} onChange={(e) => setLocale(e.target.value as 'vi' | 'en')}><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label>
            <label className="text-sm">Múi giờ<select className="mt-1 h-10 w-full rounded-control border border-input bg-card px-3" value={timezone} onChange={(e) => setTimezone(e.target.value)}><option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</option><option value="Asia/Bangkok">Asia/Bangkok</option><option value="UTC">UTC</option></select></label>
          </div>
          <label className="text-sm">Mục tiêu học tập<textarea className="mt-1 min-h-24 w-full rounded-control border border-input bg-card p-3" maxLength={500} value={learningGoal} onChange={(e) => setLearningGoal(e.target.value)} /></label>
          <div><p className="mb-2 text-sm font-medium">Thời gian học khả dụng (phút/ngày)</p><div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">{WEEKDAYS.map((day) => <label key={day} className="text-xs text-muted-foreground">{DAY_LABEL[day]}<Input className="mt-1" type="number" min={0} max={1440} value={availability[day]} onChange={(e) => setAvailability((old) => ({ ...old, [day]: Math.min(1440, Math.max(0, Number(e.target.value))) }))} /></label>)}</div></div>
          <div className="flex flex-wrap items-center gap-3"><Button onClick={() => void saveProfile()}>Lưu hồ sơ</Button><label className="cursor-pointer rounded-control border border-input px-3 py-2 text-sm">Đổi ảnh đại diện<input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { await uploadAvatar(file); await profileQuery.refetch(); toast.success('Đã cập nhật ảnh đại diện'); } catch { toast.error('Không thể tải ảnh đại diện'); } }} /></label></div>
        </div>}
      </section>
      <section className="rounded-card border border-border bg-card p-5 shadow-card"><h2 className="mb-4 text-lg font-semibold">Đổi mật khẩu</h2><div className="grid gap-3 sm:grid-cols-2"><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Mật khẩu hiện tại" /><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mật khẩu mới" /></div><Button className="mt-4" onClick={async () => { try { await changePassword({ currentPassword, newPassword }); setCurrentPassword(''); setNewPassword(''); toast.success('Đã đổi mật khẩu và đăng xuất các phiên khác'); } catch { toast.error('Không thể đổi mật khẩu'); } }}>Đổi mật khẩu</Button></section>
      <section className="rounded-card border border-border bg-card p-5 shadow-card"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Phiên đăng nhập</h2><Button variant="outline" onClick={async () => { await revokeOtherSessions(); sessionsQuery.refetch(); }}>Đăng xuất phiên khác</Button></div>{!sessionsQuery.data?.length && !sessionsQuery.isLoading && <p className="text-sm text-muted-foreground">Không có phiên đăng nhập nào.</p>}<div className="flex flex-col gap-2">{sessionsQuery.data?.map((session) => <div key={session.id} className="flex items-center justify-between rounded-control border border-border p-3 text-sm"><div><p className="font-medium">{session.userAgent || 'Thiết bị không xác định'} {session.current && '(hiện tại)'}</p><p className="text-muted-foreground">{session.ip}</p></div>{!session.current && <Button variant="outline" size="sm" onClick={async () => { await revokeSession(session.id); sessionsQuery.refetch(); }}>Thu hồi</Button>}</div>)}</div></section>
      <section className="rounded-card border border-danger/30 bg-card p-5"><h2 className="font-semibold text-danger">Xóa tài khoản vĩnh viễn</h2><p className="my-3 text-sm text-muted-foreground">Toàn bộ dữ liệu liên quan sẽ bị xóa và không thể khôi phục. Hãy xuất dữ liệu cần giữ trước khi tiếp tục.</p><Button variant="destructive" onClick={async () => { const password = window.prompt('Nhập lại mật khẩu để xác nhận xóa tài khoản'); if (!password || !window.confirm('Bạn chắc chắn muốn xóa vĩnh viễn tài khoản?')) return; await deleteMyAccount(password); signOut(); }}>Xóa tài khoản</Button></section>
    </div>
  </AppShell>;
}
