import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  AddSessionInput,
  CloseGoalInput,
  CreateGoalInput,
  CreatePlanInput,
  DailyPlan,
  DraftGoalInput,
  DraftGoalResult,
  Goal,
  GoalFilters,
  PauseGoalInput,
  Plan,
  PlanFilters,
  SessionQuizAnswer,
  SessionQuizResult,
  UpdateGoalInput,
  UpdateSessionInput,
} from './types';

export async function listPlans(filters: PlanFilters = {}): Promise<ApiSuccess<Plan[]>> {
  const { data } = await request.get<ApiSuccess<Plan[]>>(ENDPOINTS.planningItems.list, { params: filters });
  return data;
}

export async function getPlan(id: string): Promise<Plan> {
  const { data } = await request.get<ApiSuccess<Plan>>(ENDPOINTS.planningItems.detail(id));
  return data.data;
}

export async function createPlan(input: CreatePlanInput): Promise<Plan> {
  const { data } = await request.post<ApiSuccess<Plan>>(ENDPOINTS.planningItems.create, input);
  return data.data;
}

export async function confirmPlan(id: string): Promise<Plan> {
  const { data } = await request.patch<ApiSuccess<Plan>>(ENDPOINTS.planningItems.confirm(id), {});
  return data.data;
}

export async function removePlan(id: string): Promise<void> {
  await request.delete(ENDPOINTS.planningItems.detail(id));
}

export async function addSession(planId: string, input: AddSessionInput): Promise<Plan> {
  const { data } = await request.post<ApiSuccess<Plan>>(ENDPOINTS.planningItems.sessions(planId), input);
  return data.data;
}

export async function updateSession(
  planId: string,
  sessionId: string,
  input: UpdateSessionInput,
): Promise<Plan> {
  const { data } = await request.patch<ApiSuccess<Plan>>(
    ENDPOINTS.planningItems.session(planId, sessionId),
    input,
  );
  return data.data;
}

export async function removeSession(planId: string, sessionId: string): Promise<void> {
  await request.delete(ENDPOINTS.planningItems.session(planId, sessionId));
}

// UC-PLN-TPL-03: grades the session's attached quiz; passing unlocks marking it "done".
export async function submitSessionQuiz(
  planId: string,
  sessionId: string,
  answers: SessionQuizAnswer[],
): Promise<SessionQuizResult> {
  const { data } = await request.post<ApiSuccess<SessionQuizResult>>(
    ENDPOINTS.planningItems.sessionQuiz(planId, sessionId),
    { answers },
  );
  return data.data;
}

// "Kế hoạch ngày" (B8 "Hôm nay"); `date` defaults server-side to today. ISO date string (YYYY-MM-DD).
export async function getDailyPlan(date?: string, subjectId?: string): Promise<DailyPlan> {
  const params: Record<string, string> = {};
  if (date) params.date = date;
  if (subjectId) params.subjectId = subjectId;
  const { data } = await request.get<ApiSuccess<DailyPlan>>(ENDPOINTS.planningItems.daily, {
    params: Object.keys(params).length ? params : undefined,
  });
  return data.data;
}

export async function listGoals(filters: GoalFilters = {}): Promise<ApiSuccess<Goal[]>> {
  const { data } = await request.get<ApiSuccess<Goal[]>>(ENDPOINTS.planningItems.goals, { params: filters });
  return data;
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const { data } = await request.post<ApiSuccess<Goal>>(ENDPOINTS.planningItems.goals, input);
  return data.data;
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<Goal> {
  const { data } = await request.patch<ApiSuccess<Goal>>(ENDPOINTS.planningItems.goal(id), input);
  return data.data;
}

export async function removeGoal(id: string): Promise<void> {
  await request.delete(ENDPOINTS.planningItems.goal(id));
}

// B2: upserts the student's single open draft goal, carrying `wizardStep` forward. Phase C step 2:
// the response may also carry `overlapWarning` when the proposed dates clash with another active goal.
export async function saveDraftGoal(input: DraftGoalInput): Promise<DraftGoalResult> {
  const { data } = await request.post<ApiSuccess<DraftGoalResult>>(ENDPOINTS.planningItems.goalDraft, input);
  return data.data;
}

export async function getOpenDraft(): Promise<Goal | null> {
  const { data } = await request.get<ApiSuccess<Goal | null>>(ENDPOINTS.planningItems.goalDraft);
  return data.data;
}

// B7: wizard's final "Xác nhận" step — flips the draft to 'active'.
export async function activateGoal(id: string, input: CreateGoalInput): Promise<Goal> {
  const { data } = await request.post<ApiSuccess<Goal>>(ENDPOINTS.planningItems.goalActivate(id), input);
  return data.data;
}

export async function pauseGoal(id: string, input: PauseGoalInput = {}): Promise<Goal> {
  const { data } = await request.patch<ApiSuccess<Goal>>(ENDPOINTS.planningItems.goalPause(id), input);
  return data.data;
}

export async function resumeGoal(id: string): Promise<Goal> {
  const { data } = await request.patch<ApiSuccess<Goal>>(ENDPOINTS.planningItems.goalResume(id), {});
  return data.data;
}

export async function closeGoal(id: string, input: CloseGoalInput = {}): Promise<Goal> {
  const { data } = await request.patch<ApiSuccess<Goal>>(ENDPOINTS.planningItems.goalClose(id), input);
  return data.data;
}

export async function archiveGoal(id: string): Promise<Goal> {
  const { data } = await request.patch<ApiSuccess<Goal>>(ENDPOINTS.planningItems.goalArchive(id), {});
  return data.data;
}
