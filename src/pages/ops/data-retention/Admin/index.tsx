import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Archive, Download, FileUp, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveBlob } from '@/utils/download';
import { parseCsv, toCsv } from '@/utils/csv';
import { exportStudentData, getDataActivityLog, getRetentionStats, getStaleRecords } from '@/services/admin-data';
import type { DataActivityLogEntry } from '@/services/admin-data/types';
import { exportConcepts, importConcepts } from '@/services/knowledge';
import { exportQuestions } from '@/services/question-bank';

type ExportTarget = 'concept' | 'question';

const ACTION_LABEL: Record<string, string> = {
  'knowledge.import': 'Nhập khái niệm',
  'knowledge.export': 'Xuất khái niệm',
  'question_bank.import': 'Nhập câu hỏi',
  'question_bank.export': 'Xuất câu hỏi',
};

function activityRowLabel(entry: DataActivityLogEntry) {
  const isImport = entry.action.endsWith('.import');
  const detail = isImport
    ? `${entry.meta.createdCount ?? 0} dòng tạo mới, ${entry.meta.errorCount ?? 0} lỗi`
    : `${entry.meta.count ?? 0} dòng`;
  return { loai: isImport ? 'Nhập' : 'Xuất', ketQua: detail };
}

export default function AdminDataRetentionItemsPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [staleDays, setStaleDays] = useState(30);
  const [exportTarget, setExportTarget] = useState<ExportTarget>('concept');
  const [studentQuery, setStudentQuery] = useState('');
  const [importing, setImporting] = useState(false);

  const retentionQuery = useQuery({ queryKey: ['admin-data', 'retention-stats'], queryFn: getRetentionStats });
  const staleQuery = useQuery({
    queryKey: ['admin-data', 'stale-records', staleDays],
    queryFn: () => getStaleRecords(staleDays),
  });
  const activityQuery = useQuery({ queryKey: ['admin-data', 'activity-log'], queryFn: () => getDataActivityLog(10) });

  const downloadTemplate = () => {
    const template = '﻿name,description,order,parentConcept\r\nTên khái niệm mới,Mô tả ngắn gọn,0,\r\n';
    saveBlob(new Blob([template], { type: 'text/csv;charset=utf-8' }), 'mau-nhap-khai-niem.csv');
  };

  const handleImportFile = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        toast.error('Tệp CSV không có dòng dữ liệu nào');
        return;
      }
      const result = await importConcepts(
        rows.map((r) => ({
          name: r.name,
          description: r.description || undefined,
          order: r.order ? Number(r.order) : undefined,
          parentConcept: r.parentConcept || null,
        })),
      );
      if (result.errorCount === 0) {
        toast.success(`Đã nhập ${result.createdCount} khái niệm mới`);
      } else {
        toast.warning(`Đã nhập ${result.createdCount} dòng, ${result.errorCount} dòng lỗi (xem console)`);
        // eslint-disable-next-line no-console
        console.warn('Lỗi nhập khái niệm:', result.errors);
      }
      activityQuery.refetch();
    } catch {
      toast.error('Nhập dữ liệu thất bại — kiểm tra lại định dạng tệp CSV');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    try {
      if (exportTarget === 'concept') {
        const concepts = await exportConcepts();
        const csv = toCsv(concepts, [
          { header: 'Tên khái niệm', value: (c) => c.name },
          { header: 'Mô tả', value: (c) => c.description },
          { header: 'Trạng thái', value: (c) => c.status },
          { header: 'Thứ tự', value: (c) => c.order },
        ]);
        saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'xuat-khai-niem.csv');
      } else {
        const questions = await exportQuestions({});
        const csv = toCsv(questions, [
          { header: 'Nội dung câu hỏi', value: (q) => q.text },
          { header: 'Loại', value: (q) => q.type },
          { header: 'Độ khó', value: (q) => q.difficulty },
          { header: 'Trạng thái', value: (q) => q.status },
        ]);
        saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'xuat-cau-hoi.csv');
      }
      toast.success('Đã xuất dữ liệu thành công');
      activityQuery.refetch();
    } catch {
      toast.error('Xuất dữ liệu thất bại');
    }
  };

  const handleExportStudent = async () => {
    if (!studentQuery.trim()) {
      toast.error('Nhập email hoặc mã học viên cần xuất dữ liệu');
      return;
    }
    try {
      const bundle = await exportStudentData(studentQuery.trim());
      saveBlob(
        new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }),
        `du-lieu-hoc-vien-${bundle.student.email}.json`,
      );
      toast.success(`Đã xuất dữ liệu của ${bundle.student.fullName}`);
    } catch {
      toast.error('Không tìm thấy học viên hoặc xuất dữ liệu thất bại');
    }
  };

  return (
    <AppShell
      menu={adminMenu}
      title="Dữ liệu"
      breadcrumb={['Trang chủ', 'Vận hành hệ thống', 'Dữ liệu']}
      userName={user?.fullName ?? ''}
      roleLabel="Quản trị viên"
      compactHeader
      area="admin"
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-4 text-xl font-bold text-foreground">Dữ liệu</h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Lưu trữ dữ liệu theo bộ dữ liệu</CardTitle>
        </CardHeader>
        <p className="mb-3 text-xs text-muted-foreground">
          Hệ thống không xoá cứng dữ liệu đã có người dùng — bản ghi bị xoá chỉ được chuyển sang trạng thái lưu trữ
          (soft delete), vẫn đếm được ở đây.
        </p>
        <div className="grid grid-cols-[1fr_100px_100px_100px] gap-2 border-b border-border bg-muted p-2 text-xs font-semibold">
          <span>Bộ dữ liệu</span>
          <span>Đang dùng</span>
          <span>Đã lưu trữ</span>
          <span>Tổng</span>
        </div>
        {(retentionQuery.data?.collections ?? []).map((c) => (
          <div key={c.key} className="grid grid-cols-[1fr_100px_100px_100px] gap-2 border-b border-border p-2 text-xs last:border-b-0">
            <span>{c.label}</span>
            <span>{c.active}</span>
            <span>{c.archived}</span>
            <span className="font-semibold">{c.total}</span>
          </div>
        ))}
        {retentionQuery.data && (
          <div className="grid grid-cols-[1fr_100px_100px_100px] gap-2 bg-muted p-2 text-xs font-bold">
            <span>Tổng cộng</span>
            <span>{retentionQuery.data.totals.active}</span>
            <span>{retentionQuery.data.totals.archived}</span>
            <span>{retentionQuery.data.totals.active + retentionQuery.data.totals.archived}</span>
          </div>
        )}
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Dữ liệu có thể cần rà soát</CardTitle>
          <Select value={String(staleDays)} onValueChange={(v) => setStaleDays(Number(v))}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="tw-scope">
              <SelectItem value="7">Quá 7 ngày</SelectItem>
              <SelectItem value="30">Quá 30 ngày</SelectItem>
              <SelectItem value="90">Quá 90 ngày</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>

        <p className="mb-2 text-xs font-semibold text-foreground">
          Bài làm bỏ dở {'>'} {staleDays} ngày ({(staleQuery.data?.abandonedAssessments ?? []).length})
        </p>
        {(staleQuery.data?.abandonedAssessments ?? []).length === 0 ? (
          <p className="mb-3 text-xs text-muted-foreground">Không có bài làm nào bị bỏ dở quá lâu.</p>
        ) : (
          <div className="mb-3 flex flex-col gap-1">
            {(staleQuery.data?.abandonedAssessments ?? []).map((a) => (
              <div key={a.id} className="flex justify-between rounded-control border border-border p-2 text-xs">
                <span>
                  {a.owner?.fullName ?? '—'} ({a.owner?.email ?? '—'}) — {a.conceptName ?? 'Không rõ chủ đề'}
                </span>
                <span className="text-muted-foreground">{new Date(a.startedAt).toLocaleDateString('vi-VN')}</span>
              </div>
            ))}
          </div>
        )}

        <p className="mb-2 text-xs font-semibold text-foreground">
          Bản ghi đã lưu trữ quá {staleDays} ngày, có thể xem lại để dọn dẹp thủ công
        </p>
        {(staleQuery.data?.staleArchived ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">Không có bộ dữ liệu nào tồn đọng bản ghi lưu trữ lâu ngày.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(staleQuery.data?.staleArchived ?? []).map((r) => (
              <span key={r.key} className="rounded-full border border-border px-3 py-1 text-xs">
                {r.label}: <strong>{r.count}</strong>
              </span>
            ))}
          </div>
        )}
      </Card>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nhập dữ liệu (khái niệm)</CardTitle>
          </CardHeader>
          <p className="mb-3 text-xs text-muted-foreground">
            Tải lên một tệp CSV (cột: name, description, order, parentConcept) để tạo hàng loạt khái niệm mới.
          </p>
          <div className="flex flex-col gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              disabled={importing}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportFile(f);
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate} className="self-start">
              <FileUp className="h-3.5 w-3.5" /> Tải mẫu nhập
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Xuất dữ liệu</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Đối tượng</span>
              <Select value={exportTarget} onValueChange={(v) => setExportTarget(v as ExportTarget)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="tw-scope">
                  <SelectItem value="concept">Khái niệm</SelectItem>
                  <SelectItem value="question">Câu hỏi</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <Button type="button" onClick={handleExport}>
              <Download className="h-4 w-4" /> Xuất CSV
            </Button>

            <div className="mt-1 border-t border-border pt-3">
              <span className="text-xs font-semibold text-muted-foreground">Xuất toàn bộ dữ liệu của một học viên</span>
              <div className="mt-1.5 flex gap-2">
                <Input
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder="Email học viên"
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleExportStudent}>
                  <Archive className="h-4 w-4" /> Xuất JSON
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex items-center justify-between p-3 pb-0">
          <CardTitle>Lịch sử nhập/xuất</CardTitle>
        </div>
        <div className="mt-2 grid grid-cols-[140px_100px_1fr_160px] gap-2 border-b border-border bg-muted p-3 text-xs font-semibold">
          <span>Thời gian</span>
          <span>Loại</span>
          <span>Kết quả</span>
          <span>Người thực hiện</span>
        </div>
        {(activityQuery.data ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            <Upload className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
            Chưa có lượt nhập/xuất khái niệm hoặc câu hỏi nào.
          </p>
        ) : (
          (activityQuery.data ?? []).map((entry) => {
            const { loai, ketQua } = activityRowLabel(entry);
            return (
              <div key={entry.id} className="grid grid-cols-[140px_100px_1fr_160px] gap-2 border-b border-border p-3 text-xs last:border-b-0">
                <span>{new Date(entry.createdAt).toLocaleString('vi-VN')}</span>
                <span>{loai}</span>
                <span>
                  {ACTION_LABEL[entry.action] ?? entry.action} — {ketQua}
                </span>
                <span className="text-muted-foreground">{entry.actor?.fullName ?? '—'}</span>
              </div>
            );
          })
        )}
      </Card>
    </AppShell>
  );
}
