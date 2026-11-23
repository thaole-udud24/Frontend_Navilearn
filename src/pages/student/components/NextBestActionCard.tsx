import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Card } from '@/components/ui/card';
import { PATHS } from '@/routes/paths';
import { getNextBestAction, startNextBestAction } from '@/services/adaptive';

/** AP-ADP-01/02: real "việc tiếp theo nên làm" recommendation, ranked by BR-40 priority. */
export function NextBestActionCard() {
  const navigate = useNavigate();
  const { data: action, isLoading } = useQuery({
    queryKey: ['adaptive', 'next-best-action'],
    queryFn: getNextBestAction,
  });

  const startMutation = useMutation({
    mutationFn: startNextBestAction,
    onSuccess: () => {
      toast.success('Đã bắt đầu hoạt động được gợi ý');
      navigate(PATHS.student.practice);
    },
    onError: () => toast.error('Không thể bắt đầu hoạt động này'),
  });

  if (isLoading) return null;

  return (
    <Card className="relative flex flex-1 items-center gap-4 overflow-hidden border-accent/20 bg-accent-soft">
      <span
        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-accent/15"
        aria-hidden
      />

      <div className="relative min-w-0 flex-1">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-accent">
          <Sparkles className="h-4 w-4" /> Việc tiếp theo nên làm
        </h3>
        {action ? (
          <>
            <p className="mt-1 text-[15px] font-semibold leading-snug text-foreground">
              Ôn tập chủ đề {action.concept.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{action.reason}</p>
            <button
              type="button"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="mt-3 inline-flex items-center gap-1.5 rounded-control bg-accent px-3.5 py-2 text-xs font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
            >
              {startMutation.isPending ? 'Đang bắt đầu…' : 'Bắt đầu học'}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            Chưa có đủ dữ liệu để gợi ý — hãy làm vài bài luyện tập trước.
          </p>
        )}
      </div>
    </Card>
  );
}
