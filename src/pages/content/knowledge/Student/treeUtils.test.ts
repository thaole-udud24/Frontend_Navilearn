import { describe, expect, it } from 'vitest';
import type { KnowledgeNode } from '@/services/knowledge/types';
import { buildTree, dependentsOf, layoutPrerequisites, pathOf, transitiveDependents } from './treeUtils';

const node = (id: string, name: string, extra: Partial<KnowledgeNode> = {}): KnowledgeNode => ({
  id,
  subject: 's',
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
  createdAt: '',
  updatedAt: '',
  ...extra,
});

describe('buildTree', () => {
  it('nests children under parents and sorts by order then name', () => {
    const tree = buildTree([
      node('t1', 'Chủ đề', { level: 'topic', parentNode: 'c1' }),
      node('c2', 'B chương', { level: 'chapter', order: 2 }),
      node('c1', 'A chương', { level: 'chapter', order: 1 }),
      node('k2', 'Zeta', { parentNode: 't1', order: 1 }),
      node('k1', 'Alpha', { parentNode: 't1', order: 1 }),
    ]);
    expect(tree.map((n) => n.name)).toEqual(['A chương', 'B chương']);
    expect(tree[0].children[0].children.map((n) => n.name)).toEqual(['Alpha', 'Zeta']);
  });

  it('turns nodes with a missing parent into roots instead of losing them', () => {
    const tree = buildTree([node('k1', 'Mồ côi', { parentNode: 'gone' })]);
    expect(tree).toHaveLength(1);
  });
});

describe('pathOf', () => {
  it('lists the ancestors outermost first', () => {
    const nodes = [
      node('c', 'Chương', { level: 'chapter' }),
      node('t', 'Chủ đề', { level: 'topic', parentNode: 'c' }),
      node('k', 'Khái niệm', { parentNode: 't' }),
    ];
    expect(pathOf(nodes[2], nodes)).toEqual(['Chương', 'Chủ đề']);
    expect(pathOf(nodes[0], nodes)).toEqual([]);
  });
});

describe('dependentsOf', () => {
  it('finds the concepts that require a given one', () => {
    const nodes = [node('a', 'A'), node('b', 'B', { prerequisites: ['a'] }), node('c', 'C', { prerequisites: ['a', 'b'] })];
    expect(dependentsOf('a', nodes).map((n) => n.id)).toEqual(['b', 'c']);
    expect(dependentsOf('c', nodes)).toEqual([]);
  });
});

describe('transitiveDependents', () => {
  it('follows chains of dependencies and terminates on bad data', () => {
    const chain = [node('a', 'A'), node('b', 'B', { prerequisites: ['a'] }), node('c', 'C', { prerequisites: ['b'] }), node('d', 'D')];
    expect([...transitiveDependents('a', chain)].sort()).toEqual(['b', 'c']);
    const cyclic = [node('x', 'X', { prerequisites: ['y'] }), node('y', 'Y', { prerequisites: ['x'] })];
    expect(transitiveDependents('x', cyclic).size).toBeGreaterThan(0);
  });
});

describe('layoutPrerequisites', () => {
  it('puts a concept one column right of its deepest prerequisite and skips unrelated ones', () => {
    const nodes = [
      node('a', 'A'),
      node('b', 'B', { prerequisites: ['a'] }),
      node('c', 'C', { prerequisites: ['a', 'b'] }),
      node('lonely', 'Đơn độc'),
    ];
    const layout = layoutPrerequisites(nodes);
    const layer = (id: string) => layout.find((p) => p.id === id)?.layer;
    expect(layer('a')).toBe(0);
    expect(layer('b')).toBe(1);
    expect(layer('c')).toBe(2);
    expect(layout.some((p) => p.id === 'lonely')).toBe(false);
  });

  it('stacks concepts of the same column vertically', () => {
    const nodes = [node('a', 'A'), node('b', 'B', { prerequisites: ['a'] }), node('c', 'C', { prerequisites: ['a'] })];
    const layout = layoutPrerequisites(nodes);
    const ys = layout.filter((p) => p.layer === 1).map((p) => p.y);
    expect(new Set(ys).size).toBe(2);
  });

  it('survives a cycle in bad data without looping', () => {
    const nodes = [node('a', 'A', { prerequisites: ['b'] }), node('b', 'B', { prerequisites: ['a'] })];
    expect(() => layoutPrerequisites(nodes)).not.toThrow();
  });
});
