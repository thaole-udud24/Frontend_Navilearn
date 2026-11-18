import { useState } from 'react';
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

export default function StudentAccountPage() {
  const navigate = useNavigate(); const authUser = useAuthStore((s) => s.user); const logout = useAuthStore((s) => s.logout);
  const [fullName, setFullName] = useState(''); const [learningGoal, setLearningGoal] = useState('');
  const [currentPassword, setCurrentPassword] = useState(''); const [newPassword, setNewPassword] = useState('');
  const profileQuery = useQuery({ queryKey: ['account', 'profile'], queryFn: getProfile });
  const sessionsQuery = useQuery({ queryKey: ['account', 'sessions'], queryFn: listSessions }); const profile = profileQuery.data;
  const signOut = () => { logout(); navigate(PATHS.login); };
  return <AppShell menu={studentMenu} title="Cài đặt tài khoản" breadcrumb={['Trang chủ', 'Cài đặt']} userName={profile?.fullName ?? authUser?.fullName ?? 'Sinh viên'} roleLabel="Sinh viên">
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <section className="rounded-card border border-border bg-card p-5 shadow-card"><h2 className="mb-4 text-lg font-semibold">Hồ sơ cá nhân</h2>
        <div className="grid gap-3 sm:grid-cols-2"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={profile?.fullName ?? 'Họ tên'} /><Input value={profile?.email ?? ''} disabled aria-label="Email" />
          <Input value={learningGoal} onChange={(e) => setLearningGoal(e.target.value)} placeholder={profile?.learningGoal || 'Mục tiêu học tập'} />
          <label className="flex items-center gap-2 text-sm">Ảnh đại diện <input type="file" accept="image/png,image/jpeg,image/webp" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; await uploadAvatar(file); toast.success('Đã cập nhật ảnh đại diện'); profileQuery.refetch(); }} /></label></div>
        <Button className="mt-4" onClick={async () => { await updateProfile({ fullName: fullName || profile?.fullName, learningGoal: learningGoal || profile?.learningGoal }); toast.success('Đã cập nhật hồ sơ'); setFullName(''); setLearningGoal(''); profileQuery.refetch(); }}>Lưu hồ sơ</Button></section>
      <section className="rounded-card border border-border bg-card p-5 shadow-card"><h2 className="mb-4 text-lg font-semibold">Đổi mật khẩu</h2><div className="grid gap-3 sm:grid-cols-2"><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Mật khẩu hiện tại" /><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mật khẩu mới" /></div>
        <Button className="mt-4" onClick={async () => { await changePassword({ currentPassword, newPassword }); setCurrentPassword(''); setNewPassword(''); toast.success('Đã đổi mật khẩu và đăng xuất các phiên khác'); }}>Đổi mật khẩu</Button></section>
      <section className="rounded-card border border-border bg-card p-5 shadow-card"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Phiên đăng nhập</h2><Button variant="outline" onClick={async () => { await revokeOtherSessions(); sessionsQuery.refetch(); }}>Đăng xuất phiên khác</Button></div>
        <div className="flex flex-col gap-2">{sessionsQuery.data?.map((session) => <div key={session.id} className="flex items-center justify-between rounded-control border border-border p-3 text-sm"><div><p className="font-medium">{session.userAgent || 'Thiết bị không xác định'} {session.current && '(hiện tại)'}</p><p className="text-muted-foreground">{session.ip}</p></div>{!session.current && <Button variant="outline" size="sm" onClick={async () => { await revokeSession(session.id); sessionsQuery.refetch(); }}>Thu hồi</Button>}</div>)}</div></section>
      <section className="rounded-card border border-danger/30 bg-card p-5"><h2 className="font-semibold text-danger">Xóa tài khoản vĩnh viễn</h2><p className="my-3 text-sm text-muted-foreground">Toàn bộ dữ liệu liên quan sẽ bị xóa và không thể khôi phục. Hãy xuất dữ liệu cần giữ trước khi tiếp tục.</p><Button variant="destructive" onClick={async () => { const password = window.prompt('Nhập lại mật khẩu để xác nhận xóa tài khoản'); if (!password || !window.confirm('Bạn chắc chắn muốn xóa vĩnh viễn tài khoản?')) return; await deleteMyAccount(password); signOut(); }}>Xóa tài khoản</Button></section>
    </div></AppShell>;
}
