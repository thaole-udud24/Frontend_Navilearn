import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Braces, Eye, History, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { DetailRow, FormDialogFooter, FormDialogTitle, FormField } from '@/components/DialogForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTablePage, ClampLine } from '@/components/DataTablePage';
import { StatusBadge } from '@/components/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  listBusinessRules,
  createBusinessRule,
  updateBusinessRule,
  resetBusinessRule,
  removeBusinessRule,
  exportBusinessRules,
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

function EditRuleDialog({
  rule,
  onClose,
  onSaved,
}: {
  rule: BusinessRule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
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
    <Dialog
      open={!!rule}
      onOpenChange={(v) => {
        if (v) load(rule);
        if (!v) onClose();
      }}
    >
      <DialogContent className="tw-scope max-w-md">
        <DialogHeader>
          <FormDialogTitle icon={Pencil}>Chỉnh sửa Quy tắc nghiệp vụ</FormDialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <DetailRow label="Mã quy tắc">{rule?.ruleCode}</DetailRow>
          <DetailRow label="Tên quy tắc">{rule?.name}</DetailRow>
          <FormField label={`Giá trị áp dụng mới ${rule?.unit ? `(${rule.unit})` : ''}`} required>
            <Input
              value={valueStr}
              onChange={(e) => setValueStr(e.target.value)}
              placeholder="Số, chuỗi hoặc JSON…"
              className="font-mono"
            />
          </FormField>
          <p className="-mt-2 text-xs text-muted-foreground">
            Giá trị mặc định ban đầu:{' '}
            <span className="font-mono">{rule ? formatValue(rule.defaultValue) : ''}</span>
          </p>
          <FormField label="Lý do thay đổi" required>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="vd: Nâng ngưỡng theo chỉ đạo học vụ…"
            />
          </FormField>
        </div>
        <FormDialogFooter onCancel={onClose} submitLabel="Lưu lại" onSubmit={submit} />
      </DialogContent>
    </Dialog>
  );
}

function ResetRuleDialog({
  rule,
  onClose,
  onSaved,
}: {
  rule: BusinessRule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [reason, setReason] = useState('');

  const submit = async () => {
    if (!rule) return;
    try {
      await resetBusinessRule(rule._id, {
        reason: reason.trim() || 'Khôi phục về giá trị mặc định của hệ thống',
      });
      toast.success(`Đã khôi phục quy tắc ${rule.ruleCode} về mặc định`);
      onSaved();
      onClose();
    } catch {
      toast.error('Khôi phục thất bại');
    }
  };

  return (
    <Dialog
      open={!!rule}
      onOpenChange={(v) => {
        if (v) setReason('');
        if (!v) onClose();
      }}
    >
      <DialogContent className="tw-scope max-w-md">
        <DialogHeader>
          <FormDialogTitle icon={RotateCcw}>Khôi phục Quy tắc nghiệp vụ về mặc định</FormDialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 text-sm">
          <p>
            Bạn có chắc chắn muốn đưa quy tắc{' '}
            <strong className="font-mono text-primary">{rule?.ruleCode}</strong> về giá trị mặc định:
          </p>
          <div className="rounded-control border border-border bg-muted p-3 font-mono text-sm">
            {rule ? formatValue(rule.defaultValue) : ''} {rule?.unit}
          </div>
          <FormField label="Lý do khôi phục">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="vd: Hết đợt thử nghiệm…"
            />
          </FormField>
        </div>
        <FormDialogFooter onCancel={onClose} submitLabel="Khôi phục mặc định" onSubmit={submit} />
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
    <Dialog
      open={!!rule}
      onOpenChange={(v) => {
        if (v) load(rule);
        if (!v) onClose();
      }}
    >
      <DialogContent className="tw-scope max-w-lg">
        <DialogHeader>
          <FormDialogTitle icon={History}>Lịch sử thay đổi — {rule?.ruleCode}</FormDialogTitle>
        </DialogHeader>
        <div className="max-h-[380px] overflow-y-auto py-2">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Đang tải lịch sử...</p>
          ) : list.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Quy tắc này vẫn đang ở giá trị nguyên bản, chưa có thay đổi nào.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {list.map((h, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1.5 rounded-control border border-border bg-card p-3 text-xs"
                >
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>
                      Người sửa:{' '}
                      <strong className="text-foreground">{h.changedBy?.fullName || 'Quản trị viên'}</strong>
                    </span>
                    <span>{new Date(h.changedAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="my-1 flex items-center gap-2 font-mono">
                    <span className="rounded bg-danger/10 px-1.5 py-0.5 text-danger line-through">
                      {formatValue(h.oldValue)}
                    </span>
                    <span>→</span>
                    <span className="rounded bg-success/10 px-1.5 py-0.5 font-bold text-success">
                      {formatValue(h.newValue)}
                    </span>
                  </div>
                  <p className="italic text-muted-foreground">Lý do: &quot;{h.reason}&quot;</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateRuleDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [ruleCode, setRuleCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<RuleCategory>('GENERAL');
  const [valueStr, setValueStr] = useState('');
  const [unit, setUnit] = useState('');
  const [description, setDescription] = useState('');

  const reset = () => {
    setRuleCode('');
    setName('');
    setCategory('GENERAL');
    setValueStr('');
    setUnit('');
    setDescription('');
  };

  const submit = async () => {
    if (!ruleCode.trim() || !name.trim() || !valueStr.trim()) {
      toast.error('Cần nhập mã quy tắc, tên và giá trị');
      return;
    }
    let value: unknown = valueStr;
    try {
      if (valueStr.startsWith('{') || valueStr.startsWith('[')) value = JSON.parse(valueStr);
      else if (!Number.isNaN(Number(valueStr))) value = Number(valueStr);
    } catch {
      toast.error('Giá trị nhập vào không đúng định dạng JSON/Số');
      return;
    }
    try {
      await createBusinessRule({
        ruleCode: ruleCode.trim().toUpperCase(),
        name: name.trim(),
        category,
        value,
        defaultValue: value,
        unit: unit.trim() || undefined,
        description: description.trim() || undefined,
      });
      toast.success(`Đã tạo quy tắc ${ruleCode.trim().toUpperCase()}`);
      onSaved();
      onClose();
      reset();
    } catch {
      toast.error('Tạo quy tắc thất bại — kiểm tra lại mã quy tắc có bị trùng không');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
          reset();
        }
      }}
    >
      <DialogContent className="tw-scope max-w-md">
        <DialogHeader>
          <FormDialogTitle icon={Plus}>Thêm mới Quy tắc nghiệp vụ</FormDialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <FormField label="Mã quy tắc" required>
            <Input
              value={ruleCode}
              onChange={(e) => setRuleCode(e.target.value)}
              placeholder="Vd: BR-20-CUSTOM"
              className="font-mono"
            />
          </FormField>
          <FormField label="Tên quy tắc" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên hiển thị của quy tắc"
            />
          </FormField>
          <FormField label="Danh mục">
            <Select value={category} onValueChange={(v) => setCategory(v as RuleCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="tw-scope">
                {Object.entries(CATEGORY_LABEL).map(([v, label]) => (
                  <SelectItem key={v} value={v}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <div className="flex gap-2">
            <FormField label="Giá trị" required className="flex-1">
              <Input
                value={valueStr}
                onChange={(e) => setValueStr(e.target.value)}
                placeholder="Số, chuỗi hoặc JSON"
                className="font-mono"
              />
            </FormField>
            <FormField label="Đơn vị" className="w-28">
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="vd: %" />
            </FormField>
          </div>
          <FormField label="Mô tả">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn (không bắt buộc)"
            />
          </FormField>
        </div>
        <FormDialogFooter onCancel={onClose} submitLabel="Thêm mới" onSubmit={submit} />
      </DialogContent>
    </Dialog>
  );
}

function ValueCell({ rule }: { rule: BusinessRule }) {
  const [open, setOpen] = useState(false);
  const isObject = typeof rule.value === 'object' && rule.value !== null;
  const summary = formatValue(rule.value);

  return (
    <>
      <div className="flex items-center gap-1.5">
        <span className="min-w-0 truncate font-mono text-sm" title={summary}>
          {summary}
        </span>
        {rule.unit && <span className="shrink-0 text-xs text-muted-foreground">({rule.unit})</span>}
        {isObject && (
          <button
            type="button"
            aria-label="Xem đầy đủ giá trị JSON"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-control p-1 text-muted-foreground hover:bg-muted hover:text-primary"
          >
            <Braces className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="tw-scope max-w-lg">
          <DialogHeader>
            <FormDialogTitle icon={Eye}>Giá trị đầy đủ — {rule.ruleCode}</FormDialogTitle>
          </DialogHeader>
          <pre className="max-h-[50vh] overflow-auto rounded-control border border-border bg-muted p-3 font-mono text-xs leading-relaxed text-foreground">
            {JSON.stringify(rule.value, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </>
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
  const [deletingRule, setDeletingRule] = useState<BusinessRule | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const reload = () => setTableKey((k) => k + 1);

  const handleExport = async () => {
    try {
      const blob = await exportBusinessRules();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `navilearn-business-rules-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Đã xuất danh mục quy tắc thành công');
    } catch {
      toast.error('Xuất danh mục quy tắc thất bại');
    }
  };

  const handleDelete = async () => {
    if (!deletingRule) return;
    try {
      await removeBusinessRule(deletingRule._id);
      toast.success(`Đã xoá quy tắc ${deletingRule.ruleCode}`);
      reload();
    } catch {
      toast.error('Xoá quy tắc thất bại');
    } finally {
      setDeletingRule(null);
    }
  };

  const columns: ColumnDef<BusinessRule>[] = [
    {
      accessorKey: 'ruleCode',
      header: 'Mã quy tắc',
      size: 180,
      minSize: 140,
      meta: { enableColumnSearch: true },
      cell: ({ getValue }) => (
        <span className="font-mono text-xs font-bold text-primary">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Tên quy tắc',
      size: 240,
      cell: ({ getValue }) => <ClampLine text={getValue<string>()} />,
    },
    {
      accessorKey: 'category',
      header: 'Nhóm',
      size: 220,
      meta: { filterOptions: Object.keys(CATEGORY_LABEL) },
      cell: ({ getValue }) => (
        <StatusBadge variant="info">{CATEGORY_LABEL[getValue<RuleCategory>()]}</StatusBadge>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Mô tả',
      size: 260,
      cell: ({ getValue }) => <ClampLine text={getValue<string>() || '—'} />,
    },
    {
      id: 'value',
      header: 'Giá trị hiện hành',
      size: 220,
      cell: ({ row }) => <ValueCell rule={row.original} />,
    },
    {
      id: 'state',
      header: 'Trạng thái',
      size: 140,
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Quy tắc nghiệp vụ</h1>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Thêm mới
        </Button>
      </div>
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
        toolbarActions={[
          { key: 'create', label: 'Tạo quy tắc mới', onSelect: () => setCreateOpen(true) },
          { key: 'export', label: 'Xuất CSV', onSelect: handleExport },
        ]}
        rowActions={[
          { key: 'edit', label: 'Chỉnh sửa', icon: <Pencil />, onSelect: (row) => setEditingRule(row) },
          { key: 'history', label: 'Xem lịch sử', icon: <History />, onSelect: (row) => setHistoryRule(row) },
          {
            key: 'reset',
            label: 'Khôi phục mặc định',
            icon: <RotateCcw />,
            hidden: (row) => JSON.stringify(row.value) === JSON.stringify(row.defaultValue),
            onSelect: (row) => setResettingRule(row),
          },
          {
            key: 'delete',
            label: 'Xoá quy tắc',
            icon: <Trash2 />,
            danger: true,
            onSelect: (row) => setDeletingRule(row),
          },
        ]}
      />

      <CreateRuleDialog open={createOpen} onClose={() => setCreateOpen(false)} onSaved={reload} />
      <EditRuleDialog rule={editingRule} onClose={() => setEditingRule(null)} onSaved={reload} />
      <ResetRuleDialog rule={resettingRule} onClose={() => setResettingRule(null)} onSaved={reload} />
      <HistoryDialog rule={historyRule} onClose={() => setHistoryRule(null)} />
      <ConfirmDialog
        open={!!deletingRule}
        onOpenChange={(v) => !v && setDeletingRule(null)}
        title="Xoá quy tắc nghiệp vụ?"
        description={`Quy tắc ${deletingRule?.ruleCode ?? ''} sẽ bị xoá khỏi danh sách. Hành động này không thể hoàn tác.`}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}
