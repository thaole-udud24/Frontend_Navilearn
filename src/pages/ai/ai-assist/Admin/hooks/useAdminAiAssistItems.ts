import { useQuery } from '@tanstack/react-query';
import { listAiAssistItems } from '@/services/ai-assist';
import { aiAssistItemKeys } from '@/services/ai-assist/queryKeys';
import type { AiAssistItemFilters } from '@/services/ai-assist/types';

export function useAdminAiAssistItemList(filters: AiAssistItemFilters) {
  return useQuery({
    queryKey: aiAssistItemKeys.list(filters),
    queryFn: () => listAiAssistItems(filters),
  });
}
