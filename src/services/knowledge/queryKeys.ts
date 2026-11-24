export const knowledgeKeys = {
  all: ['knowledge-items'] as const,
  lists: () => [...knowledgeKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...knowledgeKeys.lists(), filters] as const,
  detail: (id: string) => [...knowledgeKeys.all, 'detail', id] as const,
  subjectGraph: (subjectId: string) => [...knowledgeKeys.all, 'subjectGraph', subjectId] as const,
};
