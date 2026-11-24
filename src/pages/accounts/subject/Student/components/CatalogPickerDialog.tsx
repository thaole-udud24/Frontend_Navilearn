import { useState } from 'react';
import { Check, Library, Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormDialogTitle } from '@/components/DialogForm';
import { useDebounce } from '@/hooks/useDebounce';
import type { Subject } from '@/services/subject';
import { useCatalogList } from '../hooks/useSubjects';

interface CatalogPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Catalog subjects the student already copied, so they cannot be picked twice. */
  pickedCatalogIds: Set<string>;
  picking: boolean;
  onPick: (catalogSubject: Subject) => void;
}

/** FE-STU-13: choose a subject from the shared catalog to add to "Môn học của tôi". */
export function CatalogPickerDialog({
  open,
  onOpenChange,
  pickedCatalogIds,
  picking,
  onPick,
}: CatalogPickerDialogProps) {
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim(), 300);
  const catalog = useCatalogList({ q: q || undefined, limit: 50 }, open);
  const items = catalog.data?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <FormDialogTitle icon={Library}>Chọn môn từ danh mục chung</FormDialogTitle>
        </DialogHeader>
        <label className="relative block">
          <span className="sr-only">Tìm môn học</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            placeholder="Tìm môn học…"
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {catalog.isLoading && <p className="text-sm text-muted-foreground">Đang tải danh mục…</p>}
        {catalog.isError && <p className="text-sm text-danger">Không tải được danh mục chung.</p>}
        {catalog.isSuccess && items.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Không có môn học phù hợp.</p>
        )}
        <ul className="flex flex-col gap-2">
          {items.map((subject) => {
            const picked = pickedCatalogIds.has(subject.id);
            return (
              <li
                key={subject.id}
                className="flex items-center justify-between gap-3 rounded-control border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{subject.name}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {subject.description || 'Chưa có mô tả'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={picked ? 'outline' : 'default'}
                  disabled={picked || picking}
                  onClick={() => onPick(subject)}
                >
                  {picked ? <Check /> : <Plus />}
                  {picked ? 'Đã chọn' : 'Chọn'}
                </Button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
