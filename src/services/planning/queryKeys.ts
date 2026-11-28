import type { GoalFilters, PlanFilters } from '@/services/planning/types';

export const planningKeys = {
  all: ['planning'] as const,
  plans: (filters: PlanFilters = {}) => [...planningKeys.all, 'plans', filters] as const,
  plan: (id: string) => [...planningKeys.all, 'plan', id] as const,
  goals: (filters: GoalFilters = {}) => [...planningKeys.all, 'goals', filters] as const,
  daily: (date?: string) => [...planningKeys.all, 'daily', date ?? 'today'] as const,
};
