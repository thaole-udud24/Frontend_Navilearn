import { request } from '@/utils/request';

/** Turns a backend-relative path such as "/uploads/avatars/x.png" into an absolute URL the browser can load. */
export function assetUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  const apiBase = request.defaults.baseURL ?? '';
  return `${apiBase.replace(/\/api\/v\d+\/?$/, '')}${path}`;
}
