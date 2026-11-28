export type RiskWarningType = 'schedule' | 'mastery' | 'decay';
export type RiskSeverity = 'cao' | 'trung_binh' | 'thap';
export type RiskWarningAction = 'replan' | 'keep' | 'snooze';

// N9: hệ thống tự sinh — kèm lý do (BR-12) và hành động đề xuất (BR-13). Không phải self-report.
export interface RiskWarning {
  key: string;
  type: RiskWarningType;
  severity: RiskSeverity;
  title: string;
  reason: string;
  actions: RiskWarningAction[];
  planId?: string;
}

export interface DismissRiskWarningInput {
  key: string;
  action: 'keep' | 'snooze';
}
