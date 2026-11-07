import { toApiError } from '@/services/apiError';

/** Extracts a user-displayable message from any React Query error. */
export function useQueryErrorMessage(error: unknown): string | null {
  if (!error) return null;
  return toApiError(error).message;
}
