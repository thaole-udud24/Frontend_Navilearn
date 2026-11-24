import { request } from '@/utils/request';

/** Saves a Blob as a file through a temporary link. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Downloads a protected file: the request carries the access token, so a plain <a href> would be rejected. */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const { data } = await request.get<Blob>(path, { responseType: 'blob' });
  saveBlob(data, filename);
}
