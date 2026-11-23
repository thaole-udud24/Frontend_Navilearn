export type RuleCategory = 'AI' | 'RISK' | 'REVISION' | 'MASTERY' | 'GENERAL';

export interface RuleHistoryEntry {
  oldValue: string;
  newValue: string;
  changedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  reason: string;
  changedAt: string;
}

export interface BusinessRule {
  _id: string;
  ruleCode: string;
  name: string;
  category: RuleCategory;
  value: unknown;
  defaultValue: unknown;
  unit?: string;
  description?: string;
  isActive: boolean;
  history: RuleHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface BusinessRuleFilters {
  page?: number;
  limit?: number;
  category?: RuleCategory;
  search?: string;
  isActive?: 'true' | 'false';
}

export interface UpdateBusinessRuleInput {
  value?: unknown;
  name?: string;
  description?: string;
  unit?: string;
  isActive?: boolean;
  reason?: string;
}

export interface ResetBusinessRuleInput {
  reason?: string;
}

export interface CreateBusinessRuleInput {
  ruleCode: string;
  name: string;
  category: RuleCategory;
  value: unknown;
  defaultValue?: unknown;
  unit?: string;
  description?: string;
  isActive?: boolean;
}

export type BusinessRuleItem = BusinessRule;
export type BusinessRuleItemFilters = BusinessRuleFilters;
export type CreateBusinessRuleItemInput = CreateBusinessRuleInput;
