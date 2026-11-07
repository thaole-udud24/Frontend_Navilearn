import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createReviewItem, listReviewItems } from '@/services/review';
import { reviewItemKeys } from '@/services/review/queryKeys';
import type { CreateReviewItemInput, ReviewItemFilters } from '@/services/review/types';

export function useReviewItemList(filters: ReviewItemFilters) {
  return useQuery({
    queryKey: reviewItemKeys.list(filters),
    queryFn: () => listReviewItems(filters),
  });
}

export function useCreateReviewItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewItemInput) => createReviewItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reviewItemKeys.all }),
  });
}
