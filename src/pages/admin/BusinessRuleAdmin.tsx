import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Sliders,
  RotateCcw,
  History,
  Edit3,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Brain,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import { AppShell } from '@/layouts/AppShell';
import { adminMenu } from '@/config/menu.admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  listBusinessRules,
  updateBusinessRule,
  resetBusinessRule,
  getBusinessRuleHistory,
} from '@/services/business-rule';
import type { BusinessRule, RuleCategory, RuleHistoryEntry } from '@/services/business-rule/types';

const CATEGORY_LABELS: Record<RuleCategory | 'ALL', { label: string; icon: LucideIcon; color: string }> = {
  ALL: { label: 'Tất cả', icon: Sliders, color: 'text-foreground' },
  AI: { label: 'Trợ lý AI (BR-15)', icon: Cpu, color: 'text-purple-600' },
  RISK: { label: 'Cảnh báo rủi ro (BR-17)', icon: AlertTriangle, color: 'text-amber-600' },
  REVISION: { label: 'Chu kỳ ôn tập (BR-16)', icon: Calendar, color: 'text-blue-600' },
  MASTERY: { label: 'Năng lực & Trọng số (BR-05, BR-12)', icon: Brain, color: 'text-emerald-600' },
  GENERAL: { label: 'Chung', icon: Sliders, color: 'text-gray-600' },
};

export default function BusinessRuleAdmin() {
    const [rules, setRules] = useState<BusinessRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<RuleCategory | 'ALL'>('ALL');
    // Dialog states
    const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);
    const [editValueStr, setEditValueStr] = useState('');
    const [editReason, setEditReason] = useState('');
    const [historyRule, setHistoryRule] = useState<BusinessRule | null>(null);
    const [historyList, setHistoryList] = useState<RuleHistoryEntry[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [resettingRule, setResettingRule] = useState<BusinessRule | null>(null);
    const [resetReason, setResetReason] = useState('');

    const loadRules = async () => {
        setLoading(true);
        try{
            const res = await listBusinessRules({limit: 100});
            setRules(res.data || []);
        }catch (error) {
            toast.error('Không thể tải danh sách quy tắc nghiệp vụ.');
        }finally{
            setLoading(false);
        }
  };

    useEffect(() => {
    loadRules();
    }, []);

    const filteredRules = useMemo(() => {
        return rules.filter((r) => {
            const matchCat = selectedCategory === 'ALL' || r.category === selectedCategory;
            const matchSearch = !search || r.ruleCode.toLowerCase().includes(search.toLowerCase()) || r.name.toLowerCase().includes(search.toLowerCase())
            || r.description && r.description.toLowerCase().includes(search.toLowerCase());
            return matchCat && matchSearch;
        });
    }, [rules, selectedCategory, search]);

    const openEdit = (rule: BusinessRule) => {
        setEditingRule(rule);
        setEditValueStr(typeof rule.value === 'object' ? JSON.stringify(rule.value) : String(rule.value));
        setEditReason('');
    }

  const handleSaveEdit = async () => {
    if (!editingRule) return;
    if (!editReason.trim()) {
      toast.error('Vui lòng nhập lý do thay đổi quy tắc');
      return;
    }
    let parsedValue: unknown = editValueStr;
    try {
      if (editValueStr.startsWith('{') || editValueStr.startsWith('[')) {
        parsedValue = JSON.parse(editValueStr);
      } else if (!isNaN(Number(editValueStr)) && editValueStr.trim() !== '') {
        parsedValue = Number(editValueStr);
      }
    } catch {
      toast.error('Giá trị nhập vào không đúng định dạng JSON/Số');
      return;
    }
    try {
      await updateBusinessRule(editingRule._id, {
        value: parsedValue,
        reason: editReason.trim(),
      });
      toast.success(`Đã cập nhật quy tắc ${editingRule.ruleCode}`);
      setEditingRule(null);
      loadRules();
    } catch {
      toast.error('Cập nhật quy tắc thất bại');
    }
  };
  
  const handleConfirmReset = async () => {
    if (!resettingRule) return;
    try {
      await resetBusinessRule(resettingRule._id, {
        reason: resetReason.trim() || 'Khôi phục về giá trị mặc định của hệ thống',
      });
      toast.success(`Đã khôi phục quy tắc ${resettingRule.ruleCode} về mặc định`);
      setResettingRule(null);
      loadRules();
    } catch {
      toast.error('Khôi phục thất bại');
    }
  };
  
  const openHistory = async (rule: BusinessRule) => {
    setHistoryRule(rule);
    setHistoryLoading(true);
    try {
      const data = await getBusinessRuleHistory(rule._id);
      setHistoryList(data || []);
    } catch {
      toast.error('Không thể lấy lịch sử thay đổi');
    } finally {
      setHistoryLoading(false);
    }
  };
  
  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rules, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `navilearn-business-rules-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Đã xuất danh mục quy tắc thành công');
  };
  return(
    <AppShell 
        menu={adminMenu}
        title="Quy tắc nghiệp vụ"
        breadcrumb={['Quản trị', 'Quy tắc nghiệp vụ & Ngưỡng']}
        userName="Admin"
        roleLabel="Quản trị viên"
    >
        <div className="flex flex-col gap-6">
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              Cấu hình Quy tắc nghiệp vụ (Business Rules)
            </h2>
            <p className="text-sm text-muted-foreground">
              Quản lý các thông số ngưỡng AI, chu kỳ ôn tập ngắt quãng và rủi ro học tập
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm mã hoặc tên quy tắc..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Xuất JSON
            </Button>
          </div>
        </div>
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(CATEGORY_LABELS) as (RuleCategory | 'ALL')[]).map((cat) => {
            const info = CATEGORY_LABELS[cat];
            const Icon = info.icon;
            const count = cat === 'ALL' ? rules.length : rules.filter((r) => r.category === cat).length;
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-primary-foreground' : info.color}`} />
                <span>{info.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        {/* Danh sách quy tắc */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Đang tải dữ liệu quy tắc...</div>
          ) : filteredRules.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Không tìm thấy quy tắc nào phù hợp</div>
          ) : (
            <div className="divide-y divide-border">
              {filteredRules.map((rule) => {
                const isModified = JSON.stringify(rule.value) !== JSON.stringify(rule.defaultValue);
                return (
                  <div key={rule._id} className="p-5 hover:bg-muted/40 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {rule.ruleCode}
                        </span>
                        <h4 className="font-semibold text-foreground text-base truncate">{rule.name}</h4>
                        {isModified ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium border border-amber-500/20">
                            Đã tùy biến
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium border border-emerald-500/20">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{rule.description || 'Chưa có mô tả chi tiết'}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div className="bg-muted px-2.5 py-1 rounded-md border border-border">
                          <span className="text-muted-foreground">Giá trị hiện hành: </span>
                          <strong className="text-foreground font-mono text-sm ml-1">
                            {typeof rule.value === 'object' ? JSON.stringify(rule.value) : String(rule.value)}
                          </strong>
                          {rule.unit && <span className="text-muted-foreground ml-1">({rule.unit})</span>}
                        </div>
                        <div className="text-muted-foreground">
                          Mặc định: <span className="font-mono">{typeof rule.defaultValue === 'object' ? JSON.stringify(rule.defaultValue) : String(rule.defaultValue)}</span>
                        </div>
                        {rule.history && rule.history.length > 0 && (
                          <div className="text-muted-foreground flex items-center gap-1">
                            <History className="w-3.5 h-3.5" />
                            Đã sửa {rule.history.length} lần
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openEdit(rule)} className="flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5" />
                        Chỉnh sửa
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openHistory(rule)} title="Xem lịch sử thay đổi">
                        <History className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      {isModified && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setResettingRule(rule); setResetReason(''); }}
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          title="Khôi phục về mặc định"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Modal 1: Chỉnh sửa giá trị & ngưỡng (SCR-ADM-50, SCR-ADM-51) */}
      <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              Chỉnh sửa: {editingRule?.ruleCode}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Tên quy tắc</label>
              <p className="text-sm font-medium text-foreground mt-0.5">{editingRule?.name}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Giá trị áp dụng mới {editingRule?.unit ? `(${editingRule.unit})` : ''}
              </label>
              <Input
                value={editValueStr}
                onChange={(e) => setEditValueStr(e.target.value)}
                placeholder="Nhập giá trị mới (Số, chuỗi hoặc JSON)..."
                className="mt-1 font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Giá trị mặc định ban đầu: <span className="font-mono">{String(editingRule?.defaultValue)}</span>
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Lý do thay đổi <span className="text-destructive">*</span>
              </label>
              <Input
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="vd: Nâng ngưỡng cảnh báo theo chỉ đạo học vụ..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRule(null)}>Hủy</Button>
            <Button onClick={handleSaveEdit}>Lưu quy tắc</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal 2: Khôi phục mặc định (UC-BRL-06) */}
      <Dialog open={!!resettingRule} onOpenChange={(open) => !open && setResettingRule(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <RotateCcw className="w-5 h-5" />
              Khôi phục về giá trị mặc định?
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2 text-sm">
            <p>
              Bạn có chắc chắn muốn đưa quy tắc <strong className="font-mono text-primary">{resettingRule?.ruleCode}</strong> về giá trị mặc định:
            </p>
            <div className="bg-muted p-3 rounded-lg font-mono text-sm border border-border">
              {String(resettingRule?.defaultValue)} {resettingRule?.unit}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Lý do khôi phục</label>
              <Input
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                placeholder="vd: Hết đợt thử nghiệm, hoàn nguyên quy tắc..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResettingRule(null)}>Hủy</Button>
            <Button onClick={handleConfirmReset} className="bg-amber-600 hover:bg-amber-700 text-white">
              Khôi phục mặc định
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal 3: Lịch sử thay đổi quy tắc (UC-BRL-02, SCR-ADM-53) */}
      <Dialog open={!!historyRule} onOpenChange={(open) => !open && setHistoryRule(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Lịch sử thay đổi: {historyRule?.ruleCode}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[380px] overflow-y-auto py-2">
            {historyLoading ? (
              <p className="text-center text-sm text-muted-foreground py-6">Đang tải lịch sử...</p>
            ) : historyList.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Chưa có thay đổi nào</p>
                <p className="text-xs text-muted-foreground">Quy tắc này vẫn đang ở giá trị nguyên bản.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {historyList.map((h, i) => (
                  <div key={i} className="p-3.5 rounded-lg border border-border bg-card text-xs flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Người sửa: <strong className="text-foreground">{h.changedBy?.fullName || 'Quản trị viên'}</strong></span>
                      <span>{new Date(h.changedAt).toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono my-1">
                      <span className="line-through text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                        {String(h.oldValue)}
                      </span>
                      <span>➡️</span>
                      <span className="text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
                        {String(h.newValue)}
                      </span>
                    </div>
                    <p className="text-muted-foreground italic">Lý do: &quot;{h.reason}&quot;</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryRule(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}