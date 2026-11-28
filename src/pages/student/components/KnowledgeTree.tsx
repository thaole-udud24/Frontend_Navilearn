import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Circle,
  Lock,
  LockOpen,
  Maximize,
  Minimize,
  Minus,
  Plus,
  RotateCcw,
  Target,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Concept } from '@/services/knowledge/types';
import type { Mastery } from '@/services/mastery/types';

export type NodeState = 'locked' | 'available' | 'learning' | 'completed' | 'decay';

const STATE_META: Record<
  NodeState,
  { label: string; icon: LucideIcon; card: string; dot: string; ring: string }
> = {
  locked: {
    label: 'Chưa học (đang khoá)',
    icon: Lock,
    card: 'border-border bg-muted/40 opacity-80 grayscale-[30%]',
    dot: 'bg-muted-foreground/50',
    ring: 'ring-border',
  },
  available: {
    label: 'Chưa học',
    icon: Circle,
    card: 'border-border bg-card',
    dot: 'bg-muted-foreground',
    ring: 'ring-border',
  },
  learning: {
    label: 'Đang học',
    icon: BookOpen,
    card: 'border-primary/50 bg-gradient-to-br from-primary-soft to-card',
    dot: 'bg-primary',
    ring: 'ring-primary/30',
  },
  completed: {
    label: 'Đã hoàn thành',
    icon: CheckCircle2,
    card: 'border-success/50 bg-gradient-to-br from-success/10 to-card',
    dot: 'bg-success',
    ring: 'ring-success/30',
  },
  decay: {
    label: 'Nguy cơ quên',
    icon: AlertTriangle,
    card: 'border-warning/50 bg-gradient-to-br from-warning/10 to-card',
    dot: 'bg-warning',
    ring: 'ring-warning/30',
  },
};

export function stateMeta(state: NodeState) {
  return STATE_META[state];
}

/** Derives each concept's learning state from its own mastery record, and — when it has none yet —
 * from whether its in-view prerequisites are already mastered. Never invents a state the backend
 * data doesn't support; a concept with no mastery record and unmet prerequisites is simply "locked". */
export function deriveNodeStates(
  nodes: Concept[],
  masteryByConcept: Map<string, Mastery>,
): Map<string, NodeState> {
  const nodeIds = new Set(nodes.map((n) => n._id));
  const states = new Map<string, NodeState>();

  for (const node of nodes) {
    const mastery = masteryByConcept.get(node._id);
    if (mastery) {
      if (mastery.learningState === 'DECAY_RISK') states.set(node._id, 'decay');
      else if (mastery.learningState === 'UNDERSTOOD' || mastery.learningState === 'APPLIED')
        states.set(node._id, 'completed');
      else states.set(node._id, 'learning');
      continue;
    }
    const prereqIdsInView = (node.prerequisites ?? [])
      .map((p) => (typeof p === 'string' ? p : p._id))
      .filter((id) => nodeIds.has(id));
    const allPrereqsMastered = prereqIdsInView.every((id) => {
      const m = masteryByConcept.get(id);
      return m?.learningState === 'UNDERSTOOD' || m?.learningState === 'APPLIED';
    });
    states.set(node._id, allPrereqsMastered ? 'available' : 'locked');
  }
  return states;
}

// Pastel Knowledge Atlas cluster palette (background / accent / foreground), assigned stably by
// hashing the cluster id — never random per render, never per status (status is a separate channel:
// icon + border + progress bar, see STATUS_COLOR below), so two renders of the same topic always
// get the same color and a locked concept still reads as "this topic", not as a grey placeholder.
const CLUSTER_PALETTE = [
  { bg: '#DFE9FF', accent: '#7499E8', fg: '#315AA3' },
  { bg: '#E9E0FC', accent: '#A58BDD', fg: '#62469F' },
  { bg: '#DDF3E9', accent: '#73BEA1', fg: '#26775D' },
  { bg: '#FCE8D8', accent: '#E5AA78', fg: '#A46534' },
  { bg: '#F7E1ED', accent: '#D697BA', fg: '#9D507C' },
  { bg: '#DCF1F6', accent: '#76BCCB', fg: '#327D91' },
];
function clusterForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return CLUSTER_PALETTE[hash % CLUSTER_PALETTE.length];
}

const STATUS_COLOR: Record<NodeState, string> = {
  completed: '#35B88A',
  learning: '#527CE8',
  decay: '#E79B48',
  available: '#75839D',
  locked: '#A2A9BA',
};

interface LayoutNode {
  concept: Concept;
  layer: number;
  row: number;
}

const CARD_W = 236;
const CARD_H = 100;
const GAP_X = 150; // layer spacing
const GAP_Y = 64; // node spacing within a layer

/** Longest-path layering: a node sits one column to the right of its furthest in-view prerequisite,
 * so every prerequisite always renders to the left of what depends on it. This is still a
 * from-scratch layered DAG algorithm, not ELK.js/Dagre — swapping the layout engine itself is out
 * of scope here; what changed is everything downstream of it (canvas, drag, clustering, zoom). */
function layoutNodes(nodes: Concept[]): LayoutNode[] {
  const byId = new Map(nodes.map((n) => [n._id, n]));
  const layerCache = new Map<string, number>();
  const visiting = new Set<string>();

  function layerOf(id: string): number {
    if (layerCache.has(id)) return layerCache.get(id)!;
    if (visiting.has(id)) return 0; // defensive: backend should prevent cycles, never trust blindly
    visiting.add(id);
    const node = byId.get(id);
    const prereqIds = (node?.prerequisites ?? [])
      .map((p) => (typeof p === 'string' ? p : p._id))
      .filter((pid) => byId.has(pid) && pid !== id);
    const layer = prereqIds.length === 0 ? 0 : 1 + Math.max(...prereqIds.map(layerOf));
    visiting.delete(id);
    layerCache.set(id, layer);
    return layer;
  }

  const sorted = [...nodes].sort((a, b) => a.order - b.order);
  const rowCounters = new Map<number, number>();
  return sorted.map((concept) => {
    const layer = layerOf(concept._id);
    const row = rowCounters.get(layer) ?? 0;
    rowCounters.set(layer, row + 1);
    return { concept, layer, row };
  });
}

interface ConceptNodeData extends Record<string, unknown> {
  concept: Concept;
  state: NodeState;
  mastery?: Mastery;
  cluster: { bg: string; accent: string; fg: string };
  clusterLabel?: string;
  dimmed: boolean;
}
type ConceptFlowNode = Node<ConceptNodeData, 'concept'>;

function ConceptNodeView({ data, selected }: NodeProps<ConceptFlowNode>) {
  const { concept, state, mastery, cluster, clusterLabel, dimmed } = data;
  const meta = STATE_META[state];
  const Icon = meta.icon;
  const statusColor = STATUS_COLOR[state];

  return (
    <Tooltip delayDuration={250}>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'nodrag relative flex flex-col gap-1.5 rounded-[14px] p-4 text-left shadow-sm transition-all duration-200',
            dimmed && 'opacity-40',
          )}
          style={{
            width: CARD_W,
            minHeight: CARD_H,
            background: `linear-gradient(135deg, ${cluster.bg}, color-mix(in srgb, ${cluster.bg} 60%, white))`,
            border: selected ? `2px solid ${cluster.fg}` : `1.5px solid ${statusColor}55`,
            boxShadow: selected ? `0 6px 18px ${cluster.fg}33` : undefined,
          }}
        >
          {/* Invisible anchor points, not editable connection handles — `nodesConnectable={false}`
           * on the canvas already blocks dragging new connections from them. Styled with a plain
           * inline style, not a Tailwind `!`-prefixed class: Tailwind v4 moved the important marker
           * to a suffix (`opacity-0!`), so the old prefix syntax silently generates no CSS at all. */}
          <Handle type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: 'none' }} />
          <Handle type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: 'none' }} />

          <div className="flex items-center gap-2">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
              style={{ background: statusColor }}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span
              className="line-clamp-2 flex-1 text-sm font-semibold leading-snug"
              style={{ color: cluster.fg }}
            >
              {concept.name}
            </span>
          </div>

          {clusterLabel && (
            <span
              className="line-clamp-1 w-fit rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: `${cluster.accent}30`, color: cluster.fg }}
            >
              {clusterLabel}
            </span>
          )}

          <span className="text-xs font-medium" style={{ color: statusColor }}>
            {meta.label}
          </span>

          {mastery && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/60">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${mastery.score}%`, background: statusColor }}
                />
              </div>
              <span className="shrink-0 text-[11px] font-semibold" style={{ color: cluster.fg }}>
                {mastery.score}%
              </span>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="tw-scope">
        <p className="font-semibold">{concept.name}</p>
        <p>
          {meta.label}
          {mastery ? ` · ${mastery.score}%` : ''}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

const NODE_TYPES: NodeTypes = { concept: ConceptNodeView };

function loadStoredPositions(key: string): Record<string, { x: number; y: number }> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

interface KnowledgeTreeProps {
  nodes: Concept[];
  states: Map<string, NodeState>;
  masteryByConcept: Map<string, Mastery>;
  /** Highlights this node's direct edges and dims everything unrelated — set by clicking a node. */
  selectedId?: string | null;
  /** Dims every node whose state doesn't match — set by clicking a status pill in the control bar. */
  activeFilter?: NodeState | null;
  onSelect: (concept: Concept) => void;
  /** Scopes the student's personal drag-to-rearrange layout (localStorage only — never written back
   * to the Concept records Admin owns) — pass `${userId}:${subjectId}` so switching subject or user
   * never leaks one layout into another. */
  persistKey: string;
}

function KnowledgeTreeCanvas({
  nodes,
  states,
  masteryByConcept,
  selectedId,
  activeFilter,
  onSelect,
  persistKey,
}: KnowledgeTreeProps) {
  const storageKey = `navilearn:knowledge-map-layout:${persistKey}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, { x: number; y: number }>>(() =>
    loadStoredPositions(storageKey),
  );
  const { fitView, zoomIn, zoomOut, getZoom, setCenter } = useReactFlow<ConceptFlowNode>();
  const [zoomPct, setZoomPct] = useState(100);

  // Switching subject reloads whatever personal layout that subject already had (or none).
  useEffect(() => {
    setOverrides(loadStoredPositions(storageKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const layout = useMemo(() => layoutNodes(nodes), [nodes]);
  const byId = useMemo(() => new Map(layout.map((l) => [l.concept._id, l])), [layout]);

  const edgeDefs = useMemo(() => {
    const list: { from: LayoutNode; to: LayoutNode; unlocked: boolean; kind: 'prereq' | 'related' }[] = [];
    const seen = new Set<string>();
    for (const to of layout) {
      const prereqIds = (to.concept.prerequisites ?? []).map((p) => (typeof p === 'string' ? p : p._id));
      for (const pid of prereqIds) {
        const from = byId.get(pid);
        if (from) {
          seen.add(`${from.concept._id}->${to.concept._id}`);
          list.push({ from, to, unlocked: states.get(from.concept._id) === 'completed', kind: 'prereq' });
        }
      }
      const relatedIds = (to.concept.related ?? []).map((r) => (typeof r === 'string' ? r : r._id));
      for (const rid of relatedIds) {
        const from = byId.get(rid);
        if (from && !seen.has(`${from.concept._id}->${to.concept._id}`) && !seen.has(`${to.concept._id}->${from.concept._id}`)) {
          seen.add(`${from.concept._id}->${to.concept._id}`);
          list.push({ from, to, unlocked: false, kind: 'related' });
        }
      }
    }
    return list;
  }, [layout, byId, states]);

  // Direct prerequisite/dependent neighbourhood of the selected node — used to highlight its edges
  // and dim the rest of the graph without hiding the overall structure.
  const relatedToSelected = useMemo(() => {
    if (!selectedId) return null;
    const related = new Set<string>([selectedId]);
    edgeDefs.forEach(({ from, to }) => {
      if (from.concept._id === selectedId) related.add(to.concept._id);
      if (to.concept._id === selectedId) related.add(from.concept._id);
    });
    return related;
  }, [edgeDefs, selectedId]);

  const flowNodes = useMemo<ConceptFlowNode[]>(
    () =>
      layout.map((l) => {
        const state = states.get(l.concept._id) ?? 'locked';
        const topic = typeof l.concept.parentConcept === 'object' ? l.concept.parentConcept : null;
        const clusterId = topic?._id ?? l.concept._id;
        const dimmed =
          (!!relatedToSelected && !relatedToSelected.has(l.concept._id)) ||
          (!!activeFilter && state !== activeFilter);
        const basePos = { x: l.layer * (CARD_W + GAP_X), y: l.row * (CARD_H + GAP_Y) };
        return {
          id: l.concept._id,
          type: 'concept',
          position: overrides[l.concept._id] ?? basePos,
          // Explicit size, not left to post-mount measurement — fitView/edge routing need real
          // dimensions on the very first render, or they compute against a degenerate 0×0/default
          // box and the whole graph opens mis-scaled and looking "broken" until the user fiddles
          // with zoom themselves.
          width: CARD_W,
          height: CARD_H,
          draggable: !locked,
          selected: selectedId === l.concept._id,
          data: {
            concept: l.concept,
            state,
            mastery: masteryByConcept.get(l.concept._id),
            cluster: clusterForId(clusterId),
            clusterLabel: topic?.name,
            dimmed,
          },
        };
      }),
    [layout, states, masteryByConcept, overrides, locked, selectedId, relatedToSelected, activeFilter],
  );

  const flowEdges = useMemo<Edge[]>(
    () =>
      edgeDefs.map(({ from, to, unlocked, kind }) => {
        const isActive =
          !!relatedToSelected &&
          relatedToSelected.has(from.concept._id) &&
          relatedToSelected.has(to.concept._id);
        const dimmed = !!relatedToSelected && !isActive;
        const color =
          kind === 'related'
            ? isActive
              ? '#64748B'
              : '#94A3B8'
            : isActive
              ? '#2563EB'
              : unlocked
                ? '#16A34A'
                : '#4F6EC9';
        return {
          id: `${kind}-${from.concept._id}-${to.concept._id}`,
          source: from.concept._id,
          target: to.concept._id,
          type: 'default',
          style: {
            stroke: color,
            strokeWidth: isActive ? 4.5 : kind === 'related' ? 2.5 : 3.5,
            strokeDasharray: kind === 'related' ? '6 5' : undefined,
            opacity: dimmed ? 0.25 : 1,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
        };
      }),
    [edgeDefs, relatedToSelected],
  );

  const handleNodeDragStop = useCallback(
    (_: unknown, node: ConceptFlowNode) => {
      setOverrides((prev) => {
        const next = { ...prev, [node.id]: node.position };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* best-effort: a full/blocked localStorage just means this session's drag isn't persisted */
        }
        return next;
      });
    },
    [storageKey],
  );

  const resetLayout = () => {
    setOverrides({});
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    requestAnimationFrame(() => fitView({ duration: 300 }));
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else rootRef.current?.requestFullscreen();
  };

  // fitView once per real data change (new subject / node set) — afterwards the user's own
  // pan/zoom takes over, this never fights their input mid-session.
  useEffect(() => {
    requestAnimationFrame(() => {
      fitView({ duration: 0, padding: 0.2 });
      setZoomPct(Math.round(getZoom() * 100));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  const centerSelected = () => {
    if (!selectedId) return;
    const n = flowNodes.find((fn) => fn.id === selectedId);
    if (!n) return;
    setCenter(n.position.x + CARD_W / 2, n.position.y + CARD_H / 2, {
      zoom: Math.max(getZoom(), 0.8),
      duration: 300,
    });
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative overflow-hidden rounded-[18px] border border-border',
        isFullscreen && 'bg-card',
      )}
      style={{ height: isFullscreen ? '100vh' : '72vh', minHeight: 520 }}
    >
      {/* Floating toolbar — pan mode is the canvas default (left-drag on empty space), these just
       * cover what dragging alone can't: numeric zoom, fit/reset, lock, fullscreen. Never overlaps
       * the minimap (opposite corner) or any node (toolbar sits above the graph's own z-index). */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-0.5 rounded-control border border-border bg-card/95 p-1 shadow-card backdrop-blur">
        <button
          type="button"
          aria-label="Thu nhỏ"
          onClick={() => {
            zoomOut({ duration: 150 });
            setZoomPct(Math.round(getZoom() * 100));
          }}
          className="flex h-7 w-7 items-center justify-center rounded-control text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-10 text-center text-xs font-medium text-muted-foreground">{zoomPct}%</span>
        <button
          type="button"
          aria-label="Phóng to"
          onClick={() => {
            zoomIn({ duration: 150 });
            setZoomPct(Math.round(getZoom() * 100));
          }}
          className="flex h-7 w-7 items-center justify-center rounded-control text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />
        <button
          type="button"
          aria-label="Vừa khung hình"
          onClick={() => fitView({ duration: 300, padding: 0.2 })}
          className="flex h-7 w-7 items-center justify-center rounded-control text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        {selectedId && (
          <button
            type="button"
            aria-label="Đưa kiến thức đang chọn vào giữa"
            onClick={centerSelected}
            className="flex h-7 w-7 items-center justify-center rounded-control text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Target className="h-3.5 w-3.5" />
          </button>
        )}
        <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />
        <button
          type="button"
          aria-label={locked ? 'Mở khoá bố cục' : 'Khoá bố cục'}
          onClick={() => setLocked((v) => !v)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-control hover:bg-muted',
            locked ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          aria-label="Khôi phục bố cục tự động"
          onClick={resetLayout}
          className="flex h-7 w-7 items-center justify-center rounded-control text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />
        <button
          type="button"
          aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          onClick={toggleFullscreen}
          className="flex h-7 w-7 items-center justify-center rounded-control text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
        </button>
      </div>

      <TooltipProvider>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={NODE_TYPES}
          onNodeClick={(_, n) => onSelect((n.data as ConceptNodeData).concept)}
          onNodeDoubleClick={(_, n) =>
            setCenter(n.position.x + CARD_W / 2, n.position.y + CARD_H / 2, { zoom: 1, duration: 300 })
          }
          onNodeDragStop={handleNodeDragStop}
          onMoveEnd={() => setZoomPct(Math.round(getZoom() * 100))}
          nodesDraggable={!locked}
          nodesConnectable={false}
          elementsSelectable
          fitView
          fitViewOptions={{ padding: 0.2 }}
          panOnScroll={false}
          zoomOnScroll
          zoomOnPinch
          panOnDrag={[0, 1]}
          panActivationKeyCode="Space"
          minZoom={0.15}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1.4}
            color="#DCE4F8"
            style={{ background: '#F7F8FF' }}
          />
          <MiniMap
            pannable
            zoomable
            position="bottom-right"
            style={{
              margin: 12,
              borderRadius: 10,
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
            maskColor="rgba(220, 228, 248, 0.5)"
            nodeColor={(n) => (n.data as ConceptNodeData)?.cluster?.accent ?? '#9BAACB'}
          />
        </ReactFlow>
      </TooltipProvider>
    </div>
  );
}

/** Interactive Knowledge Atlas canvas — infinite pan/zoom workspace (React Flow) over the real
 * prerequisite DAG, colored by stable per-topic clusters with status shown through icon/border/
 * progress only (never by hiding or greying out locked nodes). Drag-to-rearrange is purely a
 * personal view preference (localStorage, per user+subject) — it never touches `order` or
 * `prerequisites`, which stay exactly what Admin set. */
export function KnowledgeTree(props: KnowledgeTreeProps) {
  return (
    <ReactFlowProvider>
      <KnowledgeTreeCanvas {...props} />
    </ReactFlowProvider>
  );
}
