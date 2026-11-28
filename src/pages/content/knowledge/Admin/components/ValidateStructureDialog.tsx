import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { FormDialogTitle } from '@/components/DialogForm';
import { validateStructure, type Concept, type StructureIssue } from '@/services/knowledge';

interface ValidateStructureDialogProps {
  concept: Concept | null;
  onOpenChange: (open: boolean) => void;
}

function IssueList({ issues, tone }: { issues: StructureIssue[]; tone: 'error' | 'warning' }) {
  const Icon = tone === 'error' ? XCircle : AlertTriangle;
  return (
    <ul className="flex flex-col gap-1.5">
      {issues.map((issue, index) => (
        <li key={`${issue.code}-${issue.nodeId ?? index}`} className="flex items-start gap-2 text-sm">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone === 'error' ? 'text-danger' : 'text-warning'}`} />
          <span>{issue.message}</span>
        </li>
      ))}
    </ul>
  );
}

/** FE-ADM-23: check a sample structure for errors (duplicates, loops, depth) before students use it. */
export function ValidateStructureDialog({ concept, onOpenChange }: ValidateStructureDialogProps) {
  const report = useQuery({
    queryKey: ['knowledge-items', 'validate', concept?._id],
    queryFn: () => validateStructure(concept?._id as string),
    enabled: !!concept,
    // A check must reflect the structure as it is now, never a cached result.
    gcTime: 0,
  });
  const data = report.data;

  return (
    <Dialog open={!!concept} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <FormDialogTitle icon={ShieldCheck}>Kiểm tra cấu trúc «{concept?.name}»</FormDialogTitle>
        </DialogHeader>
        {report.isLoading && <p className="text-sm text-muted-foreground">Đang kiểm tra…</p>}
        {report.isError && <p className="text-sm text-danger">Không kiểm tra được cấu trúc này.</p>}
        {data && (
          <div className="flex flex-col gap-4">
            <div
              className={`flex items-center gap-2 rounded-control p-3 text-sm font-medium ${data.valid ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}
              role="status"
            >
              {data.valid ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {data.valid ? 'Cấu trúc hợp lệ' : `Cấu trúc có ${data.errors.length} lỗi cần sửa`}
            </div>
            <p className="text-sm text-muted-foreground">
              {data.stats.chapters} chương · {data.stats.topics} chủ đề · {data.stats.concepts} khái niệm (
              {data.stats.total} nút đang sử dụng)
            </p>
            {data.errors.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-semibold">Lỗi</h3>
                <IssueList issues={data.errors} tone="error" />
              </section>
            )}
            {data.warnings.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-semibold">Cảnh báo ({data.warnings.length})</h3>
                <IssueList issues={data.warnings} tone="warning" />
              </section>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
