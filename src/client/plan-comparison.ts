import type { Plan } from '../shared/types';

export function comparePlanSteps(before: Plan, after: Plan) {
  if (before.profileId !== after.profileId || before.profileVersion !== after.profileVersion || before.roleId !== after.roleId || before.scenario !== after.scenario) return null;
  const rows = after.steps.map((step, index) => {
    const earlier = before.steps.findIndex(old => old.resourceId === step.resourceId);
    return { id: step.resourceId, title: step.title, from: earlier < 0 ? null : earlier + 1, to: index + 1, reason: step.reason, prerequisiteIds: step.prerequisiteIds, change: earlier < 0 ? 'added' as const : earlier === index ? 'unchanged' as const : 'moved' as const };
  });
  const removed = before.steps.filter(step => !after.steps.some(next => next.resourceId === step.resourceId));
  const orderChanged = before.steps.map(s => s.resourceId).join('|') !== after.steps.map(s => s.resourceId).join('|');
  return { rows, removed, orderChanged, firstStepChanged: before.steps[0]?.resourceId !== after.steps[0]?.resourceId };
}
