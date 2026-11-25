import { parseTheoryBlocks } from '@/lib/theoryBlocks';
import { cn } from '@/lib/utils';

function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return null;
}

/** Read-only renderer for a step's theory content — shared by the admin preview
 * (TemplateStepTree) and the student roadmap (RoadmapTree) so both read the same blocks. */
export function TheoryBlockViewer({ raw, className }: { raw?: string; className?: string }) {
  const blocks = parseTheoryBlocks(raw);
  if (blocks.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {blocks.map((b, i) => {
        if (b.type === 'heading') {
          return (
            <h4 key={i} className="text-sm font-semibold text-foreground">
              {b.content}
            </h4>
          );
        }
        if (b.type === 'image') {
          return (
            <figure key={i} className="flex flex-col gap-1">
              <img
                src={b.content}
                alt={b.caption ?? ''}
                className="max-h-56 w-full rounded-control border border-border object-cover"
              />
              {b.caption && <figcaption className="text-xs text-muted-foreground">{b.caption}</figcaption>}
            </figure>
          );
        }
        if (b.type === 'video') {
          const embed = toEmbedUrl(b.content);
          return (
            <figure key={i} className="flex flex-col gap-1">
              {embed ? (
                <div className="aspect-video w-full overflow-hidden rounded-control border border-border">
                  <iframe src={embed} title="Video bài giảng" className="h-full w-full" allowFullScreen />
                </div>
              ) : (
                <a href={b.content} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                  {b.content}
                </a>
              )}
              {b.caption && <figcaption className="text-xs text-muted-foreground">{b.caption}</figcaption>}
            </figure>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap text-sm text-foreground">
            {b.content}
          </p>
        );
      })}
    </div>
  );
}
