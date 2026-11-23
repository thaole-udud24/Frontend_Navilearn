/**
 * A step's theory content is authored as content blocks (heading/paragraph/image/video) but the
 * wire format stays a single string — `theoryContent` — so the admin/planning schemas and the
 * copy-on-apply flow (plan-template -> student Plan session) never needed to change. The blocks
 * are JSON-encoded into that string; legacy plain-text content (written before this existed)
 * parses as a single paragraph block so old templates keep rendering correctly.
 */
export type TheoryBlockType = 'heading' | 'paragraph' | 'image' | 'video';

export interface TheoryBlock {
  type: TheoryBlockType;
  /** Text for heading/paragraph, URL for image/video. */
  content: string;
}

const MARKER = 'theory-blocks-v1:';

export function serializeTheoryBlocks(blocks: TheoryBlock[]): string {
  const nonEmpty = blocks.filter((b) => b.content.trim());
  if (nonEmpty.length === 0) return '';
  return MARKER + JSON.stringify(nonEmpty);
}

export function parseTheoryBlocks(raw: string | undefined): TheoryBlock[] {
  if (!raw) return [];
  if (!raw.startsWith(MARKER)) return [{ type: 'paragraph', content: raw }];
  try {
    const parsed = JSON.parse(raw.slice(MARKER.length));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b): b is TheoryBlock => b && typeof b.content === 'string' && typeof b.type === 'string',
    );
  } catch {
    return [{ type: 'paragraph', content: raw }];
  }
}
