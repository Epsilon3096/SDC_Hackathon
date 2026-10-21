import type { Plan, Profile, ScenarioId } from '../shared/types';

export function profileHasChanges(draft: Profile, saved: Profile): boolean {
  return draft.qualification !== saved.qualification || draft.field !== saved.field
    || draft.experienceYears !== saved.experienceYears || draft.weeklyHours !== saved.weeklyHours
    || draft.budget !== saved.budget
    || (Object.keys(saved.skills) as Array<keyof Profile['skills']>).some(skill => draft.skills[skill] !== saved.skills[skill]);
}

export function latestSavedPlan(plans: Plan[], profileId: string, roleId: string, scenario: ScenarioId): Plan | undefined {
  return plans.filter(plan => plan.profileId === profileId && plan.roleId === roleId && plan.scenario === scenario)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export function nextAvailablePlanStep(plan: Plan) {
  const completed = new Set(plan.completed);
  return plan.steps.find(step => !completed.has(step.resourceId) && step.prerequisiteIds.every(id => completed.has(id)));
}

/** Explain the same prerequisite boundary enforced when progress is saved. */
export function planStepProgress(plan: Plan, resourceId: string) {
  const step = plan.steps.find(item => item.resourceId === resourceId);
  const completed = new Set(plan.completed);
  const missingPrerequisites = (step?.prerequisiteIds || []).filter(id => !completed.has(id));
  const affected = new Set([resourceId]);
  let found = true;
  while (found) {
    found = false;
    for (const candidate of plan.steps) {
      if (!affected.has(candidate.resourceId) && candidate.prerequisiteIds.some(id => affected.has(id))) {
        affected.add(candidate.resourceId);
        found = true;
      }
    }
  }
  return {
    missingPrerequisites,
    completedDependents: plan.steps.filter(item => item.resourceId !== resourceId && affected.has(item.resourceId) && completed.has(item.resourceId)),
  };
}
