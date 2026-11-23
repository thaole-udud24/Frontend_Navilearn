import { request } from '@/utils/request';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiSuccess } from '@/types/api.d';
import type {
  AddSessionInput,
  CreateGoalInput,
  CreatePlanInput,
  Goal,
  GoalFilters,
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
