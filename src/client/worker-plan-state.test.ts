import { describe, expect, it } from 'vitest';
import { initialSnapshot, profiles, resources, roles } from '../shared/catalogue';
import { createPlan } from '../shared/engine';
import type { Plan } from '../shared/types';
import { latestSavedPlan, nextAvailablePlanStep, planStepProgress, profileHasChanges } from './worker-plan-state';

const original = createPlan(profiles[0], initialSnapshot, 'moderate', 'qa', roles, resources);
const plan = (id: string, changes: Partial<Plan> = {}): Plan => ({ ...original, id, createdAt: '2026-10-21T10:00:00Z', ...changes });

describe('profile edits represent a real worker-input change', () => {
  it('does not treat a clone or server version change as an unsaved edit', () => {
    expect(profileHasChanges(structuredClone(profiles[0]), profiles[0])).toBe(false);
    expect(profileHasChanges({ ...profiles[0], version: 20 }, profiles[0])).toBe(false);
  });
  it('detects a half-step skill change and preserves unknown as distinct from zero', () => {
    const saved = { ...profiles[0], skills: { ...profiles[0].skills, measurement: null } };
    expect(profileHasChanges({ ...saved, skills: { ...saved.skills, measurement: 0 } }, saved)).toBe(true);
    expect(profileHasChanges({ ...saved, skills: { ...saved.skills, inspection: saved.skills.inspection! + 0.5 } }, saved)).toBe(true);
  });
  it('allows no study time to be captured as a genuine constraint', () => {
    expect(profileHasChanges({ ...profiles[0], weeklyHours: 0 }, profiles[0])).toBe(true);
  });
});

describe('the overview follows the accepted plan for its selected context', () => {
  it('does not borrow progress from a newer plan for another worker, role or scenario', () => {
    const accepted = plan('accepted');
    const later = '2026-10-21T11:00:00Z';
    const plans = [accepted, plan('other-role', { roleId: 'process', createdAt: later }), plan('other-scenario', { scenario: 'fast', createdAt: later }), plan('other-worker', { profileId: profiles[1].id, createdAt: later })];
    expect(latestSavedPlan(plans, profiles[0].id, 'qa', 'moderate')?.id).toBe('accepted');
    expect(latestSavedPlan(plans, profiles[0].id, 'calibration', 'moderate')).toBeUndefined();
  });

  it('selects the newest matching revision without sorting the caller’s history', () => {
    const first = plan('first');
    const latest = plan('latest', { createdAt: '2026-10-21T12:00:00Z' });
    const history = [first, latest];
    expect(latestSavedPlan(history, profiles[0].id, 'qa', 'moderate')?.id).toBe('latest');
    expect(history.map(item => item.id)).toEqual(['first', 'latest']);
  });
});

describe('progress prerequisites and dependent completion', () => {
  const steps = [
    { resourceId: 'foundation', title: 'Foundation', prerequisiteIds: [], minutes: 240, priority: 8, reason: 'Start here.' },
    { resourceId: 'analysis', title: 'Analysis', prerequisiteIds: ['foundation'], minutes: 240, priority: 6, reason: 'Use the foundation.' },
    { resourceId: 'investigation', title: 'Investigation', prerequisiteIds: ['analysis'], minutes: 240, priority: 4, reason: 'Use the analysis.' },
    { resourceId: 'independent', title: 'Independent exercise', prerequisiteIds: [], minutes: 240, priority: 3, reason: 'An independent route.' },
  ];

  it('identifies unmet prerequisites before an invalid completion request', () => {
    const saved = plan('saved', { steps, completed: [] });
    expect(planStepProgress(saved, 'analysis').missingPrerequisites).toEqual(['foundation']);
    expect(planStepProgress(saved, 'foundation').missingPrerequisites).toEqual([]);
  });

  it('explains every completed downstream step that will be reset, without including unrelated work', () => {
    const saved = plan('saved', { steps, completed: steps.map(step => step.resourceId) });
    const original = structuredClone(saved);
    expect(planStepProgress(saved, 'foundation').completedDependents.map(step => step.resourceId)).toEqual(['analysis', 'investigation']);
    expect(saved).toEqual(original);
  });

  it('does not claim unfinished downstream work will lose recorded completion', () => {
    const saved = plan('saved', { steps, completed: ['foundation'] });
    expect(planStepProgress(saved, 'foundation').completedDependents).toEqual([]);
  });
});

describe('the next learning action respects progress and prerequisites', () => {
  const steps = [
    { resourceId: 'advanced', title: 'Advanced', prerequisiteIds: ['foundation'], minutes: 240, priority: 10, reason: 'Practice after the foundation.' },
    { resourceId: 'foundation', title: 'Foundation', prerequisiteIds: [], minutes: 240, priority: 5, reason: 'Start here.' },
  ];
  it('skips a higher-priority step while its prerequisite is unfinished', () => {
    expect(nextAvailablePlanStep(plan('plan', { steps, completed: [] }))?.resourceId).toBe('foundation');
  });
  it('offers the dependent step after completion, without repeating the foundation', () => {
    expect(nextAvailablePlanStep(plan('plan', { steps, completed: ['foundation'] }))?.resourceId).toBe('advanced');
  });
  it('has no next action after all steps are complete or when the plan is empty', () => {
    expect(nextAvailablePlanStep(plan('plan', { steps, completed: ['foundation', 'advanced'] }))).toBeUndefined();
    expect(nextAvailablePlanStep(plan('empty', { steps: [], completed: [] }))).toBeUndefined();
  });
});
