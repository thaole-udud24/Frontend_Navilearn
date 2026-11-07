import { useQuery } from '@tanstack/react-query';
import { listAiConfigItems } from '@/services/ai-config';
import { aiConfigItemKeys } from '@/services/ai-config/queryKeys';
import type { AiConfigItemFilters } from '@/services/ai-config/types';

export function useAdminAiConfigItemList(filters: AiConfigItemFilters) {
  return useQuery({
    queryKey: aiConfigItemKeys.list(filters),
    queryFn: () => listAiConfigItems(filters),
  });
}
