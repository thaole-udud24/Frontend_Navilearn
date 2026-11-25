export type TheoryBlockType = 'heading' | 'paragraph' | 'image' | 'video';

export interface TheoryBlock {
  type: TheoryBlockType;
  content: string;
  caption?: string;
}

const MARKER = 'theory-blocks-v1:';

/** Parses a step/lesson's stored theoryContent into blocks. Content saved before this format
 * existed (a plain string) is treated as one paragraph block instead of an error — nothing is lost. */
export function parseTheoryBlocks(raw?: string): TheoryBlock[] {
  if (!raw) return [];
  if (!raw.startsWith(MARKER)) {
    return raw.trim() ? [{ type: 'paragraph', content: raw }] : [];
  }
  try {
    const parsed = JSON.parse(raw.slice(MARKER.length));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeTheoryBlocks(blocks: TheoryBlock[]): string {
  return `${MARKER}${JSON.stringify(blocks)}`;
}

/** How many theory blocks a giai đoạn/lesson has — shared by every "N khối lý thuyết" summary
 * badge (plan template builder, step tree, lesson admin). */
export function theoryBlockCount(theoryContent?: string) {
  return parseTheoryBlocks(theoryContent).length;
}
