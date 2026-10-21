import type { Plan, ScenarioId } from '../shared/types';

export function latestSavedPlan(plans: Plan[], profileId: string, roleId: string, scenario: ScenarioId): Plan | undefined {
  return plans.filter(plan => plan.profileId === profileId && plan.roleId === roleId && plan.scenario === scenario)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export function nextAvailablePlanStep(plan: Plan) {
  const completed = new Set(plan.completed);
  return plan.steps.find(step => !completed.has(step.resourceId) && step.prerequisiteIds.every(id => completed.has(id)));
}
