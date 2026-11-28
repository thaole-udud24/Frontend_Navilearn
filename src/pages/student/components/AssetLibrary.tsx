import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Eye, FileText, Search } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { SubjectFilterPill } from '@/components/GlobalSubjectFilter';
import { useAuthStore } from '@/hooks/useAuth';
import { useSelectedSubject } from '@/hooks/useSubjectStore';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
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
  return (
    <div className="flex flex-col justify-between gap-3 rounded-card border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <FileText className="h-5 w-5" />
          </span>
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            {FORMAT_LABEL[format]} · {formatSize(asset.sizeBytes)}
          </span>
        </div>

        <div>
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground">{asset.title}</h3>
          {conceptName(asset.concept) && (
            <p className="mt-0.5 text-xs font-medium text-primary">{conceptName(asset.concept)}</p>
          )}
          {asset.description && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {asset.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/70 pt-3">
        <span className="text-xs text-muted-foreground">
          Cập nhật {new Date(asset.updatedAt).toLocaleDateString('vi-VN')}
        </span>
        <Button
          type="button"
          className="w-full"
          onClick={() => window.open(`${apiOrigin}${asset.fileUrl}`, '_blank')}
        >
          <Eye className="h-4 w-4" /> Xem tài liệu
        </Button>
      </div>
    </div>
  );
}

function DocumentCardSkeleton() {
  return <div className="h-52 animate-pulse rounded-card border border-border bg-muted/40" />;
}

export interface AssetLibraryProps {
  title: string;
  breadcrumbLabel: string;
  description: string;
  emptyHint: string;
  scopeConceptIds?: string[];
}

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
  const { selectedSubjectId } = useSelectedSubject();
  const [search, setSearch] = useState('');
  const [format, setFormat] = useState<FileFormat>('all');

  const scoped = scopeConceptIds !== undefined;
  const scopeSet = useMemo(() => new Set(scopeConceptIds ?? []), [scopeConceptIds]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['asset-library', selectedSubjectId ?? 'all'],
    queryFn: () => listAssets({ limit: 100, subjectId: selectedSubjectId ?? undefined }),
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
      {/* Header row with compact subject filter in the top-right */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        <SubjectFilterPill />
      </div>

      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-card px-4 py-2.5 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative w-64 sm:w-72">
            <span className="sr-only">Tìm tài liệu</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên tài liệu..."
              className="h-9 w-full rounded-control border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <div className="flex items-center gap-1 rounded-control bg-muted/60 p-1">
            {(['all', 'pdf', 'docx'] as FileFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={cn(
                  'rounded-[6px] px-3 py-1 text-xs font-semibold transition-all',
                  format === f
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f === 'all' ? 'Tất cả định dạng' : FORMAT_LABEL[f]}
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground">{documents.length} tài liệu</span>
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
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-card p-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
            <FileText className="h-8 w-8" />
          </span>
          <h2 className="text-lg font-bold text-foreground">Chưa có tài liệu nào</h2>
          <p className="max-w-sm text-sm text-muted-foreground">{emptyHint}</p>
        </div>
      )}

      {!isLoading && !isError && documents.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <DocumentCard key={doc._id} asset={doc} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
