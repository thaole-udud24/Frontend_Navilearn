import { useMemo } from 'react';
import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { FormDialogTitle } from '@/components/DialogForm';
import type { KnowledgeNode } from '@/services/knowledge/types';
import { layoutPrerequisites } from '../treeUtils';

interface PrerequisiteGraphProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: KnowledgeNode[];
  /** Concept to highlight (the one selected in the tree). */
  highlightId?: string | null;
}

/** FE-STU-31: prerequisite relations between the concepts of a course, drawn left (learn first) to right. */
export function PrerequisiteGraph({ open, onOpenChange, nodes, highlightId }: PrerequisiteGraphProps) {
  const { flowNodes, flowEdges } = useMemo(() => {
    const concepts = nodes.filter((n) => n.level === 'concept' && n.status === 'active');
    const byId = new Map(concepts.map((c) => [c.id, c]));
    const positions = layoutPrerequisites(concepts);
    const flowNodes: Node[] = positions.map((p) => ({
      id: p.id,
      position: { x: p.x, y: p.y },
      data: { label: byId.get(p.id)?.name ?? '' },
      draggable: false,
      style: {
        width: 190,
        fontSize: 13,
        borderRadius: 8,
        border: p.id === highlightId ? '2px solid var(--primary)' : '1px solid var(--border)',
        background: p.id === highlightId ? 'var(--primary-soft)' : 'var(--card)',
      },
    }));
    const flowEdges: Edge[] = concepts.flatMap((c) =>
      c.prerequisites
        .filter((p) => byId.has(p))
        .map((p) => ({
          id: `${p}->${c.id}`,
          source: p,
          target: c.id,
          markerEnd: { type: MarkerType.ArrowClosed },
        })),
    );
    return { flowNodes, flowEdges };
  }, [nodes, highlightId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <FormDialogTitle icon={Network}>Sơ đồ quan hệ tiên quyết</FormDialogTitle>
          <DialogDescription>Mũi tên đi từ khái niệm cần học trước tới khái niệm phụ thuộc vào nó.</DialogDescription>
        </DialogHeader>
        {flowNodes.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Chưa có quan hệ tiên quyết nào giữa các khái niệm.
          </p>
        ) : (
          <div className="h-[460px] rounded-control border border-border" aria-label="Sơ đồ quan hệ tiên quyết">
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              proOptions={{ hideAttribution: true }}
            >
              <Background />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
