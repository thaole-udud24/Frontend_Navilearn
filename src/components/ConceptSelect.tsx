import { useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getConcept, listConcepts } from '@/services/knowledge';
import type { Concept } from '@/services/knowledge/types';

/** Picks a Concept by name from the shared Kho tri thức instead of typing its id by hand.
 * `parentConcept`: pass `null` to only offer top-level concepts (the "môn học" stand-in — see
 * knowledge.model.js, there is no separate Subject entity), an id to offer that concept's direct
 * children, or omit to browse the whole bank.
 *
 * Searches server-side via `q` instead of listing a flat, unsearchable top-N page: with 200+
 * concepts (true for the real seeded "6 môn" data — see E2E_Audit_Report_Phase2.md), a plain list
 * capped at MAX_LIMIT=100 and sorted `{order, createdAt:-1}` can push long-lived concepts (e.g. the
 * root subjects, seeded earliest) out of the page entirely, making them permanently unpickable. */
export function ConceptSelect({
  value,
  onChange,
  parentConcept,
  placeholder = 'Chọn khái niệm…',
  disabled,
}: {
  value: string;
  onChange: (id: string) => void;
  parentConcept?: string | null;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Concept[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!value) {
      setSelectedName(null);
      return;
    }
    getConcept(value)
      .then((c) => setSelectedName(c.name))
      .catch(() => setSelectedName(null));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      listConcepts({
        limit: 50,
        status: 'active',
        q: query.trim() || undefined,
        parentConcept: parentConcept === undefined ? undefined : parentConcept === null ? 'null' : parentConcept,
      }).then((res) => setResults(res.data));
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [open, query, parentConcept]);

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value ? (selectedName ?? '…') : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="tw-scope w-[--radix-popover-trigger-width] p-0">
        <div className="p-2">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên kiến thức…"
          />
        </div>
        <div role="listbox" className="max-h-64 overflow-y-auto border-t border-border p-1">
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted"
          >
            — Chọn —
          </button>
          {results.map((c) => (
            <button
              key={c._id}
              type="button"
              role="option"
              aria-selected={value === c._id}
              onClick={() => {
                onChange(c._id);
                setSelectedName(c.name);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-left text-sm hover:bg-muted"
            >
              <Check className={cn('h-4 w-4 shrink-0', value === c._id ? 'opacity-100' : 'opacity-0')} />
              <span className="truncate">{c.name}</span>
            </button>
          ))}
          {results.length === 0 && (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">Không tìm thấy kiến thức nào.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
