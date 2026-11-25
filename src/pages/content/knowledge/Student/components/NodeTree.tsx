import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, FileText, Layers, MessageSquareText, Star } from 'lucide-react';

import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import type { NodeLevel } from '@/services/knowledge/types';
import { LEVEL_LABEL, type TreeNode } from '../treeUtils';

const LEVEL_ICON: Record<NodeLevel, typeof Layers> = {
  chapter: BookOpen,
  topic: Layers,
  concept: FileText,
};

interface NodeTreeProps {
  roots: TreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function TreeRow({
  node,
  depth,
  collapsed,
  toggle,
  selectedId,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  collapsed: Set<string>;
  toggle: (id: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const Icon = LEVEL_ICON[node.level];
  const hasChildren = node.children.length > 0;
  const open = !collapsed.has(node.id);
  const selected = node.id === selectedId;

  return (
    <li role="treeitem" aria-expanded={hasChildren ? open : undefined} aria-selected={selected}>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-control pr-2 hover:bg-muted',
          selected && 'bg-primary-soft hover:bg-primary-soft',
          node.status === 'archived' && 'opacity-60',
        )}
        style={{ paddingLeft: depth * 16 }}
      >
        <button
          type="button"
          aria-label={open ? 'Thu gọn' : 'Mở rộng'}
          tabIndex={hasChildren ? 0 : -1}
          onClick={() => hasChildren && toggle(node.id)}
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground',
            !hasChildren && 'invisible',
          )}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-label={LEVEL_LABEL[node.level]} />
          <span className={cn('truncate', node.level === 'chapter' ? 'font-semibold' : 'font-medium')}>{node.name}</span>
          {node.examFocus && <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" aria-label="Trọng tâm kỳ thi" />}
          {node.noteCount > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
              <MessageSquareText className="h-3.5 w-3.5" />
              {node.noteCount}
            </span>
          )}
          {node.status === 'archived' && <StatusBadge variant="neutral">Đã ngừng</StatusBadge>}
        </button>
      </div>
      {hasChildren && open && (
        <ul role="group">
          {node.children.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              collapsed={collapsed}
              toggle={toggle}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/** FE-STU-23: the student's chapter → topic → concept tree. */
export function NodeTree({ roots, selectedId, onSelect }: NodeTreeProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setCollapsed((old) => {
      const next = new Set(old);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <ul role="tree" aria-label="Cấu trúc kiến thức" className="flex flex-col gap-0.5">
      {roots.map((root) => (
        <TreeRow
          key={root.id}
          node={root}
          depth={0}
          collapsed={collapsed}
          toggle={toggle}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}
