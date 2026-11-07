import axios from 'axios';
import type { ApiErrorBody } from '@/types/api.d';

export class ApiError extends Error {
  code: string;
  status?: number;
  fieldErrors: ApiErrorBody['errors'];

  constructor(message: string, code: string, status?: number, fieldErrors: ApiErrorBody['errors'] = []) {
    super(message);
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Normalizes any thrown error (axios or otherwise) into an ApiError for uniform handling. */
export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    return new ApiError(
      body?.message ?? error.message ?? 'Unexpected error',
      body?.code ?? 'NETWORK_ERROR',
      error.response?.status,
      body?.errors ?? [],
    );
  }
  return new ApiError(error instanceof Error ? error.message : 'Unexpected error', 'UNKNOWN_ERROR');
}
