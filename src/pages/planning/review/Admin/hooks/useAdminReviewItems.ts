import { useQuery } from '@tanstack/react-query';
import { listReviewItems } from '@/services/review';
import { reviewItemKeys } from '@/services/review/queryKeys';
import type { ReviewItemFilters } from '@/services/review/types';

export function useAdminReviewItemList(filters: ReviewItemFilters) {
  return useQuery({
    queryKey: reviewItemKeys.list(filters),
    queryFn: () => listReviewItems(filters),
  });
}
