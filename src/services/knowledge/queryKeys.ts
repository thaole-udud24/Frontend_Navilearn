export const knowledgeKeys = {
  all: ['knowledge-items'] as const,
  lists: () => [...knowledgeKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...knowledgeKeys.lists(), filters] as const,
  detail: (id: string) => [...knowledgeKeys.all, 'detail', id] as const,
  subjectGraph: (subjectId: string) => [...knowledgeKeys.all, 'subjectGraph', subjectId] as const,
};

export const myKnowledgeKeys = {
  all: ['my-knowledge'] as const,
  tree: (subjectId: string, filters: Record<string, unknown>) =>
    [...myKnowledgeKeys.all, 'tree', subjectId, filters] as const,
  treesOf: (subjectId: string) => [...myKnowledgeKeys.all, 'tree', subjectId] as const,
  search: (subjectId: string, q: string) => [...myKnowledgeKeys.all, 'search', subjectId, q] as const,
  notes: (nodeId: string) => [...myKnowledgeKeys.all, 'notes', nodeId] as const,
  proposals: (subjectId: string) => [...myKnowledgeKeys.all, 'proposals', subjectId] as const,
};
