import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Check, Download, KeyRound, ShieldCheck, UserCog, Users } from 'lucide-react';

import { DataTablePage } from '@/components/DataTablePage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import {
  exportPermissionMatrix,
  getEffectivePermissions,
  getPermissionMatrix,
  listDeniedAccessLogs,
  listRbacRoles,
  listUsers,
} from '@/services/account';
import type { DeniedAccessLog, PermissionMatrixRow, RbacAccess } from '@/services/account/account.rbac.types';

const ACCESS_LABEL: Record<RbacAccess, string> = {
  none: 'Không được phép',
  view: 'Chỉ xem',
  manage: 'Quản lý',
  own: 'Dữ liệu cá nhân',
};

const ACCESS_STYLE: Record<RbacAccess, string> = {
  none: 'bg-slate-100 text-slate-500',
  view: 'bg-blue-50 text-blue-700',
  manage: 'bg-emerald-50 text-emerald-700',
  own: 'bg-violet-50 text-violet-700',
};

function AccessBadge({ value }: { value: RbacAccess }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', ACCESS_STYLE[value])}>
      {value !== 'none' && <Check className="mr-1 h-3.5 w-3.5" />}
      {ACCESS_LABEL[value]}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-card border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

export default function AdminRbacItemsPage() {
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'admin'>('all');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [logRole, setLogRole] = useState<'all' | 'student' | 'admin'>('all');

  const matrixFilters = useMemo(
    () => ({ role: roleFilter === 'all' ? undefined : roleFilter }),
    [roleFilter],
  );

  const rolesQuery = useQuery({ queryKey: ['rbac', 'roles'], queryFn: listRbacRoles });
  const matrixQuery = useQuery({
    queryKey: ['rbac', 'matrix', matrixFilters],
    queryFn: () => getPermissionMatrix(matrixFilters),
  });
  const usersQuery = useQuery({
    queryKey: ['rbac', 'users', userSearch],
    queryFn: () => listUsers({ page: 1, limit: 20, search: userSearch || undefined }),
  });
  const effectiveQuery = useQuery({
    queryKey: ['rbac', 'effective', selectedUserId],
    queryFn: () => getEffectivePermissions(selectedUserId),
    enabled: Boolean(selectedUserId),
  });

  const matrixColumns: ColumnDef<PermissionMatrixRow>[] = [
    {
      accessorKey: 'module',
      header: 'Module',
      size: 100,
      cell: ({ getValue }) => <span className="font-bold text-primary">{getValue<string>()}</span>,
    },
    { accessorKey: 'capability', header: 'Chức năng', size: 280 },
    {
      accessorKey: 'student',
      header: 'Sinh viên',
      size: 160,
      cell: ({ getValue }) => <AccessBadge value={getValue<RbacAccess>()} />,
    },
    {
      accessorKey: 'admin',
      header: 'Quản trị viên',
      size: 160,
      cell: ({ getValue }) => <AccessBadge value={getValue<RbacAccess>()} />,
    },
  ];

  const deniedColumns: ColumnDef<DeniedAccessLog>[] = [
    {
      id: 'user',
      header: 'Người dùng',
      size: 220,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">{row.original.user?.fullName ?? 'Tài khoản đã xóa'}</p>
          <p className="text-xs text-muted-foreground">{row.original.user?.email}</p>
        </div>
      ),
    },
    {
      id: 'request',
      header: 'Yêu cầu',
      size: 320,
      cell: ({ row }) => (
        <span>
          <span className="mr-2 rounded bg-danger/10 px-2 py-1 text-xs font-bold text-danger">
            {row.original.method}
          </span>
          <span className="text-sm">{row.original.path}</span>
        </span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Vai trò',
      size: 140,
      cell: ({ getValue }) => <StatusBadge variant="danger">{getValue<string>()}</StatusBadge>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Thời gian',
      size: 170,
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString('vi-VN'),
    },
  ];

  const totalUsers = rolesQuery.data?.reduce((sum, role) => sum + role.totalUsers, 0) ?? 0;
  const activeUsers = rolesQuery.data?.reduce((sum, role) => sum + role.activeUsers, 0) ?? 0;
  const hasError = rolesQuery.isError || matrixQuery.isError || usersQuery.isError;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Tài khoản &amp; phân quyền</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Vai trò và phân quyền</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
            Tra cứu quyền cố định của Sinh viên và Quản trị viên. Hệ thống không cho tạo vai trò hoặc chỉnh
            quyền.
          </p>
        </div>
        <Button onClick={() => exportPermissionMatrix(matrixFilters)} disabled={matrixQuery.isLoading}>
          <Download /> Xuất ma trận CSV
        </Button>
      </div>

      {hasError && (
        <div className="rounded-control border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Không thể tải một phần dữ liệu RBAC. Hãy kiểm tra Backend và thử lại.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Vai trò hệ thống',
            value: rolesQuery.data?.length ?? 0,
            icon: ShieldCheck,
            tone: 'bg-blue-50 text-blue-700',
          },
          { label: 'Tổng tài khoản', value: totalUsers, icon: Users, tone: 'bg-violet-50 text-violet-700' },
          {
            label: 'Tài khoản hoạt động',
            value: activeUsers,
            icon: UserCog,
            tone: 'bg-emerald-50 text-emerald-700',
          },
          {
            label: 'Nhóm quyền',
            value: matrixQuery.data?.length ?? 0,
            icon: KeyRound,
            tone: 'bg-orange-50 text-orange-700',
          },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-card border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-3">
              <span className={cn('flex h-10 w-10 items-center justify-center rounded-full', tone)}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            <p className="mt-4 text-3xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto p-1 sm:w-auto">
          <TabsTrigger value="roles">Vai trò</TabsTrigger>
          <TabsTrigger value="matrix">Ma trận quyền</TabsTrigger>
          <TabsTrigger value="effective">Quyền hiệu lực</TabsTrigger>
          <TabsTrigger value="denied">Truy cập bị từ chối</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <div className="grid gap-4 lg:grid-cols-2">
            {rolesQuery.data?.map((role) => (
              <article key={role.code} className="rounded-card border border-border bg-card p-6 shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <ShieldCheck />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">{role.name}</h2>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {role.code}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    Cố định
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{role.description}</p>
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tổng tài khoản</p>
                    <p className="mt-1 text-xl font-bold">{role.totalUsers}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Đang hoạt động</p>
                    <p className="mt-1 text-xl font-bold text-emerald-600">{role.activeUsers}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="matrix">
          <div className="mb-3 flex justify-end">
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="student">Sinh viên</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DataTablePage<PermissionMatrixRow>
            columns={matrixColumns}
            getRowId={(r) => `${r.module}-${r.capability}`}
            data={matrixQuery.data ?? []}
            searchPlaceholder="Tìm module hoặc chức năng…"
            emptyLabel="Không tìm thấy nhóm quyền phù hợp."
          />
        </TabsContent>

        <TabsContent value="effective">
          <section className="space-y-4 rounded-card border border-border bg-card p-4 shadow-card sm:p-6">
            <div>
              <h2 className="text-lg font-bold">Kiểm tra quyền của tài khoản</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tìm tài khoản và xem quyền thực tế được tính từ vai trò cùng trạng thái hoạt động.
              </p>
            </div>
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
              <Input
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Tìm theo email hoặc họ tên..."
              />
              <Select value={selectedUserId || undefined} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tài khoản" />
                </SelectTrigger>
                <SelectContent>
                  {usersQuery.data?.data.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.fullName} · {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {effectiveQuery.data ? (
              <div className="rounded-card border border-border">
                <div className="flex flex-col gap-2 border-b border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold">{effectiveQuery.data.user.fullName}</p>
                    <p className="text-sm text-muted-foreground">{effectiveQuery.data.user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <AccessBadge value={effectiveQuery.data.user.isActive ? 'view' : 'none'} />
                    <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                      {effectiveQuery.data.user.role}
                    </span>
                  </div>
                </div>
                {effectiveQuery.data.permissions.length ? (
                  <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                    {effectiveQuery.data.permissions.map((permission) => (
                      <div
                        key={`${permission.module}-${permission.capability}`}
                        className="rounded-control border border-border p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-sm text-primary">{permission.module}</strong>
                          <AccessBadge value={permission.access} />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{permission.capability}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4">
                    <EmptyState text="Tài khoản đang bị khóa nên không có quyền hiệu lực." />
                  </div>
                )}
              </div>
            ) : (
              <EmptyState text="Chọn một tài khoản để xem quyền hiệu lực." />
            )}
          </section>
        </TabsContent>

        <TabsContent value="denied">
          <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-bold">Nhật ký truy cập bị từ chối</h2>
              <p className="text-sm text-muted-foreground">
                Các yêu cầu đã đăng nhập nhưng không đúng vai trò.
              </p>
            </div>
            <Select value={logRole} onValueChange={(value) => setLogRole(value as typeof logRole)}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="student">Sinh viên</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DataTablePage<DeniedAccessLog>
            columns={deniedColumns}
            getRowId={(r) => r.id}
            emptyLabel="Chưa có truy cập nào bị từ chối."
            fetcher={async ({ page, pageSize }) => {
              const res = await listDeniedAccessLogs({
                page,
                limit: pageSize,
                role: logRole === 'all' ? undefined : logRole,
              });
              return { data: res.data, total: res.meta?.total ?? res.data.length };
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
