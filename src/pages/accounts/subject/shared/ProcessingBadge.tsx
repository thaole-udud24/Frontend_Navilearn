import { StatusBadge, type StatusBadgeVariant } from '@/components/StatusBadge';
import type { ProcessingStatus } from '@/services/subject/types';

const CONFIG: Record<ProcessingStatus, { label: string; variant: StatusBadgeVariant }> = {
  pending: { label: 'Chờ trích xuất', variant: 'warning' },
  processed: { label: 'Đã xử lý', variant: 'success' },
  error: { label: 'Lỗi xử lý', variant: 'danger' },
};

export function ProcessingBadge({ status }: { status: ProcessingStatus }) {
  const { label, variant } = CONFIG[status];
  return <StatusBadge variant={variant}>{label}</StatusBadge>;
}
