import { useQuery } from '@tanstack/react-query';
import { listTemplateItems } from '@/services/_template';
import { templateItemKeys } from '@/services/_template/queryKeys';
import type { TemplateItemFilters } from '@/services/_template/types';

export function useAdminTemplateItemList(filters: TemplateItemFilters) {
  return useQuery({
    queryKey: templateItemKeys.list(filters),
    queryFn: () => listTemplateItems(filters),
  });
}
