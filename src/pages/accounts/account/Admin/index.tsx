import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Download,
  FileClock,
  History,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Unlock,
  UserCheck,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/layouts/AppShell';
import { adminMenu } from '@/config/menu.admin';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormDialogFooter, FormDialogTitle, FormField } from '@/components/DialogForm';
import { DataTablePage } from '@/components/DataTablePage';
import type { RowAction } from '@/components/DataTablePage/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { fadeUp, pickVariants, staggerContainer } from '@/lib/motion';
import {
  createUser,
  exportUsers,
  listAuditLogs,
  listLoginLogs,
  listUsers,
  lockUser,
  removeUser,
  sendResetLink,
  unlockUser,
  updateUser,
} from '@/services/account/account.admin.api';
import type { AdminUser, AdminUserStatus } from '@/services/account/account.admin.types';
import type { Role } from '@/constants/enums';

type UserForm = { email: string; fullName: string; role: Role; password: string };
const EMPTY_FORM: UserForm = { email: '', fullName: '', role: 'student', password: '' };

function UserStatus({ user }: { user: AdminUser }) {
  if (!user.isActive) return <StatusBadge variant="danger">Đã khóa</StatusBadge>;
  if (!user.emailVerified) return <StatusBadge variant="warning">Chưa xác minh</StatusBadge>;
  return <StatusBadge variant="success">Hoạt động</StatusBadge>;
}

export default function AdminAccountPage() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const currentUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [role, setRole] = useState<Role | 'all'>('all');
  const [status, setStatus] = useState<AdminUserStatus | 'all'>('all');
  const [tableKey, setTableKey] = useState(0);
  const [items, setItems] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);
  const [logUser, setLogUser] = useState<AdminUser | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditAction, setAuditAction] = useState('');
  const [lockTarget, setLockTarget] = useState<AdminUser | null>(null);
  const [lockReason, setLockReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const loginLogs = useQuery({
    queryKey: ['admin-login-logs', logUser?.id],
    queryFn: () => listLoginLogs(logUser!.id),
    enabled: !!logUser,
  });
  const auditLogs = useQuery({
    queryKey: ['admin-audit-logs', auditAction],
    queryFn: () => listAuditLogs(1, auditAction),
    enabled: auditOpen,
  });
  const refresh = () => setTableKey((k) => k + 1);
  const variants = pickVariants(!!reduced, staggerContainer);
  const itemVariants = pickVariants(!!reduced, fadeUp);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };
  const openEdit = (item: AdminUser) => {
    setEditing(item);
    setForm({ email: item.email, fullName: item.fullName, role: item.role, password: '' });
    setFormOpen(true);
  };
  const saveUser = async () => {
    if (!form.fullName.trim() || !form.email.trim() || (!editing && !form.password)) {
      toast.error('Vui lòng nhập đủ thông tin bắt buộc');
      return;
    }
    try {
      if (editing)
        await updateUser(editing.id, { email: form.email, fullName: form.fullName, role: form.role });
      else await createUser(form);
      toast.success(editing ? 'Đã cập nhật tài khoản' : 'Đã tạo tài khoản');
      setFormOpen(false);
      refresh();
    } catch {
      toast.error('Không thể lưu tài khoản. Kiểm tra lại dữ liệu.');
    }
  };
  const signOut = () => {
    logout();
    navigate(PATHS.login);
  };

  const userRowActions: RowAction<AdminUser>[] = [
    { key: 'edit', label: 'Chỉnh sửa', icon: <Pencil />, onSelect: (r) => openEdit(r) },
    { key: 'logins', label: 'Lịch sử đăng nhập', icon: <History />, onSelect: (r) => setLogUser(r) },
    {
      key: 'reset-link',
      label: 'Gửi link đặt lại mật khẩu',
      icon: <KeyRound />,
      onSelect: async (r) => {
        await sendResetLink(r.id);
        toast.success('Đã gửi yêu cầu đặt lại mật khẩu');
      },
    },
    {
      key: 'lock',
      label: 'Khóa tài khoản',
      icon: <Lock />,
      danger: true,
      hidden: (r) => !r.isActive,
      onSelect: (r) => {
        setLockTarget(r);
        setLockReason('');
      },
    },
    {
      key: 'unlock',
      label: 'Mở khóa tài khoản',
      icon: <Unlock />,
      hidden: (r) => r.isActive,
      onSelect: async (r) => {
        await unlockUser(r.id);
        refresh();
        toast.success('Đã mở khóa tài khoản');
      },
    },
    {
      key: 'delete',
      label: 'Xóa tài khoản',
      icon: <Trash2 />,
      danger: true,
      onSelect: (r) => setDeleteTarget(r),
    },
  ];

  const columns: ColumnDef<AdminUser>[] = [
    {
      id: 'user',
      header: 'Người dùng',
      size: 260,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary">
            {row.original.fullName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{row.original.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Vai trò',
      size: 130,
      cell: ({ getValue }) => (getValue<Role>() === 'admin' ? 'Quản trị viên' : 'Sinh viên'),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      size: 150,
      cell: ({ row }) => (
        <div>
          <UserStatus user={row.original} />
          {row.original.lockReason && (
            <p
              className="mt-1 max-w-48 truncate text-xs text-muted-foreground"
              title={row.original.lockReason}
            >
              {row.original.lockReason}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Đăng nhập gần nhất',
      size: 190,
      cell: ({ getValue }) => {
        const v = getValue<string | null>();
        return v ? new Date(v).toLocaleString('vi-VN') : 'Chưa đăng nhập';
      },
    },
  ];

  return (
    <AppShell
      menu={adminMenu}
      title="Tài khoản"
      breadcrumb={['Trang chủ', 'Tài khoản & phân quyền', 'Tài khoản']}
      userName={currentUser?.fullName ?? 'Administrator'}
      roleLabel="Quản trị viên"
      notificationCount={5}
      compactHeader
      area="admin"
      onLogout={signOut}
    >
      <motion.div initial="hidden" animate="visible" variants={variants} className="flex flex-col gap-6">
        <motion.div
          variants={itemVariants}
          className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"
        >
          <div>
            <h1 className="text-xl font-bold text-foreground">Quản lý tài khoản</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tra cứu, kiểm soát trạng thái và bảo mật tài khoản NaviLearn.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() =>
                void exportUsers({
                  role: role === 'all' ? undefined : role,
                  status: status === 'all' ? undefined : status,
                })
              }
            >
              <Download />
              Xuất CSV
            </Button>
            <Button onClick={openCreate}>
              <Plus />
              Thêm tài khoản
            </Button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Users} label="Tổng tài khoản" value={total} tone="blue" />
          <StatCard
            icon={UserCheck}
            label="Hoạt động trên trang"
            value={items.filter((u) => u.isActive && u.emailVerified).length}
            tone="mint"
          />
          <StatCard
            icon={ShieldCheck}
            label="Quản trị viên trên trang"
            value={items.filter((u) => u.role === 'admin').length}
            tone="peach"
          />
          <StatCard
            icon={FileClock}
            label="Chưa xác minh / đã khóa"
            value={items.filter((u) => !u.emailVerified || !u.isActive).length}
            tone="blush"
          />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end"
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:flex">
            <Select value={role} onValueChange={(value) => setRole(value as Role | 'all')}>
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="student">Sinh viên</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(value) => setStatus(value as AdminUserStatus | 'all')}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="locked">Đã khóa</SelectItem>
                <SelectItem value="unverified">Chưa xác minh</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => setAuditOpen(true)}>
            <FileClock />
            Nhật ký quản trị
          </Button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <DataTablePage<AdminUser>
            key={`${tableKey}-${role}-${status}`}
            columns={columns}
            getRowId={(r) => r.id}
            rowActions={userRowActions}
            searchPlaceholder="Tìm theo email hoặc họ tên…"
            emptyLabel="Không có tài khoản phù hợp"
            onDataChange={(data, meta) => {
              setItems(data);
              setTotal(meta.total);
            }}
            fetcher={async ({ page, pageSize, search }) => {
              const res = await listUsers({
                page,
                limit: pageSize,
                search: search || undefined,
                role: role === 'all' ? undefined : role,
                status: status === 'all' ? undefined : status,
              });
              return { data: res.data, total: res.meta?.total ?? res.data.length };
            }}
          />
        </motion.div>
      </motion.div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <FormDialogTitle icon={editing ? Pencil : Plus}>
              {editing ? 'Chỉnh sửa Tài khoản' : 'Thêm mới Tài khoản'}
            </FormDialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <FormField label="Họ tên" required>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </FormField>
            <FormField label="Email" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@example.com"
              />
            </FormField>
            <FormField label="Vai trò" required>
              <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value as Role })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Sinh viên</SelectItem>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            {!editing && (
              <FormField label="Mật khẩu ban đầu" required>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Tối thiểu 8 ký tự"
                />
              </FormField>
            )}
          </div>
          <FormDialogFooter
            onCancel={() => setFormOpen(false)}
            submitLabel={editing ? 'Lưu lại' : 'Thêm mới'}
            onSubmit={() => void saveUser()}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!lockTarget} onOpenChange={(open) => !open && setLockTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Khóa tài khoản</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Nhập lý do khóa tài khoản <strong>{lockTarget?.email}</strong>. Các phiên hiện tại sẽ bị thu hồi.
          </p>
          <textarea
            className="min-h-24 rounded-control border border-input bg-card p-3 text-sm"
            value={lockReason}
            onChange={(e) => setLockReason(e.target.value)}
            placeholder="Lý do khóa…"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockTarget(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={!lockReason.trim()}
              onClick={async () => {
                if (!lockTarget) return;
                await lockUser(lockTarget.id, lockReason);
                setLockTarget(null);
                refresh();
                toast.success('Đã khóa tài khoản');
              }}
            >
              Xác nhận khóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa tài khoản vĩnh viễn?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tài khoản <strong>{deleteTarget?.email}</strong> và dữ liệu liên quan sẽ bị xóa, không thể khôi
            phục.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteTarget) return;
                await removeUser(deleteTarget.id);
                setDeleteTarget(null);
                refresh();
                toast.success('Đã xóa tài khoản');
              }}
            >
              Xóa vĩnh viễn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!logUser} onOpenChange={(open) => !open && setLogUser(null)}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Lịch sử đăng nhập — {logUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-auto rounded-control border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="p-3 text-left">Thời gian</th>
                  <th className="p-3 text-left">Kết quả</th>
                  <th className="p-3 text-left">IP</th>
                  <th className="p-3 text-left">Lý do</th>
                </tr>
              </thead>
              <tbody>
                {loginLogs.data?.data.map((log) => (
                  <tr key={log.id} className="border-t border-border">
                    <td className="p-3">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="p-3">
                      <StatusBadge variant={log.success ? 'success' : 'danger'}>
                        {log.success ? 'Thành công' : 'Thất bại'}
                      </StatusBadge>
                    </td>
                    <td className="p-3">{log.ip}</td>
                    <td className="p-3">{log.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loginLogs.isLoading && !loginLogs.data?.data.length && (
              <p className="p-6 text-center text-muted-foreground">Chưa có lịch sử đăng nhập.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>Nhật ký thao tác quản trị</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={auditAction}
              onChange={(e) => setAuditAction(e.target.value)}
              placeholder="Lọc theo hành động, ví dụ user.lock"
            />
          </div>
          <div className="max-h-96 overflow-auto rounded-control border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="p-3 text-left">Thời gian</th>
                  <th className="p-3 text-left">Người thực hiện</th>
                  <th className="p-3 text-left">Hành động</th>
                  <th className="p-3 text-left">Đối tượng</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.data?.data.map((log) => (
                  <tr key={log.id} className="border-t border-border">
                    <td className="p-3">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="p-3">{log.actor?.email ?? 'Tài khoản đã xóa'}</td>
                    <td className="p-3">
                      <StatusBadge variant="info">{log.action}</StatusBadge>
                    </td>
                    <td className="p-3">
                      {log.targetType} {log.targetId ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!auditLogs.isLoading && !auditLogs.data?.data.length && (
              <p className="p-6 text-center text-muted-foreground">Chưa có nhật ký phù hợp.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
