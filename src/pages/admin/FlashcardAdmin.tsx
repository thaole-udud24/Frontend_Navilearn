import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, useReducedMotion } from 'framer-motion';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Archive,
  ArchiveRestore,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  Pencil,
  PlayCircle,
  RotateCw,
  Trash2,
  type LucideIcon,
} from 'lucide-react';

import { AppShell } from '@/layouts/AppShell';
import { useAuthStore } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { adminMenu } from '@/config/menu.admin';
import { Button } from '@/components/ui/button';
import { AddButton } from '@/components/ui/add-button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { DialogColorHeader } from '@/components/DialogForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ConceptSelect } from '@/components/ConceptSelect';
import { StatusBadge } from '@/components/StatusBadge';
import { StatCard } from '@/components/StatCard';
import { ClampLine, DataTablePage } from '@/components/DataTablePage';
import { cn } from '@/lib/utils';
import {
  activateDeck,
  archiveDeck,
  createCard,
  createDeck,
  listCards,
  listDecks,
  removeCard,
  removeDeck,
  updateCard,
  updateDeck,
} from '@/services/flashcard';
import type { Flashcard, FlashcardDeck } from '@/services/flashcard/types';

const conceptName = (c: FlashcardDeck['concept']) => (typeof c === 'string' ? c : c.name);

function DeckFormDialog({
  editing,
  onClose,
  onSaved,
}: {
  editing: FlashcardDeck | 'new' | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = editing === 'new';
  const [title, setTitle] = useState('');
  const [concept, setConcept] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editing && editing !== 'new') {
      setTitle(editing.title);
      setConcept(typeof editing.concept === 'string' ? editing.concept : editing.concept._id);
      setDescription(editing.description ?? '');
    } else {
      setTitle('');
      setConcept('');
      setDescription('');
    }
  }, [editing]);

  const mutation = useMutation({
    mutationFn: () =>
      isNew
        ? createDeck({ title, concept, description: description || undefined })
        : updateDeck((editing as FlashcardDeck)._id, {
            title,
            concept,
            description: description || undefined,
          }),
    onSuccess: () => {
      toast.success(isNew ? 'Đã tạo bộ thẻ' : 'Đã cập nhật bộ thẻ');
      onSaved();
      onClose();
    },
    onError: () => toast.error(isNew ? 'Tạo bộ thẻ thất bại' : 'Cập nhật bộ thẻ thất bại'),
  });

  return (
    <Dialog open={!!editing} onOpenChange={(v) => !v && onClose()}>
      <DialogContent expandable size="md" className="tw-scope">
        <DialogColorHeader
          icon={Layers}
          tone="amber"
          title={isNew ? 'Thêm bộ thẻ' : 'Sửa bộ thẻ'}
          description="Bộ thẻ ghi nhớ dùng chung cho toàn hệ thống."
        />
        <div className="flex flex-col gap-4 pt-1">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Tên bộ thẻ
            <Input
              placeholder="Ví dụ: Bộ thẻ buổi S5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Môn học / kiến thức
            <ConceptSelect value={concept} onChange={setConcept} placeholder="Chọn môn học / kiến thức" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Mô tả <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
            <textarea
              placeholder="Mô tả ngắn cho bộ thẻ này…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-control border border-input bg-card px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            disabled={!title || !concept || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {isNew ? 'Tạo bộ thẻ' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CardFormDialog({
  deckId,
  editing,
  onClose,
  onSaved,
}: {
  deckId: string;
  editing: Flashcard | 'new' | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = editing === 'new';
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  useEffect(() => {
    if (editing && editing !== 'new') {
      setFront(editing.front);
      setBack(editing.back);
    } else {
      setFront('');
      setBack('');
    }
  }, [editing]);

  const mutation = useMutation({
    mutationFn: () =>
      isNew
        ? createCard(deckId, { front, back })
        : updateCard(deckId, (editing as Flashcard)._id, { front, back }),
    onSuccess: () => {
      toast.success(isNew ? 'Đã thêm thẻ' : 'Đã cập nhật thẻ');
      onSaved();
      onClose();
    },
    onError: () => toast.error('Lưu thẻ thất bại'),
  });

  return (
    <Dialog open={!!editing} onOpenChange={(v) => !v && onClose()}>
      <DialogContent expandable size="lg" className="tw-scope">
        <DialogColorHeader
          icon={Pencil}
          tone="amber"
          title={isNew ? 'Thêm thẻ' : 'Sửa thẻ'}
          description="Mặt trước là câu hỏi, mặt sau là đáp án."
        />
        <div className="flex flex-col gap-4 pt-1">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Mặt trước (câu hỏi)
            <textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={3}
              className="w-full rounded-control border border-input bg-card px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Mặt sau (đáp án)
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={3}
              className="w-full rounded-control border border-input bg-card px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            disabled={!front || !back || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** One flashcard preview — question prominent, answer visually subordinate underneath. */
function FlashcardPreviewCard({
  card,
  onEdit,
  onDelete,
}: {
  card: Flashcard;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex flex-col gap-2 rounded-card border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-snug text-foreground">{card.front}</p>
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            aria-label="Sửa thẻ"
            onClick={onEdit}
            className="flex h-7 w-7 items-center justify-center rounded-control text-muted-foreground hover:bg-muted hover:text-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Xoá thẻ"
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-control text-muted-foreground hover:bg-muted hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="border-t border-border/70 pt-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Đáp án</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{card.back}</p>
      </div>
    </div>
  );
}

/** Flips between `front` and `back` with a real 3D rotation (section 11.3: "Lật Flashcard bằng
 * hiệu ứng 3D flip"), not an instant text swap — skips the rotation under prefers-reduced-motion. */
function FlipCard({
  flipped,
  front,
  back,
  onFlip,
}: {
  flipped: boolean;
  front: ReactNode;
  back: ReactNode;
  onFlip: () => void;
}) {
  const reduced = useReducedMotion();
  const faceClass =
    'absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-card border p-8 text-center [backface-visibility:hidden]';

  return (
    <button type="button" onClick={onFlip} className="w-full" style={{ perspective: 1000 }}>
      <motion.div
        className="relative min-h-[220px] w-full"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: reduced ? 0 : 0.5, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className={cn(faceClass, 'border-border bg-muted/40')}>{front}</div>
        <div
          className={cn(faceClass, 'border-primary/30 bg-primary/5')}
          style={{ transform: 'rotateY(180deg)' }}
        >
          {back}
        </div>
      </motion.div>
    </button>
  );
}

/** Dedicated study mode: one card centered at a time, 3D flip-to-reveal, prev/next, progress. */
function StudyModeDialog({
  deckTitle,
  cards,
  onClose,
}: {
  deckTitle: string;
  cards: Flashcard[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
    setSeen(new Set());
  }, [cards]);

  const card = cards[index];
  const goTo = (next: number) => {
    setIndex(next);
    setFlipped(false);
  };

  useEffect(() => {
    if (flipped && card) setSeen((prev) => new Set(prev).add(card._id));
  }, [flipped, card]);

  if (!card) return null;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent expandable size="lg" className="tw-scope flex flex-col gap-5 sm:max-h-[85vh]">
        <div>
          <p className="text-sm font-semibold text-foreground">{deckTitle}</p>
          <p className="text-xs text-muted-foreground">
            Thẻ {index + 1}/{cards.length} · Đã xem {seen.size}/{cards.length}
          </p>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${((index + 1) / cards.length) * 100}%` }}
          />
        </div>

        <FlipCard
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
          front={
            <>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Câu hỏi
              </span>
              <p className="text-xl font-semibold leading-snug text-foreground">{card.front}</p>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <RotateCw className="h-3.5 w-3.5" /> Nhấp để lật thẻ
              </span>
            </>
          }
          back={
            <>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">Đáp án</span>
              <p className="text-xl font-semibold leading-snug text-foreground">{card.back}</p>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <RotateCw className="h-3.5 w-3.5" /> Nhấp để lật lại
              </span>
            </>
          }
        />

        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={index === 0} onClick={() => goTo(index - 1)}>
            <ChevronLeft className="h-4 w-4" /> Trước
          </Button>
          <Button disabled={index === cards.length - 1} onClick={() => goTo(index + 1)}>
            Tiếp <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ icon: Icon, label, action }: { icon: LucideIcon; label: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Icon className="h-10 w-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{label}</p>
      {action}
    </div>
  );
}

export default function FlashcardAdmin() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | 'new' | null>(null);
  const [deletingDeck, setDeletingDeck] = useState<FlashcardDeck | null>(null);
  const [editingCard, setEditingCard] = useState<Flashcard | 'new' | null>(null);
  const [deletingCard, setDeletingCard] = useState<Flashcard | null>(null);
  const [studying, setStudying] = useState(false);

  const { data: decksRes } = useQuery({
    queryKey: ['flashcard-decks'],
    queryFn: () => listDecks({ limit: 100 }),
  });
  const decks = decksRes?.data ?? [];
  const selectedDeck = decks.find((d) => d._id === selectedDeckId) ?? null;

  const { data: cardsRes, refetch: refetchCards } = useQuery({
    queryKey: ['flashcard-cards', selectedDeck?._id],
    queryFn: () => listCards(selectedDeck!._id, { limit: 200 }),
    enabled: !!selectedDeck,
  });
  const cards = cardsRes?.data ?? [];

  const invalidateDecks = () => queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });

  const toggleArchive = async (deck: FlashcardDeck) => {
    try {
      await (deck.status === 'archived' ? activateDeck(deck._id) : archiveDeck(deck._id));
      toast.success(deck.status === 'archived' ? 'Đã khôi phục bộ thẻ' : 'Đã lưu trữ bộ thẻ');
      invalidateDecks();
    } catch {
      toast.error('Không cập nhật được trạng thái bộ thẻ');
    }
  };

  const handleDeleteDeck = async () => {
    if (!deletingDeck) return;
    try {
      await removeDeck(deletingDeck._id);
      toast.success(`Đã xoá bộ thẻ "${deletingDeck.title}"`);
      if (selectedDeckId === deletingDeck._id) setSelectedDeckId(null);
      invalidateDecks();
    } catch {
      toast.error('Không xoá được — bộ thẻ còn thẻ bên trong, xoá hết thẻ trước');
    } finally {
      setDeletingDeck(null);
    }
  };

  const handleDeleteCard = async () => {
    if (!deletingCard || !selectedDeck) return;
    try {
      await removeCard(selectedDeck._id, deletingCard._id);
      toast.success('Đã xoá thẻ');
      refetchCards();
      invalidateDecks();
    } catch {
      toast.error('Xoá thẻ thất bại');
    } finally {
      setDeletingCard(null);
    }
  };

  const saveCardsSideEffect = () => {
    refetchCards();
    invalidateDecks();
  };

  const totalCards = decks.reduce((sum, d) => sum + d.cardCount, 0);
  const activeCount = decks.filter((d) => d.status === 'active').length;
  const archivedCount = decks.filter((d) => d.status === 'archived').length;

  const deckColumns: ColumnDef<FlashcardDeck>[] = [
    {
      accessorKey: 'title',
      header: 'Bộ thẻ',
      meta: { enableColumnSearch: true },
      cell: ({ row }) => (
        <div className="flex flex-col py-1">
          <span className="font-medium text-foreground">{row.original.title}</span>
          {row.original.description && <ClampLine text={row.original.description} lines={1} />}
        </div>
      ),
    },
    { id: 'concept', header: 'Môn học', accessorFn: (d) => conceptName(d.concept) },
    { accessorKey: 'cardCount', header: 'Số thẻ' },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      meta: { filterOptions: ['active', 'archived'] },
      cell: ({ getValue }) => {
        const active = getValue<FlashcardDeck['status']>() === 'active';
        return (
          <StatusBadge variant={active ? 'success' : 'neutral'}>
            {active ? 'Hoạt động' : 'Đã lưu trữ'}
          </StatusBadge>
        );
      },
    },
  ];

  return (
    <AppShell
      menu={adminMenu}
      title="Thẻ ghi nhớ"
      breadcrumb={['Trang chủ', 'Quản trị nội dung', 'Ngân hàng câu hỏi', 'Thẻ ghi nhớ']}
      userName={user?.fullName ?? ''}
      roleLabel="Quản trị viên"
      compactHeader
      area="admin"
      onLogout={() => {
        logout();
        navigate(PATHS.login);
      }}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Thẻ ghi nhớ</h1>
            <p className="text-sm text-muted-foreground">
              Quản lý các bộ thẻ ghi nhớ dùng chung cho toàn hệ thống.
            </p>
          </div>
          <AddButton onClick={() => setEditingDeck('new')}>Thêm bộ thẻ</AddButton>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Layers} label="Tổng số bộ thẻ" value={decks.length} tone="blue" />
          <StatCard icon={BookOpen} label="Tổng số thẻ" value={totalCards} tone="amber" />
          <StatCard icon={CheckCircle2} label="Đang hoạt động" value={activeCount} tone="mint" />
          <StatCard icon={Archive} label="Đã lưu trữ" value={archivedCount} tone="blush" />
        </div>

        <DataTablePage<FlashcardDeck>
          columns={deckColumns}
          data={decks}
          getRowId={(d) => d._id}
          searchPlaceholder="Tìm theo tên bộ thẻ…"
          emptyLabel="Chưa có bộ thẻ nào. Tạo bộ thẻ đầu tiên để bắt đầu."
          rowClassName={(d) => (d._id === selectedDeckId ? 'bg-primary/5' : undefined)}
          rowActions={[
            {
              key: 'view',
              label: 'Xem thẻ bên trong',
              icon: <Eye />,
              onSelect: (d) => setSelectedDeckId(d._id),
            },
            { key: 'edit', label: 'Sửa bộ thẻ', icon: <Pencil />, onSelect: (d) => setEditingDeck(d) },
            {
              key: 'archive',
              label: 'Lưu trữ',
              icon: <Archive />,
              hidden: (d) => d.status === 'archived',
              onSelect: toggleArchive,
            },
            {
              key: 'activate',
              label: 'Khôi phục',
              icon: <ArchiveRestore />,
              hidden: (d) => d.status === 'active',
              onSelect: toggleArchive,
            },
            {
              key: 'remove',
              label: 'Xoá bộ thẻ',
              icon: <Trash2 />,
              danger: true,
              onSelect: (d) => setDeletingDeck(d),
            },
          ]}
        />

        {selectedDeck && (
          <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-foreground">{selectedDeck.title}</p>
                {selectedDeck.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{selectedDeck.description}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">Tổng số thẻ: {cards.length}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <AddButton variant="outline" onClick={() => setEditingCard('new')}>
                  Thêm thẻ
                </AddButton>
                <Button type="button" disabled={cards.length === 0} onClick={() => setStudying(true)}>
                  <PlayCircle className="h-4 w-4" /> Bắt đầu học
                </Button>
              </div>
            </div>

            {cards.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                label="Bộ thẻ này chưa có thẻ nào."
                action={
                  <AddButton variant="outline" onClick={() => setEditingCard('new')}>
                    Thêm thẻ đầu tiên
                  </AddButton>
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((c) => (
                  <FlashcardPreviewCard
                    key={c._id}
                    card={c}
                    onEdit={() => setEditingCard(c)}
                    onDelete={() => setDeletingCard(c)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <DeckFormDialog editing={editingDeck} onClose={() => setEditingDeck(null)} onSaved={invalidateDecks} />
      {selectedDeck && (
        <CardFormDialog
          deckId={selectedDeck._id}
          editing={editingCard}
          onClose={() => setEditingCard(null)}
          onSaved={saveCardsSideEffect}
        />
      )}
      {studying && selectedDeck && (
        <StudyModeDialog deckTitle={selectedDeck.title} cards={cards} onClose={() => setStudying(false)} />
      )}
      <ConfirmDialog
        open={!!deletingDeck}
        onOpenChange={(v) => !v && setDeletingDeck(null)}
        title="Xoá bộ thẻ?"
        description={`Bộ thẻ "${deletingDeck?.title ?? ''}" sẽ bị xoá (chỉ xoá được khi không còn thẻ bên trong).`}
        onConfirm={handleDeleteDeck}
      />
      <ConfirmDialog
        open={!!deletingCard}
        onOpenChange={(v) => !v && setDeletingCard(null)}
        title="Xoá thẻ?"
        description="Thẻ này sẽ bị xoá khỏi bộ."
        onConfirm={handleDeleteCard}
      />
    </AppShell>
  );
}
