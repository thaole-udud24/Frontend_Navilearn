import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Network, Percent, TrendingUp, X } from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { studentMenu } from '@/config/menu.student';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { listConcepts } from '@/services/knowledge';
import { getSubjectGraph } from '@/services/knowledge';
import { listMasteries } from '@/services/mastery';
import type { Concept } from '@/services/knowledge/types';
import type { Mastery } from '@/services/mastery/types';
import { deriveNodeStates, KnowledgeTree, stateMeta, type NodeState } from './components/KnowledgeTree';

const PILL_STATES: NodeState[] = ['completed', 'learning', 'decay', 'available', 'locked'];

/** Zone C — read-only Concept Inspector. Shows the selected concept's real description, mastery,
 * and its direct prerequisite/dependent neighbours (derived from the same edges the canvas draws —
 * never a separate, possibly-inconsistent computation). It never edits the graph. */
function InspectorPanel({
  concept,
  state,
  neighbours,
  onClose,
  onSelectNeighbour,
}: {
  concept: Concept;
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
  const Icon = meta.icon;

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col gap-4 overflow-y-auto rounded-card border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-white',
              meta.dot,
            )}
          >
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-base font-bold leading-tight text-foreground">{concept.name}</h2>
            <span className="text-xs font-medium text-muted-foreground">{meta.label}</span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {concept.description && <p className="text-sm text-muted-foreground">{concept.description}</p>}

      {mastery ? (
        <div className="flex flex-col gap-2 rounded-control border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Điểm thành thạo</span>
            <span className="font-semibold text-foreground">{mastery.score}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${mastery.score}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Số lần luyện tập</span>
            <span>{mastery.attemptsCount}</span>
          </div>
        </div>
      ) : (
        <p className="rounded-control border border-dashed border-border p-3 text-sm text-muted-foreground">
          Chưa có dữ liệu học tập cho kiến thức này.
        </p>
      )}

      {neighbours.prerequisites.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Tiên quyết
          </h3>
          <div className="flex flex-col gap-1.5">
            {neighbours.prerequisites.map(({ concept: p, state: pState }) => {
              const pMeta = stateMeta(pState);
              const PIcon = pMeta.icon;
              return (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => onSelectNeighbour(p)}
                  className="flex items-center gap-2 rounded-control border border-border px-2.5 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white',
                      pMeta.dot,
                    )}
                  >
                    <PIcon className="h-3 w-3" />
                  </span>
                  <span className="line-clamp-1 flex-1 text-foreground">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {neighbours.dependents.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Học tiếp theo
          </h3>
          <div className="flex flex-col gap-1.5">
            {neighbours.dependents.map(({ concept: d, state: dState }) => {
              const dMeta = stateMeta(dState);
              const DIcon = dMeta.icon;
              return (
                <button
                  key={d._id}
                  type="button"
                  onClick={() => onSelectNeighbour(d)}
                  className="flex items-center gap-2 rounded-control border border-border px-2.5 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white',
                      dMeta.dot,
                    )}
                  >
                    <DIcon className="h-3 w-3" />
                  </span>
                  <span className="line-clamp-1 flex-1 text-foreground">{d.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`${PATHS.student.practice}?concept=${concept._id}`)}
        >
          <Percent className="h-4 w-4" /> Luyện tập kiến thức này
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(PATHS.student.mastery)}>
          <TrendingUp className="h-4 w-4" /> Xem mức độ thành thạo
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
  const [searchParams] = useSearchParams();

  const { data: subjectsRes } = useQuery({
    queryKey: ['knowledge-map-subjects'],
    queryFn: () => listConcepts({ limit: 100, parentConcept: 'null' }),
  });
  const subjects = useMemo(() => subjectsRes?.data ?? [], [subjectsRes]);

  const [subjectId, setSubjectId] = useState<string | null>(null);
  // Deep-link from other pages (e.g. "Xem sơ đồ cây lộ trình" on Lộ trình học tập) — real query
  // param, not just a cosmetic default; falls back to the first subject when absent/unknown.
  const effectiveSubjectId = subjectId ?? searchParams.get('subject') ?? subjects[0]?._id ?? null;

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
    queryKey: ['knowledge-map-mastery'],
    queryFn: () => listMasteries({ limit: 200 }),
  });
  const masteryByConcept = useMemo(() => {
    const map = new Map<string, Mastery>();
    (masteryRes?.data ?? []).forEach((m) =>
      map.set(typeof m.concept === 'string' ? m.concept : m.concept._id, m),
    );
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

  return (
    <AppShell
      menu={studentMenu}
      title="Bản đồ tri thức"
      breadcrumb={['Trang chủ', 'Bản đồ tri thức']}
      userName={user?.fullName ?? ''}
      roleLabel="Sinh viên"
      compactHeader
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      {/* Compact header — no hero banner, no large stat cards, so the canvas gets the room. */}
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-lavender text-lavender-foreground">
          <Network className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-[28px] font-bold leading-tight text-foreground">Bản đồ tri thức</h1>
          <p className="text-sm text-muted-foreground">
            Khám phá cấu trúc kiến thức, quan hệ tiên quyết và mức độ thành thạo của bạn.
          </p>
        </div>
      </div>

      {/* Compact Knowledge Control Bar — subject scope on the left, real mastery summary on the
       * right; clicking a status pill highlights those nodes on the canvas instead of removing them. */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-card p-3 shadow-card">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Môn học</span>
          <Select
            value={effectiveSubjectId ?? undefined}
            onValueChange={(v) => {
              setSubjectId(v);
              setSelectedId(null);
            }}
            disabled={subjects.length === 0}
          >
            <SelectTrigger className="h-9 w-[200px] text-sm">
              <SelectValue placeholder="Chọn môn học" />
            </SelectTrigger>
            <SelectContent className="tw-scope">
              {subjects.map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
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
                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted',
                )}
              >
                <span
                  className={cn('flex h-4 w-4 items-center justify-center rounded-full text-white', meta.dot)}
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
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Đang tải…</p>
        </div>
      )}

      {!isLoading && effectiveSubjectId && nodes.length === 0 && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Network className="h-8 w-8" />
          </span>
          <h2 className="text-lg font-bold text-foreground">Môn này chưa có kiến thức nào</h2>
        </div>
      )}

      {!isLoading && nodes.length > 0 && (
        <div className="flex items-stretch gap-4">
          <div className="min-w-0 flex-1">
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
          {selected && (
            <InspectorPanel
              concept={selected}
              state={states.get(selected._id) ?? 'locked'}
              neighbours={selectedNeighbours}
              onClose={() => setSelectedId(null)}
              onSelectNeighbour={selectConcept}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}
