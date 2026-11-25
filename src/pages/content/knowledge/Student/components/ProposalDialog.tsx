import { useState } from 'react';
import { Check, Loader2, Sparkles, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormDialogTitle } from '@/components/DialogForm';
import { StatusBadge, type StatusBadgeVariant } from '@/components/StatusBadge';
import type { KnowledgeProposal, ProposalStatus } from '@/services/knowledge/types';
import { useKnowledgeProposals, useStructureActions } from '../hooks/useKnowledgeStructure';
import { LEVEL_LABEL } from '../treeUtils';

const STATUS: Record<ProposalStatus, { label: string; variant: StatusBadgeVariant }> = {
  pending: { label: 'Chờ xác nhận', variant: 'warning' },
  confirmed: { label: 'Đã xác nhận', variant: 'success' },
  rejected: { label: 'Đã từ chối', variant: 'neutral' },
};

const INDENT: Record<string, string> = { chapter: 'pl-0', topic: 'pl-5', concept: 'pl-10' };

function ProposalCard({
  proposal,
  busy,
  onConfirm,
  onReject,
}: {
  proposal: KnowledgeProposal;
  busy: boolean;
  onConfirm: () => void;
  onReject: () => void;
}) {
  const { label, variant } = STATUS[proposal.status];
  return (
    <li className="rounded-card border border-border p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{proposal.summary || 'Đề xuất cấu trúc kiến thức'}</p>
        <StatusBadge variant={variant}>{label}</StatusBadge>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{new Date(proposal.createdAt).toLocaleString('vi-VN')}</p>
      <ul className="max-h-56 overflow-y-auto rounded-control bg-muted/50 p-2 text-sm">
        {proposal.nodes.map((n) => (
          <li key={n.ref} className={`py-0.5 ${INDENT[n.level]}`}>
            <span className="mr-1.5 text-xs text-muted-foreground">{LEVEL_LABEL[n.level]}</span>
            <span className={n.level === 'chapter' ? 'font-semibold' : ''}>{n.name}</span>
            {n.description && <span className="block text-xs text-muted-foreground">{n.description}</span>}
          </li>
        ))}
      </ul>
      {proposal.status === 'pending' && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" disabled={busy} onClick={onConfirm}>
            <Check />
            Xác nhận cấu trúc
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={onReject}>
            <X />
            Từ chối
          </Button>
        </div>
      )}
      {proposal.status === 'confirmed' && (
        <p className="mt-2 text-xs text-muted-foreground">Đã thêm {proposal.createdNodeCount} nút mới vào môn học.</p>
      )}
    </li>
  );
}

interface ProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
}

/** FE-STU-33: structures proposed by the AI. Nothing changes until the student confirms one. */
export function ProposalDialog({ open, onOpenChange, subjectId }: ProposalDialogProps) {
  const [hint, setHint] = useState('');
  const proposals = useKnowledgeProposals(subjectId, open);
  const actions = useStructureActions(subjectId);
  const busy = actions.confirmProposal.isPending || actions.rejectProposal.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <FormDialogTitle icon={Sparkles}>Đề xuất cấu trúc từ AI</FormDialogTitle>
          <DialogDescription>
            AI gợi ý chương, chủ đề và khái niệm cho môn học. Cấu trúc của bạn chỉ thay đổi khi bạn xác nhận.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="proposal-hint">
            Gợi ý cho AI
          </label>
          <Input
            id="proposal-hint"
            value={hint}
            maxLength={300}
            placeholder="Gợi ý cho AI (không bắt buộc), ví dụ: tập trung phần ôn thi giữa kỳ"
            onChange={(e) => setHint(e.target.value)}
          />
          <Button
            className="shrink-0"
            disabled={actions.generateProposal.isPending}
            onClick={() => actions.generateProposal.mutate(hint.trim() || undefined)}
          >
            {actions.generateProposal.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Nhờ AI đề xuất
          </Button>
        </div>

        {proposals.isLoading && <p className="text-sm text-muted-foreground">Đang tải đề xuất…</p>}
        {proposals.isError && <p className="text-sm text-danger">Không tải được danh sách đề xuất.</p>}
        {proposals.isSuccess && proposals.data.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Chưa có đề xuất nào.</p>
        )}
        <ul className="flex flex-col gap-3">
          {proposals.data?.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              busy={busy}
              onConfirm={() => actions.confirmProposal.mutate(proposal.id)}
              onReject={() => actions.rejectProposal.mutate(proposal.id)}
            />
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
