import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AppShell } from '@/layouts/AppShell'; import { adminMenu } from '@/config/menu.admin'; import { useAuthStore } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input';
import { exportUsers, listUsers, lockUser, removeUser, sendResetLink, unlockUser } from '@/services/account/account.admin.api';

export default function AdminAccountPage() {
  const user = useAuthStore((s) => s.user); const [search, setSearch] = useState('');
  const users = useQuery({ queryKey: ['admin-users', search], queryFn: () => listUsers({ page: 1, limit: 50, search: search || undefined }) }); const refresh = () => void users.refetch();
  return <AppShell menu={adminMenu} title="Quản lý tài khoản" breadcrumb={['Quản trị', 'Tài khoản']} userName={user?.fullName ?? 'Administrator'} roleLabel="Quản trị viên"><div className="flex flex-col gap-4">
    <div className="flex flex-wrap gap-2"><Input className="max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo email hoặc họ tên" /><Button variant="outline" onClick={() => void exportUsers({ search: search || undefined })}>Xuất CSV</Button></div>
    <div className="overflow-x-auto rounded-card border border-border bg-card shadow-card"><table className="w-full text-left text-sm"><thead className="border-b border-border bg-muted/50"><tr><th className="p-3">Người dùng</th><th className="p-3">Vai trò</th><th className="p-3">Trạng thái</th><th className="p-3">Thao tác</th></tr></thead><tbody>{users.data?.data.map((item) => <tr key={item.id} className="border-b border-border last:border-0"><td className="p-3"><p className="font-medium">{item.fullName}</p><p className="text-muted-foreground">{item.email}</p></td><td className="p-3">{item.role}</td><td className="p-3">{!item.isActive ? 'Đã khóa' : !item.emailVerified ? 'Chưa xác minh' : 'Hoạt động'}</td><td className="p-3"><div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={async () => { await sendResetLink(item.id); toast.success('Đã gửi yêu cầu đặt lại mật khẩu'); }}>Đặt lại mật khẩu</Button><Button size="sm" variant="outline" onClick={async () => { if (item.isActive) { const reason = window.prompt('Nhập lý do khóa tài khoản'); if (!reason) return; await lockUser(item.id, reason); } else await unlockUser(item.id); refresh(); }}>{item.isActive ? 'Khóa' : 'Mở khóa'}</Button><Button size="sm" variant="destructive" onClick={async () => { if (!window.confirm('Xóa vĩnh viễn tài khoản này?')) return; await removeUser(item.id); refresh(); }}>Xóa</Button>
    </div></td></tr>)}</tbody></table>{!users.isLoading && !users.data?.data.length && <p className="p-6 text-center text-muted-foreground">Không có tài khoản phù hợp</p>}</div>
  </div></AppShell>;
}
