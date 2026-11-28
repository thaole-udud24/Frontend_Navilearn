import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import type { ApiError } from '@/services/apiError';
import { getBusinessRuleByCode, updateBusinessRule } from '@/services/business-rule';
import type { BusinessRule } from '@/services/business-rule/types';

// B14: ba ngưỡng rủi ro thật mà engine đọc trực tiếp — mỗi field trỏ tới đúng 1 quy tắc nghiệp vụ
// đã có (module "Quy tắc", category RISK/MASTERY). Đây là một form rút gọn, thân thiện hơn trên
// cùng dữ liệu, không phải một model/CRUD song song.
const FIELDS = [
  {
    ruleCode: 'BR-17-FALLING-BEHIND',
    label: 'Trễ tiến độ quá (%)',
    hint: 'Chênh lệch tiến độ thực tế so với kế hoạch của một chặng để cảnh báo (N9).',
    usedFor: 'Khi trễ tiến độ → Đề xuất điều chỉnh lộ trình',
  },
  {
    ruleCode: 'MST-LEVEL-DEVELOPING',
    label: 'Mastery yếu dưới (%)',
    hint: 'Mức Mastery một chủ đề được xem là yếu (dùng chung với ngưỡng Learning State).',
    usedFor: 'Khi Mastery yếu → Đề xuất ôn tập',
  },
  {
    ruleCode: 'BR-17-RETENTION-RISK',
    label: 'Ngày không ôn tập liên tiếp',
    hint: 'Số ngày không ôn lại một kiến thức trước khi cảnh báo nguy cơ quên (chuỗi học sắp đứt).',
    usedFor: 'Khi bỏ học → Nhắc học',
  },
] as const;

export default function AdminRiskThresholdsPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const [rules, setRules] = useState<Record<string, BusinessRule>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const loaded = await Promise.all(FIELDS.map((f) => getBusinessRuleByCode(f.ruleCode)));
        setRules(Object.fromEntries(loaded.map((r) => [r.ruleCode, r])));
        setValues(Object.fromEntries(loaded.map((r) => [r.ruleCode, String(r.value)])));
      } catch (err) {
        toast.error((err as ApiError)?.message || 'Không tải được ngưỡng cảnh báo');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const changed = FIELDS.filter((f) => {
        const rule = rules[f.ruleCode];
        return rule && String(rule.value) !== values[f.ruleCode];
      });
      if (changed.length === 0) {
        toast.info('Không có ngưỡng nào thay đổi');
        return;
      }
      const updated = await Promise.all(
        changed.map((f) => {
          const raw = values[f.ruleCode];
          const num = Number(raw);
          if (Number.isNaN(num)) throw new Error(`Giá trị "${f.label}" phải là số`);
          return updateBusinessRule(rules[f.ruleCode]._id, {
            value: num,
            reason: 'Cập nhật ngưỡng cảnh báo rủi ro (B14)',
          });
        }),
      );
      setRules((prev) => ({ ...prev, ...Object.fromEntries(updated.map((r) => [r.ruleCode, r])) }));
      toast.success('Đã lưu ngưỡng cảnh báo');
    } catch (err) {
      toast.error((err as Error)?.message || 'Lưu ngưỡng cảnh báo thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      menu={adminMenu}
      title="Ngưỡng cảnh báo"
      breadcrumb={['Trang chủ', 'Vận hành hệ thống', 'Cấu hình hệ thống', 'Ngưỡng cảnh báo']}
      userName={user?.fullName ?? ''}
      roleLabel="Quản trị viên"
      compactHeader
      area="admin"
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-1 text-xl font-bold text-foreground">Ngưỡng cảnh báo</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Các ngưỡng này quyết định khi nào hệ thống tự sinh Cảnh báo rủi ro cho sinh viên (N9). Thay đổi áp
        dụng từ lần quét kế tiếp.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      ) : (
        <>
          <Card className="mb-4 grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <label key={f.ruleCode} className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">{f.label}</span>
                <Input
                  value={values[f.ruleCode] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [f.ruleCode]: e.target.value }))}
                  inputMode="decimal"
                />
                <span className="text-xs text-muted-foreground">{f.hint}</span>
              </label>
            ))}
          </Card>

          <Card className="mb-4">
            <span className="mb-2 block text-sm font-semibold text-foreground">Hành động đề xuất</span>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {FIELDS.map((f) => (
                <li key={f.ruleCode}>{f.usedFor}</li>
              ))}
            </ul>
          </Card>

          <Button type="button" onClick={save} disabled={saving}>
            {saving ? 'Đang lưu…' : 'Lưu ngưỡng'}
          </Button>
        </>
      )}
    </AppShell>
  );
}
