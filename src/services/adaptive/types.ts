export interface AdaptiveConceptRef {
  id: string;
  name: string;
}

export interface NextBestAction {
  concept: AdaptiveConceptRef;
  priority: number;
  reason: string;
}

export interface PriorityQueueItem extends NextBestAction {
  masteryScore: number;
  learningState: string;
}

export interface AdaptiveActivity {
  _id: string;
  owner: string;
  concept: string;
  priority: number;
  reason: string;
  createdAt: string;
}

export interface StartNextBestActionResult {
  activity: AdaptiveActivity;
  concept: AdaptiveConceptRef;
}

export interface ReplanCheckResult {
  needed: boolean;
  missedCount: number;
}

export interface ReplanResult {
  plan: Record<string, unknown>;
  reason: string;
}
