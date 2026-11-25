import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { KnowledgeNode } from '@/services/knowledge/types';

// Radix components expect a few browser APIs jsdom lacks.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView = () => {};
Element.prototype.hasPointerCapture = () => false;
Element.prototype.releasePointerCapture = () => {};

const node = (id: string, name: string, extra: Partial<KnowledgeNode> = {}): KnowledgeNode => ({
  id,
  subject: 'course-1',
  parentNode: null,
  level: 'concept',
  name,
  description: '',
  order: 0,
  status: 'active',
  examFocus: false,
  prerequisites: [],
  source: 'manual',
  noteCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...extra,
});

const NODES: KnowledgeNode[] = [
  node('c1', 'Giới hạn', { level: 'chapter' }),
  node('t1', 'Giới hạn hàm số', { level: 'topic', parentNode: 'c1' }),
  node('k1', 'Giới hạn một phía', { parentNode: 't1' }),
  node('k2', 'Liên tục', { parentNode: 't1', prerequisites: ['k1'], examFocus: true }),
];

const api = vi.hoisted(() => ({
  getKnowledgeTree: vi.fn(),
  searchKnowledgeNodes: vi.fn(),
  createKnowledgeNode: vi.fn(),
  listConceptNotes: vi.fn(),
  listStudentSubjects: vi.fn(),
}));

vi.mock('@/services/student-subject', () => ({ listStudentSubjects: api.listStudentSubjects }));
vi.mock('@/services/knowledge', async () => {
  const actual = await vi.importActual<typeof import('@/services/knowledge')>('@/services/knowledge');
  return {
    ...actual,
    getKnowledgeTree: api.getKnowledgeTree,
    searchKnowledgeNodes: api.searchKnowledgeNodes,
    createKnowledgeNode: api.createKnowledgeNode,
    listConceptNotes: api.listConceptNotes,
  };
});

import StudentKnowledgeStructurePage from './index';

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <StudentKnowledgeStructurePage />
    </QueryClientProvider>,
  );
}

describe('StudentKnowledgeStructurePage', () => {
  beforeEach(() => {
    api.listStudentSubjects.mockResolvedValue({
      data: [{ _id: 'course-1', customTitle: 'Giải tích 1', concept: null, pinned: false, displayOrder: 0 }],
    });
    api.getKnowledgeTree.mockResolvedValue({
      subject: { id: 'course-1', title: 'Giải tích 1', conceptId: null },
      nodes: NODES,
    });
    api.listConceptNotes.mockResolvedValue([]);
    api.searchKnowledgeNodes.mockResolvedValue([]);
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows the course structure as a tree', async () => {
    renderPage();
    const tree = await screen.findByRole('tree', { name: 'Cấu trúc kiến thức' });
    expect(within(tree).getByText('Giới hạn')).toBeTruthy();
    expect(within(tree).getByText('Giới hạn hàm số')).toBeTruthy();
    expect(within(tree).getByText('Liên tục')).toBeTruthy();
    expect(api.getKnowledgeTree).toHaveBeenCalledWith('course-1', expect.anything());
  });

  it('shows details, prerequisites and the notes box when a concept is selected', async () => {
    renderPage();
    const tree = await screen.findByRole('tree');
    fireEvent.click(within(tree).getByText('Liên tục'));

    const details = await screen.findByLabelText('Chi tiết');
    expect(within(details).getByRole('heading', { name: 'Liên tục' })).toBeTruthy();
    expect(within(details).getByText('Quan hệ tiên quyết')).toBeTruthy();
    // "Giới hạn một phía" is listed as something to learn first.
    expect(within(details).getByRole('button', { name: 'Giới hạn một phía' })).toBeTruthy();
    expect(within(details).getByText(/Ghi chú của tôi/)).toBeTruthy();
    await waitFor(() => expect(api.listConceptNotes).toHaveBeenCalledWith('k2'));
  });

  it('collapses a branch when its arrow is clicked', async () => {
    renderPage();
    const tree = await screen.findByRole('tree');
    expect(within(tree).getByText('Giới hạn một phía')).toBeTruthy();
    fireEvent.click(within(tree).getAllByRole('button', { name: 'Thu gọn' })[0]);
    expect(within(tree).queryByText('Giới hạn một phía')).toBeNull();
  });

  it('creates a new chapter from the "Thêm chương" dialog', async () => {
    api.createKnowledgeNode.mockResolvedValue(node('c2', 'Đạo hàm', { level: 'chapter' }));
    renderPage();
    await screen.findByRole('tree');

    fireEvent.click(screen.getByRole('button', { name: /Thêm chương/ }));
    const dialog = await screen.findByRole('dialog');
    const name = within(dialog).getByRole('textbox', { name: /Tên chương/ });
    fireEvent.change(name, { target: { value: 'Đạo hàm' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thêm mới' }));

    await waitFor(() =>
      expect(api.createKnowledgeNode).toHaveBeenCalledWith('course-1', {
        name: 'Đạo hàm',
        description: '',
        examFocus: false,
        parentNode: null,
      }),
    );
  });

  it('asks the student to add a course first when there are none', async () => {
    api.listStudentSubjects.mockResolvedValue({ data: [] });
    renderPage();
    expect(await screen.findByText(/chưa có môn học nào/i)).toBeTruthy();
  });
});
