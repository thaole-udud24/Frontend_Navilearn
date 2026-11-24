import { Trash2 } from 'lucide-react';
import { AddButton } from '@/components/ui/add-button';
import { Input } from '@/components/ui/input';

/** Simple repeatable text-list editor for "objectives" ("Sau buổi/bài này bạn có thể…") — same
 * +/remove pattern as QuestionPicker's option list — capped at 6 lines to match the BE schemas
 * that embed this list (plan-template step, planning session, lesson). */
export function ObjectivesEditor({
  value,
  onChange,
  label = 'Mục tiêu — "Sau buổi này bạn có thể…"',
}: {
  value?: string[];
  onChange: (next: string[]) => void;
  label?: string;
}) {
  const objectives = value ?? [];
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      {objectives.map((o, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={o}
            onChange={(e) => onChange(objectives.map((x, idx) => (idx === i ? e.target.value : x)))}
            placeholder={`Mục tiêu ${i + 1}`}
          />
          <button type="button" onClick={() => onChange(objectives.filter((_, idx) => idx !== i))}>
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-danger" />
          </button>
        </div>
      ))}
      {objectives.length < 6 && (
        <AddButton
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => onChange([...objectives, ''])}
        >
          Thêm mục tiêu
        </AddButton>
      )}
    </div>
  );
}
