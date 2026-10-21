import { describe, expect, it } from 'vitest';
import { seed } from '../server/store';
import { createPlan } from '../shared/engine';
import type { AppState, Mapping, Snapshot } from '../shared/types';
import { rehearsalSteps } from './rehearsal-state';
import { comparePlanSteps } from './plan-comparison';

function workspace() {
  const data: AppState = { ...seed(), connection: { database: 'embedded-postgres', runpod: false, adminConfigured: false, admin: true, reviewMode: 'demo', connector: 'test' } };
  const profile = data.profiles.find(p => p.id === 'farid')!;
  profile.skills.records = 1; profile.skills.quality_data = 0; profile.weeklyHours = 4;
  return { data, profile };
}
function approve(data: AppState) {
  const mapping = data.mappings.find(m => m.id === 'mapping-intel-ai-literacy')!;
  Object.assign(mapping, { status: 'approved', reviewedAt: '2026-10-21T00:00:00Z', reviewNote: 'Checked the exact source and bounded interpretation.' } satisfies Partial<Mapping>);
  return mapping;
}
function publish(data: AppState) {
  const mapping = approve(data);
  const snapshot: Snapshot = { id: 'snapshot-2-test', version: 2, parentId: data.activeSnapshotId, title: 'Reviewed inspection update', publishedAt: '2026-10-21T00:00:00Z', mappings: [structuredClone(mapping)] };
  data.snapshots.push(snapshot); data.activeSnapshotId = snapshot.id;
  return snapshot;
}

describe('guided demonstration proof', () => {
  it('does not mark seeded content or approval as a saved plan or publication', () => {
    const { data } = workspace();
    expect(rehearsalSteps(data).every(step => !step.complete)).toBe(true);
    approve(data);
    expect(rehearsalSteps(data).filter(step => step.complete).map(step => step.id)).toEqual(['review']);
  });
  it('requires matching worker, route and scenario baseline and current adoption', () => {
    const { data, profile } = workspace();
    const baseline = data.snapshots[0];
    data.plans.push(createPlan(profile, baseline, 'fast', 'qa', data.roles, data.resources));
    expect(rehearsalSteps(data)[0].complete).toBe(false);
    data.plans.push(createPlan(profile, baseline, 'moderate', 'qa', data.roles, data.resources));
    const current = publish(data);
    data.plans.push(createPlan(profile, current, 'moderate', 'qa', data.roles, data.resources));
    expect(rehearsalSteps(data).find(step => step.id === 'adopt')!.complete).toBe(true);
    profile.version++;
    expect(rehearsalSteps(data).find(step => step.id === 'adopt')!.complete).toBe(false);
  });
  it('requires rejection of both negative cases and an active supported mapping', () => {
    const { data } = workspace();
    publish(data);
    data.mappings.find(m => m.id === 'mapping-unrelated-chatbot')!.status = 'rejected';
    expect(rehearsalSteps(data).find(step => step.id === 'restraint')!.complete).toBe(false);
    data.mappings.find(m => m.id === 'mapping-research-insufficient')!.status = 'rejected';
    expect(rehearsalSteps(data).find(step => step.id === 'restraint')!.complete).toBe(true);
    data.snapshots.push({ id: 'retired', parentId: data.activeSnapshotId, version: 3, title: 'Retired', mappings: [], publishedAt: '2026-10-21T01:00:00Z' });
    data.activeSnapshotId = 'retired';
    expect(rehearsalSteps(data).find(step => step.id === 'publish')!.complete).toBe(false);
  });
});

describe('visible plan-order comparison', () => {
  it('reports the actual Farid step movement without changing either plan', () => {
    const { data, profile } = workspace();
    const before = createPlan(profile, data.snapshots[0], 'moderate', 'qa', data.roles, data.resources);
    const after = createPlan(profile, publish(data), 'moderate', 'qa', data.roles, data.resources);
    const originals = structuredClone([before, after]);
    const result = comparePlanSteps(before, after)!;
    expect(result.firstStepChanged).toBe(true);
    expect(result.rows.find(row => row.to === 1)?.from).toBe(3);
    expect([before, after]).toEqual(originals);
  });
  it('reports unchanged order honestly for the default Aina case', () => {
    const { data } = workspace(); const aina = data.profiles.find(p => p.id === 'aina')!;
    const before = createPlan(aina, data.snapshots[0], 'moderate', 'qa', data.roles, data.resources);
    const after = createPlan(aina, publish(data), 'moderate', 'qa', data.roles, data.resources);
    expect(comparePlanSteps(before, after)?.orderChanged).toBe(false);
  });
  it('refuses comparisons across profile revisions, scenarios or routes', () => {
    const { data, profile } = workspace();
    const plan = createPlan(profile, data.snapshots[0], 'moderate', 'qa', data.roles, data.resources);
    for (const change of [{ profileVersion: 2 }, { profileId: 'aina' }, { scenario: 'fast' as const }, { roleId: 'process' }]) expect(comparePlanSteps(plan, { ...plan, ...change })).toBeNull();
  });
  it('distinguishes additions and removals from a movement', () => {
    const { data, profile } = workspace();
    const plan = createPlan(profile, data.snapshots[0], 'moderate', 'qa', data.roles, data.resources);
    const after = { ...plan, steps: [plan.steps[1], { ...plan.steps[0], resourceId: 'new-resource' }] };
    const result = comparePlanSteps(plan, after)!;
    expect(result.rows.map(row => row.change)).toEqual(['moved', 'added']);
    expect(result.removed.map(step => step.resourceId)).toContain(plan.steps[0].resourceId);
  });
});
