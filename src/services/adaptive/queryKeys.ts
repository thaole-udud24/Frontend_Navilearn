export const adaptiveKeys = {
  all: ['adaptive'] as const,
  nextBestAction: () => [...adaptiveKeys.all, 'next-best-action'] as const,
  replanCheck: (planId: string) => [...adaptiveKeys.all, 'replan-check', planId] as const,
};
