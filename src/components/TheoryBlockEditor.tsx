import { AlignLeft, ChevronDown, ChevronUp, Heading, Image as ImageIcon, Trash2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TheoryBlockViewer } from '@/components/TheoryBlockViewer';
import {
  parseTheoryBlocks,
  serializeTheoryBlocks,
  type TheoryBlock,
  type TheoryBlockType,
} from '@/lib/theoryBlocks';

const BLOCK_META: Record<TheoryBlockType, { label: string; icon: typeof Heading; placeholder: string }> = {
  heading: { label: 'Tiêu đề', icon: Heading, placeholder: 'Tiêu đề phần này' },
  paragraph: { label: 'Đoạn văn', icon: AlignLeft, placeholder: 'Nội dung giảng giải…' },
  image: { label: 'Hình ảnh', icon: ImageIcon, placeholder: 'Đường dẫn hình ảnh (URL)' },
  video: { label: 'Video', icon: Video, placeholder: 'Đường dẫn video (YouTube, v.v.)' },
};

/** Fully controlled block editor for "soạn bài giảng" content — a sequence of tiêu đề/đoạn
 * văn/hình ảnh/video blocks, reorderable, each rendered as its own card with a real preview
 * below (TheoryBlockViewer) so the admin sees exactly what the student will see. No local block
 * state — always derives from `value` and writes back through `onChange`, so it can't go stale
 * when the caller loads different content into the same mounted editor. */
export function TheoryBlockEditor({ value, onChange }: { value?: string; onChange: (raw: string) => void }) {
  const blocks = parseTheoryBlocks(value);
  const commit = (next: TheoryBlock[]) => onChange(serializeTheoryBlocks(next));

  const addBlock = (type: TheoryBlockType) => commit([...blocks, { type, content: '' }]);
  const updateBlock = (i: number, patch: Partial<TheoryBlock>) =>
    commit(blocks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  const removeBlock = (i: number) => commit(blocks.filter((_, idx) => idx !== i));
  const moveBlock = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  return (
    <div className="flex flex-col gap-3">
      {blocks.length === 0 && (
        <p className="rounded-control border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
          Chưa có nội dung — thêm khối bên dưới (không bắt buộc).
        </p>
      )}
      {blocks.map((b, i) => {
        const meta = BLOCK_META[b.type];
        const isMedia = b.type === 'image' || b.type === 'video';
        return (
          <div key={i} className="flex flex-col gap-2 rounded-card border border-border bg-card p-3 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-badge bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                <meta.icon className="h-3.5 w-3.5" /> {meta.label}
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => moveBlock(i, -1)}
                  className="rounded-control p-1 hover:bg-muted disabled:opacity-30"
                  title="Chuyển lên"
                >
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  disabled={i === blocks.length - 1}
                  onClick={() => moveBlock(i, 1)}
                  className="rounded-control p-1 hover:bg-muted disabled:opacity-30"
                  title="Chuyển xuống"
                >
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(i)}
                  className="rounded-control p-1 hover:bg-danger/10"
                  title="Xoá khối"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-danger" />
                </button>
              </div>
            </div>

            {b.type === 'heading' ? (
              <Input
                value={b.content}
                onChange={(e) => updateBlock(i, { content: e.target.value })}
                placeholder={meta.placeholder}
              />
            ) : b.type === 'paragraph' ? (
              <textarea
                value={b.content}
                onChange={(e) => updateBlock(i, { content: e.target.value })}
                placeholder={meta.placeholder}
                rows={3}
                className="w-full rounded-control border border-input bg-card px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            ) : (
              <>
                <Input
                  value={b.content}
                  onChange={(e) => updateBlock(i, { content: e.target.value })}
                  placeholder={meta.placeholder}
                />
                <Input
                  value={b.caption ?? ''}
                  onChange={(e) => updateBlock(i, { caption: e.target.value })}
                  placeholder="Chú thích (không bắt buộc)"
                />
              </>
            )}
            {isMedia && b.content.trim() && (
              <TheoryBlockViewer raw={serializeTheoryBlocks([b])} className="pt-1" />
            )}
          </div>
        );
      })}
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(BLOCK_META) as TheoryBlockType[]).map((type) => {
          const meta = BLOCK_META[type];
          return (
            <Button key={type} type="button" variant="outline" size="sm" onClick={() => addBlock(type)}>
              <meta.icon className="h-3.5 w-3.5" /> {meta.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
