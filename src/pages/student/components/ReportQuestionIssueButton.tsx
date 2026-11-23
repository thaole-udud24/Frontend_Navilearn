import { useState } from 'react';
import { toast } from 'sonner';
import { Flag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { reportQuestionIssue } from '@/services/question-bank';

const REASONS = [
  { value: 'wrong_answer', label: 'Đáp án sai' },
  { value: 'unclear', label: 'Đề bài không rõ' },
  { value: 'typo', label: 'Lỗi chính tả' },
  { value: 'duplicate', label: 'Trùng câu hỏi khác' },
  { value: 'other', label: 'Khác' },
];

export function ReportQuestionIssueButton({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('wrong_answer');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await reportQuestionIssue(questionId, { reason, description: description || undefined });
      toast('Đã gửi báo lỗi câu hỏi, cảm ơn bạn!');
      setOpen(false);
      setDescription('');
    } catch {
      toast('Gửi báo lỗi thất bại, thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-danger"
        onClick={() => setOpen(true)}
      >
        <Flag className="h-3.5 w-3.5" /> Báo lỗi câu hỏi
      </Button>
      <DialogContent className="tw-scope">
        <DialogHeader>
          <DialogTitle>Báo lỗi câu hỏi</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="tw-scope">
              {REASONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả thêm (không bắt buộc)…"
            rows={3}
            className="w-full rounded-control border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button type="button" onClick={submit} disabled={submitting}>
            {submitting ? 'Đang gửi…' : 'Gửi báo lỗi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
