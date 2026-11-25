import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listConcepts } from '@/services/knowledge';
import type { Concept } from '@/services/knowledge/types';

/** Picks a Concept by name from the shared Kho tri thức instead of typing its id by hand.
 * `parentConcept`: pass `null` to only offer top-level concepts (the "môn học" stand-in — see
 * knowledge.model.js, there is no separate Subject entity), an id to offer that concept's direct
 * children, or omit to browse the whole bank. */
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
  const [concepts, setConcepts] = useState<Concept[]>([]);

  useEffect(() => {
    listConcepts({
      limit: 200,
      parentConcept: parentConcept === undefined ? undefined : parentConcept === null ? 'null' : parentConcept,
    }).then((res) => setConcepts(res.data));
  }, [parentConcept]);

  return (
    <Select value={value || '__none__'} onValueChange={(v) => onChange(v === '__none__' ? '' : v)} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="tw-scope">
        <SelectItem value="__none__">— Chọn —</SelectItem>
        {concepts.map((c) => (
          <SelectItem key={c._id} value={c._id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
