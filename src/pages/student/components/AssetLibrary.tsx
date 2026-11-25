import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Download, FileText, Search } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { ConceptSelect } from '@/components/ConceptSelect';
import { cn } from '@/lib/utils';
import { listAssets } from '@/services/asset';
import type { Asset } from '@/services/asset/types';
import { apiOrigin } from '@/utils/request';

const conceptName = (c: Asset['concept']) => (!c ? '' : typeof c === 'string' ? c : c.name);
const conceptId = (c: Asset['concept']) => (!c ? null : typeof c === 'string' ? c : c._id);

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type FileFormat = 'all' | 'pdf' | 'docx';
const FORMAT_LABEL: Record<Exclude<FileFormat, 'all'>, string> = { pdf: 'PDF', docx: 'DOCX' };

function formatOf(mimeType: string): Exclude<FileFormat, 'all'> {
  return mimeType === 'application/pdf' ? 'pdf' : 'docx';
}

function DocumentCard({ asset }: { asset: Asset }) {
  const format = formatOf(asset.mimeType);
  const tone = format === 'pdf' ? 'blush' : 'blue';
  return (
    <div
      className={cn(
        'group relative flex flex-col gap-2 overflow-hidden rounded-card border p-4 shadow-card transition-shadow hover:shadow-lg',
        tone === 'blush'
          ? 'border-blush-foreground/20 bg-gradient-to-br from-blush/40 to-card'
          : 'border-primary/15 bg-gradient-to-br from-primary-soft to-card',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card shadow-card',
            tone === 'blush' ? 'text-blush-foreground' : 'text-primary',
          )}
        >
          <FileText className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-semibold leading-snug text-foreground">{asset.title}</p>
          {conceptName(asset.concept) && (
            <p className="text-xs text-muted-foreground">{conceptName(asset.concept)}</p>
          )}
        </div>
      </div>

      {asset.description && <p className="line-clamp-2 text-xs text-muted-foreground">{asset.description}</p>}

      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-badge bg-card/70 px-2 py-0.5 font-semibold">{FORMAT_LABEL[format]}</span>
        <span>{formatSize(asset.sizeBytes)}</span>
        <span>· Cập nhật {new Date(asset.updatedAt).toLocaleDateString('vi-VN')}</span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-1 self-start bg-card"
        onClick={() => window.open(`${apiOrigin}${asset.fileUrl}`, '_blank')}
      >
        <Download className="h-3.5 w-3.5" /> Xem / Tải xuống
      </Button>
    </div>
  );
}

function DocumentCardSkeleton() {
  return <div className="h-40 animate-pulse rounded-card border border-border bg-muted/40" />;
}

export interface AssetLibraryProps {
  title: string;
  breadcrumbLabel: string;
  description: string;
  emptyHint: string;
  /** Restrict results to these concept ids (e.g. the student's own enrolled subjects). Omit to
   * show the whole shared library. An empty array (subjects loaded, but none yet) short-circuits
   * to the empty state instead of querying with no filter — it must never fall back to "show all". */
  scopeConceptIds?: string[];
}

/** Read-only document library shared by "Tài liệu học tập" and "Tài nguyên khoá" — same backend
 * list (GET /assets, student-readable, published docs only), the only difference is whether
 * results are scoped to the student's own enrolled subjects. */
export function AssetLibrary({
  title,
  breadcrumbLabel,
  description,
  emptyHint,
  scopeConceptIds,
}: AssetLibraryProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [concept, setConcept] = useState('');
  const [format, setFormat] = useState<FileFormat>('all');

  const scoped = scopeConceptIds !== undefined;
  const scopeSet = useMemo(() => new Set(scopeConceptIds ?? []), [scopeConceptIds]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['asset-library', concept],
    queryFn: () => listAssets({ limit: 100, concept: concept || undefined }),
    // When scoped to "my subjects" and the student has none yet, don't fetch the whole shared
    // library by mistake — there is nothing to show until they add a subject.
    enabled: !scoped || scopeSet.size > 0,
  });

  const documents = useMemo(() => {
    let items = data?.data ?? [];
    if (scoped) items = items.filter((a) => scopeSet.has(conceptId(a.concept) ?? ''));
    if (format !== 'all') items = items.filter((a) => formatOf(a.mimeType) === format);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((a) => a.title.toLowerCase().includes(q));
    }
    return items;
  }, [data, scoped, scopeSet, format, search]);

  return (
    <AppShell
      menu={studentMenu}
      title={title}
      breadcrumb={['Trang chủ', breadcrumbLabel]}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <h1 className="mb-1 text-xl font-bold text-foreground">{title}</h1>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative w-full max-w-xs">
          <span className="sr-only">Tìm tài liệu</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên tài liệu…"
            className="h-10 w-full rounded-control border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        {!scoped && (
          <div className="w-full max-w-xs">
            <ConceptSelect value={concept} onChange={setConcept} placeholder="Lọc theo môn học" />
          </div>
        )}
        <div className="flex gap-1 rounded-control border border-border bg-muted/40 p-1">
          {(['all', 'pdf', 'docx'] as FileFormat[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={cn(
                'rounded-control px-2.5 py-1 text-xs font-medium transition-colors',
                format === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {f === 'all' ? 'Tất cả định dạng' : FORMAT_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <DocumentCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger">
            <AlertTriangle className="h-8 w-8" />
          </span>
          <h2 className="text-lg font-bold text-foreground">Không tải được danh sách tài liệu</h2>
          <p className="max-w-sm text-sm text-muted-foreground">Vui lòng kiểm tra kết nối mạng và thử lại.</p>
          <Button type="button" variant="outline" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      )}

      {!isLoading && !isError && documents.length === 0 && (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
            <FileText className="h-8 w-8" />
          </span>
          <h2 className="text-lg font-bold text-foreground">Chưa có tài liệu nào</h2>
          <p className="max-w-sm text-sm text-muted-foreground">{emptyHint}</p>
        </div>
      )}

      {!isLoading && !isError && documents.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((a) => (
            <DocumentCard key={a._id} asset={a} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
