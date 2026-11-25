import { Archive, ArchiveRestore, Link2, Network, Pencil, Plus, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import type { KnowledgeNode } from '@/services/knowledge/types';
import { useStructureActions } from '../hooks/useKnowledgeStructure';
import { CHILD_LEVEL, LEVEL_LABEL, dependentsOf, pathOf } from '../treeUtils';
import { NotesSection } from './NotesSection';

interface NodeDetailPanelProps {
  node: KnowledgeNode;
  nodes: KnowledgeNode[];
  onSelect: (id: string) => void;
  onAddChild: (parent: KnowledgeNode) => void;
  onEdit: (node: KnowledgeNode) => void;
  onEditPrerequisites: (node: KnowledgeNode) => void;
  onShowGraph: () => void;
}

function RelationList({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: KnowledgeNode[];
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Không có.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className="rounded-badge bg-primary-soft px-2.5 py-1 text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** FE-STU-27: details of the selected node — actions, prerequisites and notes. */
export function NodeDetailPanel({
  node,
  nodes,
  onSelect,
  onAddChild,
  onEdit,
  onEditPrerequisites,
  onShowGraph,
}: NodeDetailPanelProps) {
  const actions = useStructureActions(node.subject);
  const archived = node.status === 'archived';
  const childLevel = CHILD_LEVEL[node.level];
  const path = pathOf(node, nodes);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const prerequisites = node.prerequisites.flatMap((id) => (byId.get(id) ? [byId.get(id) as KnowledgeNode] : []));
  const dependents = dependentsOf(node.id, nodes);

  return (
    <div className="flex flex-col gap-5">
      <div>
        {path.length > 0 && <p className="mb-1 text-xs text-muted-foreground">{path.join(' › ')}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold">{node.name}</h2>
          <StatusBadge variant="info">{LEVEL_LABEL[node.level]}</StatusBadge>
          {archived && <StatusBadge variant="neutral">Đã ngừng sử dụng</StatusBadge>}
          {node.examFocus && (
            <span className="flex items-center gap-1 text-xs font-medium text-warning">
              <Star className="h-3.5 w-3.5 fill-warning" />
              Trọng tâm kỳ thi
            </span>
          )}
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{node.description || 'Chưa có mô tả.'}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {!archived && childLevel && (
          <Button size="sm" onClick={() => onAddChild(node)}>
            <Plus />
            Thêm {LEVEL_LABEL[childLevel].toLowerCase()}
          </Button>
        )}
        {!archived && (
          <>
            <Button size="sm" variant="outline" onClick={() => onEdit(node)}>
              <Pencil />
              Chỉnh sửa
            </Button>
            <Button
              size="sm"
              variant="outline"
              aria-pressed={node.examFocus}
              disabled={actions.updateNode.isPending}
              onClick={() => actions.updateNode.mutate({ id: node.id, input: { examFocus: !node.examFocus } })}
            >
              <Star className={node.examFocus ? 'fill-warning text-warning' : ''} />
              {node.examFocus ? 'Bỏ trọng tâm' : 'Đánh dấu trọng tâm'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => actions.archiveNode.mutate(node.id)}>
              <Archive />
              Ngừng sử dụng
            </Button>
          </>
        )}
        {archived && (
          <Button size="sm" variant="outline" onClick={() => actions.restoreNode.mutate(node.id)}>
            <ArchiveRestore />
            Khôi phục
          </Button>
        )}
      </div>

      {node.level === 'concept' && (
        <section className="flex flex-col gap-3 rounded-card border border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Quan hệ tiên quyết</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onShowGraph}>
                <Network />
                Sơ đồ
              </Button>
              {!archived && (
                <Button size="sm" variant="outline" onClick={() => onEditPrerequisites(node)}>
                  <Link2 />
                  Thiết lập
                </Button>
              )}
            </div>
          </div>
          <RelationList title="Cần học trước" items={prerequisites} onSelect={onSelect} />
          <RelationList title="Là tiên quyết của" items={dependents} onSelect={onSelect} />
        </section>
      )}

      <NotesSection node={node} />
    </div>
  );
}
