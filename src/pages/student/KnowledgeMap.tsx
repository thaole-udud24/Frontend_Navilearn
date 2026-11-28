import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Network, Play, TreePine, X } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { GlobalSubjectFilter } from '@/components/GlobalSubjectFilter';
import { useAuthStore } from '@/hooks/useAuth';
import { useSelectedSubject } from '@/hooks/useSubjectStore';
import { getSubjectId, getSubjectLabel } from '@/lib/subjectUtils';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getSubjectGraph } from '@/services/knowledge';
import { listMasteries } from '@/services/mastery';
import { listGoals } from '@/services/planning';
import type { Concept } from '@/services/knowledge/types';
import type { Mastery } from '@/services/mastery/types';
import { deriveNodeStates, KnowledgeTree, stateMeta, type NodeState } from './components/KnowledgeTree';
import StudentKnowledgeStructurePage from '@/pages/content/knowledge/Student';

const PILL_STATES: NodeState[] = ['completed', 'learning', 'decay', 'available', 'locked'];

/** Zone C — read-only Concept Inspector matching Ảnh 1. */
function InspectorPanel({
  concept,
  subjectName,
  state,
  neighbours,
  onClose,
  onSelectNeighbour,
}: {
  concept: Concept;
  subjectName: string;
  state: NodeState;
  neighbours: {
    prerequisites: { concept: Concept; state: NodeState }[];
    dependents: { concept: Concept; state: NodeState }[];
  };
  onClose: () => void;
  onSelectNeighbour: (c: Concept) => void;
}) {
  const navigate = useNavigate();
  const { data: masteryRes } = useQuery({
    queryKey: ['knowledge-map-detail-mastery', concept._id],
    queryFn: () => listMasteries({ concept: concept._id, limit: 1 }),
  });
  const mastery = masteryRes?.data?.[0] ?? null;
  const meta = stateMeta(state);
  const parentName =
    concept.parentConcept && typeof concept.parentConcept === 'object' ? concept.parentConcept.name : null;
  const score = mastery?.score ?? 0;

  return (
    <aside className="flex h-full w-full shrink-0 flex-col gap-4 overflow-y-auto rounded-card border border-border bg-card p-5 shadow-card lg:w-[340px]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {meta.label}
          </span>
          {concept.examFocus && (
            <span className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-foreground">
              Trọng tâm kỳ thi
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <h2 className="text-lg font-bold leading-snug text-foreground">{concept.name}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {parentName ? `${parentName} · ${subjectName}` : subjectName}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-3.5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">Mức độ thành thạo</span>
          <span className="font-bold text-primary">{score}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${score}%` }} />
        </div>
      </div>

      {concept.description && (
        <p className="text-sm leading-relaxed text-muted-foreground">{concept.description}</p>
      )}

      {neighbours.prerequisites.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Kiến thức tiên quyết
          </h3>
          <div className="flex flex-col gap-1">
            {neighbours.prerequisites.map(({ concept: p }) => (
              <button
                key={p._id}
                type="button"
                onClick={() => onSelectNeighbour(p)}
                className="rounded-control px-2 py-1 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {neighbours.dependents.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Khái niệm tiếp theo
          </h3>
          <div className="flex flex-col gap-1">
            {neighbours.dependents.map(({ concept: d }) => (
              <button
                key={d._id}
                type="button"
                onClick={() => onSelectNeighbour(d)}
                className="rounded-control px-2 py-1 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <Button
          type="button"
          className="w-full"
          onClick={() => navigate(`${PATHS.student.practice}?concept=${concept._id}`)}
        >
          <Play className="h-4 w-4" /> Ôn tập khái niệm
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => navigate(PATHS.student.resources)}
        >
          <FileText className="h-4 w-4" /> Xem tài liệu liên quan
        </Button>
      </div>
    </aside>
  );
}

/** Read-only Interactive Knowledge Graph (see NaviLearn_02 doc): concepts from the shared Kho tri
 * thức, laid out by their real `prerequisites` DAG (never the parentConcept containment tree) and
 * colored by the student's own Mastery — students can drill in, inspect, zoom and filter, never
 * create/edit a Concept or a prerequisite relationship from this page. */
export default function KnowledgeMapPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  // "Bản đồ"/"Cây" toggle (merges the old separate "Cấu trúc kiến thức" page in here, same
  // underlying data — view vs edit mode). Subject context is kept independently per mode: the map
  // uses a Concept id (?subject=), the tree uses its own enrollment-based subject state, and the
  // two don't share an id space, so reconciling them would need a lookup this phase doesn't need.
  const mode = searchParams.get('mode') === 'tree' ? 'tree' : 'map';
  const setMode = (m: 'map' | 'tree') => {
    searchParams.set('mode', m);
    setSearchParams(searchParams, { replace: true });
  };

  const { selectedSubjectId, catalogSubjects } = useSelectedSubject();

  const { data: activeGoalsRes } = useQuery({
    queryKey: ['knowledge-map-active-goals'],
    queryFn: () => listGoals({ limit: 50 }),
  });
  const defaultSubjectId = useMemo(() => {
    const goalSubjectIds = new Set(
      (activeGoalsRes?.data ?? [])
        .filter((g) => g.status === 'active')
        .map((g) => (typeof g.concept === 'string' ? g.concept : g.concept?._id))
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    );
    const preferred = catalogSubjects.find((s) => {
      const id = getSubjectId(s);
      return id ? goalSubjectIds.has(id) : false;
    });
    return (preferred ? getSubjectId(preferred) : null) ?? (catalogSubjects[0] ? getSubjectId(catalogSubjects[0]) : null);
  }, [activeGoalsRes, catalogSubjects]);

  // Global filter takes precedence once user picks a subject; deep-link ?subject=... or active-goal default otherwise.
  const effectiveSubjectId = selectedSubjectId ?? searchParams.get('subject') ?? defaultSubjectId;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<NodeState | null>(null);

  // Every leaf Concept under the subject in one call — the real prerequisite DAG, which routinely
  // crosses chapter/topic boundaries, needs the whole subject in view at once to render as a graph
  // instead of one disconnected column per chapter (see knowledge.service.getSubjectGraph).
  const { data, isLoading } = useQuery({
    queryKey: ['knowledge-map-graph', effectiveSubjectId],
    queryFn: () => getSubjectGraph(effectiveSubjectId!),
    enabled: !!effectiveSubjectId,
  });
  const nodes = useMemo(() => data?.data ?? [], [data]);

  const { data: masteryRes } = useQuery({
    queryKey: ['knowledge-map-mastery', effectiveSubjectId ?? 'all'],
    queryFn: () => listMasteries({ limit: 200, subjectId: effectiveSubjectId ?? undefined }),
  });
  const masteryByConcept = useMemo(() => {
    const map = new Map<string, Mastery>();
    (masteryRes?.data ?? []).forEach((m) => {
      const id = !m.concept ? null : typeof m.concept === 'string' ? m.concept : m.concept._id;
      if (id) map.set(id, m);
    });
    return map;
  }, [masteryRes]);

  const states = useMemo(() => deriveNodeStates(nodes, masteryByConcept), [nodes, masteryByConcept]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n._id, n])), [nodes]);

  // Real counts of the nodes currently in view — not a fabricated site-wide summary.
  const stateCounts = useMemo(() => {
    const counts: Record<NodeState, number> = {
      locked: 0,
      available: 0,
      learning: 0,
      completed: 0,
      decay: 0,
    };
    states.forEach((s) => counts[s]++);
    return counts;
  }, [states]);

  const selected = selectedId ? (byId.get(selectedId) ?? null) : null;
  const selectedNeighbours = useMemo(() => {
    if (!selected) return { prerequisites: [], dependents: [] };
    const prereqIds = (selected.prerequisites ?? []).map((p) => (typeof p === 'string' ? p : p._id));
    const prerequisites = prereqIds
      .map((id) => byId.get(id))
      .filter((c): c is Concept => !!c)
      .map((c) => ({ concept: c, state: states.get(c._id) ?? 'locked' }));
    const dependents = nodes
      .filter((n) =>
        (n.prerequisites ?? []).some((p) => (typeof p === 'string' ? p : p._id) === selected._id),
      )
      .map((c) => ({ concept: c, state: states.get(c._id) ?? 'locked' }));
    return { prerequisites, dependents };
  }, [selected, byId, nodes, states]);

  const selectConcept = (c: Concept) => setSelectedId(c._id);
  const currentSubjectObj = catalogSubjects.find((s) => getSubjectId(s) === effectiveSubjectId) ?? null;
  const currentSubjectName = currentSubjectObj ? getSubjectLabel(currentSubjectObj) : 'Môn học';

  return (
    <AppShell
      menu={studentMenu}
      title={mode === 'tree' ? 'Cấu trúc kiến thức' : 'Bản đồ tri thức'}
      breadcrumb={['Trang chủ', mode === 'tree' ? 'Cấu trúc kiến thức' : 'Bản đồ tri thức']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      {/* Shared Header matching Ảnh 1 & Ảnh 2 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {mode === 'tree' ? 'Cấu trúc kiến thức' : 'Bản đồ tri thức'}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {mode === 'tree'
              ? 'Quản lý chương, chủ đề trọng tâm và khái niệm theo từng môn học.'
              : 'Theo dõi mối liên hệ khái niệm và cấu trúc kiến thức theo từng môn học.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 rounded-card border border-border bg-card px-3 py-1.5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Môn học:</span>
            <GlobalSubjectFilter
              compact
              allowAll={false}
              value={effectiveSubjectId}
              onChange={() => setSelectedId(null)}
            />
          </div>
          <div className="flex items-center gap-1 rounded-control bg-muted/60 p-0.5">
            <button
              type="button"
              onClick={() => setMode('map')}
              className={cn(
                'flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-all',
                mode === 'map'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Network className="h-3.5 w-3.5" /> Bản đồ
            </button>
            <button
              type="button"
              onClick={() => setMode('tree')}
              className={cn(
                'flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-all',
                mode === 'tree'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <TreePine className="h-3.5 w-3.5" /> Cây
            </button>
          </div>
        </div>
      </div>

      {mode === 'tree' && <StudentKnowledgeStructurePage embeddedSubjectId={effectiveSubjectId} />}
      {mode === 'map' && (
      <>
      {/* Status Summary Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-card px-4 py-2.5 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          {PILL_STATES.map((key) => {
            const meta = stateMeta(key);
            const Icon = meta.icon;
            const active = activeFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter((f) => (f === key ? null : key))}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-muted/40 text-foreground hover:bg-muted',
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full text-white',
                    active ? 'bg-white/20' : meta.dot,
                  )}
                >
                  <Icon className="h-2.5 w-2.5" />
                </span>
                {stateCounts[key]} {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading && (
        <div className="flex min-h-[40vh] items-center justify-center rounded-card border border-border bg-card">
          <p className="text-sm text-muted-foreground">Đang tải bản đồ tri thức…</p>
        </div>
      )}

      {!isLoading && effectiveSubjectId && nodes.length === 0 && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-card text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Network className="h-8 w-8" />
          </span>
          <h2 className="text-lg font-bold text-foreground">Môn này chưa có kiến thức nào</h2>
        </div>
      )}

      {!isLoading && nodes.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
          <div className="flex min-w-0 flex-col overflow-hidden rounded-card border border-border bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5 text-xs">
              <span className="font-semibold text-foreground">
                {currentSubjectName} · {nodes.length} khái niệm
              </span>
              <span className="text-muted-foreground">Nhấp vào khái niệm để xem chi tiết</span>
            </div>
            <div className="min-h-[520px] flex-1">
              <KnowledgeTree
                nodes={nodes}
                states={states}
                masteryByConcept={masteryByConcept}
                selectedId={selectedId}
                activeFilter={activeFilter}
                onSelect={selectConcept}
                persistKey={`${user?.id ?? 'anon'}:${effectiveSubjectId ?? 'none'}`}
              />
            </div>
          </div>
          {selected ? (
            <InspectorPanel
              concept={selected}
              subjectName={currentSubjectName}
              state={states.get(selected._id) ?? 'locked'}
              neighbours={selectedNeighbours}
              onClose={() => setSelectedId(null)}
              onSelectNeighbour={selectConcept}
            />
          ) : (
            <aside className="hidden flex-col items-center justify-center rounded-card border border-dashed border-border bg-card p-6 text-center lg:flex">
              <Network className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Chi tiết khái niệm</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Nhấp vào một khái niệm trên bản đồ để xem mức độ thành thạo và lộ trình liên quan.
              </p>
            </aside>
          )}
        </div>
      )}
      </>
      )}
    </AppShell>
  );
}
