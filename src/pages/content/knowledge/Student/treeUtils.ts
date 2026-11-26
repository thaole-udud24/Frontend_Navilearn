import type { KnowledgeNode, NodeLevel } from '@/services/knowledge/types';

export const LEVEL_LABEL: Record<NodeLevel, string> = {
  chapter: 'Chương',
  topic: 'Chủ đề',
  concept: 'Khái niệm',
};

/** Level of a child created under a node of the given level (null = concepts are the last level). */
export const CHILD_LEVEL: Record<NodeLevel, NodeLevel | null> = {
  chapter: 'topic',
  topic: 'concept',
  concept: null,
};

export interface TreeNode extends KnowledgeNode {
  children: TreeNode[];
}

const byOrder = (a: KnowledgeNode, b: KnowledgeNode) => a.order - b.order || a.name.localeCompare(b.name, 'vi');

/** Flat node list -> forest. Nodes whose parent is missing (e.g. filtered out) become roots. */
export function buildTree(nodes: KnowledgeNode[]): TreeNode[] {
  const byId = new Map<string, TreeNode>(nodes.map((n) => [n.id, { ...n, children: [] }]));
  const roots: TreeNode[] = [];
  byId.forEach((node) => {
    const parent = node.parentNode ? byId.get(node.parentNode) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  const sortDeep = (list: TreeNode[]) => {
    list.sort(byOrder);
    list.forEach((n) => sortDeep(n.children));
  };
  sortDeep(roots);
  return roots;
}

/** Names of the ancestors of a node, outermost first. */
export function pathOf(node: KnowledgeNode, nodes: KnowledgeNode[]): string[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const names: string[] = [];
  let cursor = node.parentNode ? byId.get(node.parentNode) : undefined;
  while (cursor) {
    names.unshift(cursor.name);
    cursor = cursor.parentNode ? byId.get(cursor.parentNode) : undefined;
  }
  return names;
}

/** Concepts that list `nodeId` as a prerequisite. */
export const dependentsOf = (nodeId: string, nodes: KnowledgeNode[]): KnowledgeNode[] =>
  nodes.filter((n) => n.prerequisites.includes(nodeId));

/** Every concept that depends on `nodeId`, directly or through a chain — these can never become its prerequisite. */
export function transitiveDependents(nodeId: string, nodes: KnowledgeNode[]): Set<string> {
  const found = new Set<string>();
  const stack = [nodeId];
  while (stack.length) {
    const current = stack.pop() as string;
    dependentsOf(current, nodes).forEach((n) => {
      if (!found.has(n.id)) {
        found.add(n.id);
        stack.push(n.id);
      }
    });
  }
  return found;
}

export interface GraphPosition {
  id: string;
  x: number;
  y: number;
  layer: number;
}

const COLUMN_WIDTH = 240;
const ROW_HEIGHT = 84;

/**
 * Left-to-right layout of the prerequisite graph: a concept sits one column to the right of its deepest
 * prerequisite. Only concepts that take part in at least one relation are laid out. Cycles cannot be
 * created through the API, but the walk is guarded anyway so bad data can never loop forever.
 */
export function layoutPrerequisites(concepts: KnowledgeNode[]): GraphPosition[] {
  const byId = new Map(concepts.map((c) => [c.id, c]));
  const related = new Set<string>();
  concepts.forEach((c) => {
    c.prerequisites.filter((p) => byId.has(p)).forEach((p) => {
      related.add(c.id);
      related.add(p);
    });
  });

  const layers = new Map<string, number>();
  const layerOf = (id: string, visiting: Set<string>): number => {
    const known = layers.get(id);
    if (known !== undefined) return known;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const prereqs = (byId.get(id)?.prerequisites ?? []).filter((p) => byId.has(p));
    const layer = prereqs.length ? 1 + Math.max(...prereqs.map((p) => layerOf(p, visiting))) : 0;
    visiting.delete(id);
    layers.set(id, layer);
    return layer;
  };

  const rows = new Map<number, number>();
  return concepts
    .filter((c) => related.has(c.id))
    .sort(byOrder)
    .map((c) => {
      const layer = layerOf(c.id, new Set());
      const row = rows.get(layer) ?? 0;
      rows.set(layer, row + 1);
      return { id: c.id, layer, x: layer * COLUMN_WIDTH, y: row * ROW_HEIGHT };
    });
}
