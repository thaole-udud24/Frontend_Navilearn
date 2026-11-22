import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTablePage, ClampLine } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import {
  listBusinessRules,
  updateBusinessRule,
  resetBusinessRule,
  getBusinessRuleHistory,
} from '@/services/business-rule';
import type { BusinessRule, RuleCategory, RuleHistoryEntry } from '@/services/business-rule/types';

const CATEGORY_LABEL: Record<RuleCategory, string> = {
  AI: 'Trợ lý AI (BR-15)',
  RISK: 'Cảnh báo rủi ro (BR-17)',
  REVISION: 'Chu kỳ ôn tập (BR-16)',
  MASTERY: 'Năng lực & Trọng số (BR-05, BR-12)',
  GENERAL: 'Chung',
};

const formatValue = (v: unknown) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v));

function EditRuleDialog({ rule, onClose, onSaved }: { rule: BusinessRule | null; onClose: () => void; onSaved: () => void }) {
  const [valueStr, setValueStr] = useState('');
  const [reason, setReason] = useState('');

  const load = (r: BusinessRule | null) => {
    setValueStr(r ? formatValue(r.value) : '');
    setReason('');
  };

  const submit = async () => {
    if (!rule) return;
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do thay đổi quy tắc');
      return;
    }
    let parsedValue: unknown = valueStr;
    try {
      if (valueStr.startsWith('{') || valueStr.startsWith('[')) parsedValue = JSON.parse(valueStr);
      else if (valueStr.trim() !== '' && !Number.isNaN(Number(valueStr))) parsedValue = Number(valueStr);
    } catch {
      toast.error('Giá trị nhập vào không đúng định dạng JSON/Số');
      return;
    }
    try {
      await updateBusinessRule(rule._id, { value: parsedValue, reason: reason.trim() });
      toast.success(`Đã cập nhật quy tắc ${rule.ruleCode}`);
      onSaved();
      onClose();
    } catch {
      toast.error('Cập nhật quy tắc thất bại');
    }
  };

  return (
    <Dialog open={!!rule} onOpenChange={(v) => { if (v) load(rule); if (!v) onClose(); }}>
      <DialogContent className="tw-scope max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa: {rule?.ruleCode}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Tên quy tắc</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">{rule?.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Giá trị áp dụng mới {rule?.unit ? `(${rule.unit})` : ''}
            </p>
            <Input value={valueStr} onChange={(e) => setValueStr(e.target.value)} placeholder="Số, chuỗi hoặc JSON…" className="mt-1 font-mono" />
            <p className="mt-1 text-xs text-muted-foreground">
              Giá trị mặc định ban đầu: <span className="font-mono">{rule ? formatValue(rule.defaultValue) : ''}</span>
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Lý do thay đổi <span className="text-danger">*</span>
            </p>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="vd: Nâng ngưỡng theo chỉ đạo học vụ…" className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={submit}>Lưu quy tắc</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetRuleDialog({ rule, onClose, onSaved }: { rule: BusinessRule | null; onClose: () => void; onSaved: () => void }) {
  const [reason, setReason] = useState('');

  const submit = async () => {
    if (!rule) return;
    try {
      await resetBusinessRule(rule._id, { reason: reason.trim() || 'Khôi phục về giá trị mặc định của hệ thống' });
      toast.success(`Đã khôi phục quy tắc ${rule.ruleCode} về mặc định`);
      onSaved();
      onClose();
    } catch {
      toast.error('Khôi phục thất bại');
    }
  };

  return (
    <Dialog open={!!rule} onOpenChange={(v) => { if (v) setReason(''); if (!v) onClose(); }}>
      <DialogContent className="tw-scope max-w-md">
        <DialogHeader>
          <DialogTitle>Khôi phục về giá trị mặc định?</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 text-sm">
          <p>
            Bạn có chắc chắn muốn đưa quy tắc <strong className="font-mono text-primary">{rule?.ruleCode}</strong> về giá trị mặc định:
          </p>
          <div className="rounded-control border border-border bg-muted p-3 font-mono text-sm">
            {rule ? formatValue(rule.defaultValue) : ''} {rule?.unit}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Lý do khôi phục</p>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="vd: Hết đợt thử nghiệm…" className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={submit}>Khôi phục mặc định</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({ rule, onClose }: { rule: BusinessRule | null; onClose: () => void }) {
  const [list, setList] = useState<RuleHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async (r: BusinessRule | null) => {
    if (!r) return;
    setLoading(true);
    try {
      setList(await getBusinessRuleHistory(r._id));
    } catch {
      toast.error('Không thể lấy lịch sử thay đổi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!rule} onOpenChange={(v) => { if (v) load(rule); if (!v) onClose(); }}>
      <DialogContent className="tw-scope max-w-lg">
        <DialogHeader>
          <DialogTitle>Lịch sử thay đổi: {rule?.ruleCode}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[380px] overflow-y-auto py-2">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Đang tải lịch sử...</p>
          ) : list.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Quy tắc này vẫn đang ở giá trị nguyên bản, chưa có thay đổi nào.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {list.map((h, i) => (
                <div key={i} className="flex flex-col gap-1.5 rounded-control border border-border bg-card p-3 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Người sửa: <strong className="text-foreground">{h.changedBy?.fullName || 'Quản trị viên'}</strong></span>
                    <span>{new Date(h.changedAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="my-1 flex items-center gap-2 font-mono">
                    <span className="rounded bg-danger/10 px-1.5 py-0.5 text-danger line-through">{formatValue(h.oldValue)}</span>
                    <span>→</span>
                    <span className="rounded bg-success/10 px-1.5 py-0.5 font-bold text-success">{formatValue(h.newValue)}</span>
                  </div>
                  <p className="italic text-muted-foreground">Lý do: &quot;{h.reason}&quot;</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BusinessRuleAdmin() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [tableKey, setTableKey] = useState(0);
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);
  const [resettingRule, setResettingRule] = useState<BusinessRule | null>(null);
  const [historyRule, setHistoryRule] = useState<BusinessRule | null>(null);

  const reload = () => setTableKey((k) => k + 1);

  const handleExport = (rules: BusinessRule[]) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rules, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `navilearn-business-rules-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    toast.success('Đã xuất danh mục quy tắc thành công');
  };

  const columns: ColumnDef<BusinessRule>[] = [
    {
      accessorKey: 'ruleCode',
      header: 'Mã quy tắc',
      meta: { enableColumnSearch: true },
      cell: ({ getValue }) => <span className="font-mono text-xs font-bold text-primary">{getValue<string>()}</span>,
    },
    { accessorKey: 'name', header: 'Tên quy tắc' },
    {
      accessorKey: 'category',
      header: 'Nhóm',
      meta: { filterOptions: Object.keys(CATEGORY_LABEL) },
      cell: ({ getValue }) => <StatusBadge variant="info">{CATEGORY_LABEL[getValue<RuleCategory>()]}</StatusBadge>,
    },
    { accessorKey: 'description', header: 'Mô tả', cell: ({ getValue }) => <ClampLine text={getValue<string>() || '—'} /> },
    {
      id: 'value',
      header: 'Giá trị hiện hành',
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {formatValue(row.original.value)}
          {row.original.unit ? <span className="ml-1 text-muted-foreground">({row.original.unit})</span> : null}
        </span>
      ),
    },
    {
      id: 'state',
      header: 'Trạng thái',
      cell: ({ row }) =>
        JSON.stringify(row.original.value) !== JSON.stringify(row.original.defaultValue) ? (
          <StatusBadge variant="warning">Đã tùy biến</StatusBadge>
        ) : (
          <StatusBadge variant="success">Mặc định</StatusBadge>
        ),
    },
  ];

  return (
    <AppShell
      menu={adminMenu}
      title="Quy tắc nghiệp vụ"
      breadcrumb={['Trang chủ', 'Vận hành hệ thống', 'Quy tắc nghiệp vụ']}
      userName={user?.fullName ?? ''}
      roleLabel="Quản trị viên"
      compactHeader
      area="admin"
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-4 text-xl font-bold text-foreground">Quy tắc nghiệp vụ</h1>
      <DataTablePage<BusinessRule>
        key={tableKey}
        columns={columns}
        getRowId={(r) => r._id}
        searchPlaceholder="Tìm mã hoặc tên quy tắc…"
        emptyLabel="Không có quy tắc nào"
        fetcher={async ({ page, pageSize, search }) => {
          const res = await listBusinessRules({ page, limit: pageSize, search: search || undefined });
          return { data: res.data, total: res.meta?.total ?? res.data.length };
        }}
        toolbarActions={[{ key: 'export', label: 'Xuất JSON', onSelect: () => listBusinessRules({ limit: 100 }).then((res) => handleExport(res.data)) }]}
        rowActions={[
          { key: 'edit', label: 'Chỉnh sửa', onSelect: (row) => setEditingRule(row) },
          { key: 'history', label: 'Xem lịch sử', onSelect: (row) => setHistoryRule(row) },
          {
            key: 'reset',
            label: 'Khôi phục mặc định',
            hidden: (row) => JSON.stringify(row.value) === JSON.stringify(row.defaultValue),
            onSelect: (row) => setResettingRule(row),
          },
        ]}
      />

      <EditRuleDialog rule={editingRule} onClose={() => setEditingRule(null)} onSaved={reload} />
      <ResetRuleDialog rule={resettingRule} onClose={() => setResettingRule(null)} onSaved={reload} />
      <HistoryDialog rule={historyRule} onClose={() => setHistoryRule(null)} />
    </AppShell>
  );
}
