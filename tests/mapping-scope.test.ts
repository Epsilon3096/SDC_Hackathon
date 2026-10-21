import { describe, expect, it } from 'vitest';
import { initialSnapshot, profiles, resources, roles, seedMappings, skills, sources } from '../src/shared/catalogue';
import { buildDecisionBrief } from '../src/shared/decision-brief';
import { assess, createPlan, skillMultiplier } from '../src/shared/engine';
import type { Mapping, Snapshot } from '../src/shared/types';

const approved = (changes: Partial<Mapping> = {}): Mapping => ({ ...structuredClone(seedMappings[0]), status: 'approved', reviewedAt: '2026-10-21T10:00:00Z', ...changes });
const snapshot = (...mappings: Mapping[]): Snapshot => ({ ...initialSnapshot, id: 'scope-test', version: 2, mappings });

describe('role-scoped evidence', () => {
  it('applies the new Intel rule to QA while keeping other routes and their plans unchanged', () => {
    expect(seedMappings[0].roleIds).toEqual(['qa']);
    const evidence = snapshot(approved());
    for (const scenario of ['moderate', 'fast'] as const) {
      const baseline = assess(profiles[0], initialSnapshot, scenario, roles);
      const updated = assess(profiles[0], evidence, scenario, roles);
      expect(updated.find(item => item.roleId === 'qa')!.score).toBeLessThan(baseline.find(item => item.roleId === 'qa')!.score!);
      for (const roleId of ['process', 'calibration']) {
        expect(updated.find(item => item.roleId === roleId)).toEqual(baseline.find(item => item.roleId === roleId));
        expect(createPlan(profiles[0], evidence, scenario, roleId, roles, resources).steps)
          .toEqual(createPlan(profiles[0], initialSnapshot, scenario, roleId, roles, resources).steps);
      }
    }
  });

  it('preserves the historical all-route numeric results for unscoped rules without mutating them', () => {
    const rule = approved(); delete rule.roleIds;
    const evidence = snapshot(rule);
    const before = structuredClone(evidence);
    const results = assess(profiles[0], evidence, 'fast', roles);
    expect(Object.fromEntries(results.map(item => [item.roleId, item.score]))).toEqual({ qa: 61.59, process: 54.25, calibration: 71.95 });
    for (const role of roles) {
      expect(skillMultiplier(evidence, 'ai_inspection', 'fast', role.id).multiplier).toBe(1.5);
      expect(skillMultiplier(evidence, 'ai_inspection', 'fast', role.id).rationale).toContain('Legacy rule with no recorded role scope');
    }
    expect(evidence).toEqual(before);
    expect(evidence.mappings[0]).not.toHaveProperty('roleIds');
  });

  it('never interprets an empty, blank or unknown explicit scope as all routes', () => {
    for (const roleIds of [[], [''], ['not-a-catalogue-role']]) {
      const evidence = snapshot(approved({ roleIds }));
      expect(assess(profiles[0], evidence, 'fast', roles)).toEqual(assess(profiles[0], initialSnapshot, 'fast', roles));
    }
    expect(skillMultiplier(snapshot(approved({ roleIds: [] })), 'ai_inspection', 'fast').multiplier).toBe(1);
  });

  it('checks conflicts within each role rather than cancelling unrelated scoped rules', () => {
    const evidence = snapshot(
      approved({ roleIds: ['qa'] }),
      approved({ id: 'process-only-decrease', roleIds: ['process'], deltaModerate: -0.1, deltaFast: -0.2 }),
    );
    expect(skillMultiplier(evidence, 'ai_inspection', 'fast', 'qa').multiplier).toBe(1.5);
    expect(skillMultiplier(evidence, 'ai_inspection', 'fast', 'process').multiplier).toBe(0.8);
    expect(skillMultiplier(evidence, 'ai_inspection', 'fast', 'calibration').multiplier).toBe(1);
  });

  it('allows explicit multiple-role scope and keeps no-role helper calls available for inspection', () => {
    const evidence = snapshot(approved({ roleIds: ['qa', 'process'] }));
    expect(skillMultiplier(evidence, 'ai_inspection', 'fast', 'qa').multiplier).toBe(1.5);
    expect(skillMultiplier(evidence, 'ai_inspection', 'fast', 'process').multiplier).toBe(1.5);
    expect(skillMultiplier(evidence, 'ai_inspection', 'fast', 'calibration').multiplier).toBe(1);
    expect(skillMultiplier(evidence, 'ai_inspection', 'fast').multiplier).toBe(1.5);
  });

  it('exports selected, legacy and excluded scope honestly in the saved decision brief', () => {
    const scoped = snapshot(approved());
    const calibration = createPlan(profiles[0], scoped, 'fast', 'calibration', roles, resources);
    const context = { roles, resources, skills, sources, snapshots: [scoped] };
    const brief = buildDecisionBrief(calibration, context);
    expect(brief).toContain(`Role scope: ${roles.find(item => item.id === 'qa')!.name}`);
    expect(brief).toContain('Does not apply to this saved route.');
    expect(brief).toContain('Alignment score: 72.28/100');
    const legacy = snapshot(approved({ roleIds: undefined }));
    expect(buildDecisionBrief(createPlan(profiles[0], legacy, 'fast', 'qa', roles, resources), { ...context, snapshots: [legacy] }))
      .toContain('Legacy rule: no role scope was recorded; its original all-route effect is preserved.');
    const empty = snapshot(approved({ roleIds: [] }));
    expect(buildDecisionBrief(createPlan(profiles[0], empty, 'fast', 'qa', roles, resources), { ...context, snapshots: [empty] }))
      .toContain('Empty scope: excluded from scoring; it does not mean all routes.');
  });
});
