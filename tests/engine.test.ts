import { describe, expect, it } from 'vitest';
import { assess, createPlan, qualificationFor, skillIds, skillMultiplier, validateResourceGraph } from '../src/shared/engine';
import { initialSnapshot, profiles, resources, roles, seedMappings, sources } from '../src/shared/catalogue';
import type { Mapping, Profile, Resource, Role, Snapshot } from '../src/shared/types';

const copy = <T>(x: T): T => structuredClone(x);
const aina = () => copy(profiles[0]);
const qa = () => copy(roles[0]);
const score = (profile = aina(), snapshot = initialSnapshot, scenario: 'moderate' | 'fast' = 'moderate') => assess(profile, snapshot, scenario, [qa()])[0];
const approved = (overrides: Partial<Mapping> = {}): Mapping => ({ ...copy(seedMappings[0]), status: 'approved', reviewedAt: '2026-10-21T10:00:00.000Z', ...overrides });
const withMappings = (...mappings: Mapping[]): Snapshot => ({ ...initialSnapshot, id: 'snapshot-test', version: 2, mappings });
const resource = (id: string, skill: 'measurement' | 'inspection' | 'records' | 'quality_data' | 'ai_inspection' | 'root_cause', cost = 0, prerequisites: string[] = []): Resource => ({ id, title: id, provider: 'Synthetic test fixture', url: 'https://example.com', skillIds: [skill], prerequisites, providerMinutes: null, practiceMinutes: 60, learningCost: cost, certificationCost: null, costNote: 'Synthetic test fixture', verifiedAt: '2026-10-21', kind: 'practice', description: 'Test exercise', outcome: 'Test output' });

describe('deterministic six-skill assessment', () => {
  it('normalizes each level against the requirement rather than averaging raw proficiency', () => {
    const role = qa();
    role.required = { measurement: 4, inspection: 2, records: 0, quality_data: 0, ai_inspection: 0, root_cause: 0 };
    role.weights = { measurement: 3, inspection: 1, records: 0, quality_data: 0, ai_inspection: 0, root_cause: 0 };
    const profile = aina();
    profile.skills.measurement = 2;
    profile.skills.inspection = 2;
    const result = assess(profile, initialSnapshot, 'moderate', [role])[0];
    expect(result.score).toBe(62.5);
    expect(result.contributions.reduce((sum, c) => sum + (c.points ?? 0), 0)).toBe(62.5);
  });

  it('keeps unknown levels separate from zero and reports a weighted range', () => {
    const unknown = aina();
    unknown.skills.ai_inspection = null;
    const result = score(unknown);
    const zero = aina(); zero.skills.ai_inspection = 0;
    const maximum = aina(); maximum.skills.ai_inspection = 4;
    expect(result.score).toBeNull();
    expect(result.lowerScore).toBe(score(zero).score);
    expect(result.upperScore).toBe(score(maximum).score);
    expect(result.completeness).toBe(82);
    expect(result.contributions.find(c => c.skillId === 'ai_inspection')!.gap).toBeNull();
  });

  it('returns a full uncertainty interval when all weighted skills are unknown', () => {
    const profile = aina(); skillIds.forEach(id => { profile.skills[id] = null; });
    expect(score(profile)).toMatchObject({ score: null, lowerScore: 0, upperScore: 100, completeness: 0 });
  });

  it('returns identical known bounds at the half-cent rounding boundary', () => {
    const profile = aina();
    profile.skills = { measurement: 2.5, inspection: 3.5, records: 3.5, quality_data: 3.5, ai_inspection: 3, root_cause: 4 };
    const result = assess(profile, initialSnapshot, 'moderate', [roles.find(r => r.id === 'calibration')!])[0];
    expect(result).toMatchObject({ score: 86.88, lowerScore: 86.88, upperScore: 86.88, completeness: 100 });
  });

  it('keeps a partial-profile interval ordered and contains every resolved value of the unknown skill', () => {
    const profile = aina();
    profile.skills = { measurement: 2.5, inspection: 3.5, records: 3.5, quality_data: 3.5, ai_inspection: null, root_cause: 4 };
    const role = roles.find(r => r.id === 'calibration')!;
    for (const scenario of ['moderate', 'fast'] as const) {
      const snapshot = withMappings(approved());
      const range = assess(profile, snapshot, scenario, [role])[0];
      expect(range.score).toBeNull();
      expect(range.lowerScore).toBeLessThanOrEqual(range.upperScore);
      expect(range.lowerScore).toBeGreaterThanOrEqual(0);
      expect(range.upperScore).toBeLessThanOrEqual(100);
      for (let level = 0; level <= 4; level += 0.5) {
        const resolved = copy(profile); resolved.skills.ai_inspection = level;
        const point = assess(resolved, snapshot, scenario, [role])[0];
        expect(point.lowerScore).toBe(point.upperScore);
        expect(point.score).toBeGreaterThanOrEqual(range.lowerScore);
        expect(point.score).toBeLessThanOrEqual(range.upperScore);
      }
    }
  });

  it('includes the fully resolved upper endpoint when several unknown skills land on a rounding boundary', () => {
    const profile = aina();
    profile.skills = { measurement: 3.5, inspection: 3.5, records: null, quality_data: 1.5, ai_inspection: 1.5, root_cause: null };
    const role = roles.find(r => r.id === 'calibration')!;
    const range = assess(profile, initialSnapshot, 'moderate', [role])[0];
    const resolved = copy(profile); resolved.skills.records = 4; resolved.skills.root_cause = 4;
    const maximum = assess(resolved, initialSnapshot, 'moderate', [role])[0];
    expect(range.upperScore).toBe(90.83);
    expect(range.upperScore).toBe(maximum.score);
    expect(range.lowerScore).toBeLessThanOrEqual(range.upperScore);
  });

  it('does not award perfect alignment for a zero denominator', () => {
    const role = qa(); skillIds.forEach(id => { role.weights[id] = 0; });
    const result = assess(aina(), initialSnapshot, 'moderate', [role])[0];
    expect(result).toMatchObject({ score: null, lowerScore: 0, upperScore: 0, completeness: 0 });
    expect(result.explanation).toContain('cannot be calculated');
  });

  it('is monotonic in each known skill under a fixed scenario and snapshot', () => {
    for (const role of roles) for (const skill of skillIds) {
      let previous = -1;
      for (let level = 0; level <= 4; level += 0.25) {
        const profile = aina(); profile.skills[skill] = level;
        const result = assess(profile, withMappings(approved()), 'fast', [role])[0].score!;
        expect(result).toBeGreaterThanOrEqual(previous);
        previous = result;
      }
    }
  });

  it('does not use a person’s name to change the assessment', () => {
    const profile = aina(); profile.name = 'A different synthetic name';
    expect(assess(profile, initialSnapshot, 'moderate', roles)).toEqual(assess(aina(), initialSnapshot, 'moderate', roles));
  });

  it('uses stable role-id tie breaking independent of catalogue input order', () => {
    const a = { ...qa(), id: 'a' }; const b = { ...qa(), id: 'b' };
    expect(assess(aina(), initialSnapshot, 'moderate', [b, a]).map(x => x.roleId)).toEqual(['a', 'b']);
  });

  it('rejects invalid profile levels instead of silently coercing them', () => {
    const profile = aina(); profile.skills.records = Number.NaN;
    expect(() => score(profile)).toThrow('between 0 and 4');
  });
});

describe('evidence restraint and scenario bounds', () => {
  it('pending or rejected evidence cannot affect an assessment', () => {
    for (const status of ['pending', 'rejected'] as const) {
      expect(score(aina(), withMappings(approved({ status })))).toEqual(score());
    }
  });

  it('an irrelevant approved fixture cannot change the assessment or selected resources', () => {
    const snapshot = withMappings(approved({ ...seedMappings[1], status: 'approved', deltaFast: 1, deltaModerate: 1, reviewedAt: '2026-10-21T10:00:00.000Z' }));
    expect(score(aina(), snapshot)).toEqual(score());
    expect(createPlan(aina(), snapshot, 'moderate', 'qa', roles, resources).steps).toEqual(createPlan(aina(), initialSnapshot, 'moderate', 'qa', roles, resources).steps);
  });

  it('related research without a supporting passage cannot affect weights', () => {
    const snapshot = withMappings(approved({ ...seedMappings[2], status: 'approved', deltaFast: 0.5, reviewedAt: '2026-10-21T10:00:00.000Z' }));
    expect(skillMultiplier(snapshot, 'ai_inspection', 'fast').multiplier).toBe(1);
  });

  it('an approved deployment interpretation changes only its selected skill weight', () => {
    const snapshot = withMappings(approved());
    expect(skillMultiplier(snapshot, 'ai_inspection', 'moderate').multiplier).toBe(1.2);
    expect(skillMultiplier(snapshot, 'ai_inspection', 'fast').multiplier).toBe(1.5);
    expect(skillMultiplier(snapshot, 'records', 'fast').multiplier).toBe(1);
    expect(score(aina(), snapshot, 'fast').score).toBeLessThan(score().score!);
  });

  it('bounds multipliers and does not stack duplicate same-direction claims', () => {
    expect(skillMultiplier(withMappings(approved({ deltaFast: 99 })), 'ai_inspection', 'fast').multiplier).toBe(2);
    expect(skillMultiplier(withMappings(approved({ deltaFast: -99 })), 'ai_inspection', 'fast').multiplier).toBe(0.5);
    const duplicate = approved({ id: 'same-claim-another-source' });
    expect(score(aina(), withMappings(approved(), duplicate), 'fast')).toEqual(score(aina(), withMappings(approved()), 'fast'));
  });

  it('does not select a direction automatically when approved interpretations conflict', () => {
    const snapshot = withMappings(approved(), approved({ id: 'counter-evidence', deltaFast: -0.2, deltaModerate: -0.1 }));
    expect(skillMultiplier(snapshot, 'ai_inspection', 'fast')).toMatchObject({ multiplier: 1 });
    expect(skillMultiplier(snapshot, 'ai_inspection', 'fast').rationale).toContain('Conflicting');
  });
});

describe('qualification checks stay separate from skill alignment', () => {
  const explicitRuleRole = (): Role => ({ ...qa(), id: 'test-qualified-route', currentRole: false, rule: { accepted: ['academic_diploma'], fieldIncludes: ['engineering'], minExperience: 2, sourceId: 'synthetic-test-rule', scope: 'Synthetic test-only diploma route', verified: true } });

  it('does not invent a universal diploma requirement for seeded adjacent routes', () => {
    for (const profile of profiles) {
      expect(qualificationFor(profile, roles[0]).qualification).toBe('met');
      expect(qualificationFor(profile, roles[1]).qualification).toBe('unknown');
      expect(qualificationFor(profile, roles[2]).qualification).toBe('unknown');
    }
  });

  it('changes eligibility under a specific verified rule without changing skill coverage', () => {
    const diploma = aina(); const certificate = aina(); certificate.qualification = 'skm3';
    const role = explicitRuleRole();
    const good = assess(diploma, initialSnapshot, 'moderate', [role])[0];
    const other = assess(certificate, initialSnapshot, 'moderate', [role])[0];
    expect(good.qualification).toBe('met'); expect(other.qualification).toBe('unmet');
    expect(good.score).toBe(other.score);
  });

  it('does not infer DKM equivalence or known qualifications from missing fields', () => {
    const profile = aina(); profile.qualification = 'dkm4';
    expect(qualificationFor(profile, explicitRuleRole()).qualification).toBe('unmet');
    profile.qualification = 'unknown';
    expect(qualificationFor(profile, explicitRuleRole()).qualification).toBe('unknown');
    profile.qualification = 'academic_diploma'; profile.field = '';
    expect(qualificationFor(profile, explicitRuleRole()).qualification).toBe('unknown');
  });

  it('does not enforce an unverified or unsourced requirement as fact', () => {
    const role = explicitRuleRole(); role.rule!.verified = false;
    expect(qualificationFor(aina(), role).qualification).toBe('unknown');
    role.rule!.verified = true; role.rule!.sourceId = null;
    expect(qualificationFor(aina(), role).qualification).toBe('unknown');
  });

  it('ranks prerequisite groups before a higher numerical overlap', () => {
    const unattainable = explicitRuleRole(); unattainable.id = 'a-high-score';
    skillIds.forEach(id => { unattainable.required[id] = 0.1; });
    const profile = aina(); profile.qualification = 'skm3';
    const results = assess(profile, initialSnapshot, 'moderate', [unattainable, qa(), roles[1]]);
    expect(results.map(r => r.qualification)).toEqual(['met', 'unknown', 'unmet']);
    expect(results.at(-1)!.score).toBe(100);
  });
});

describe('prerequisite-aware affordable starter plans', () => {
  it('produces an ordered baseline plan, effort and cost from catalogue values', () => {
    const plan = createPlan(aina(), initialSnapshot, 'moderate', 'qa', roles, resources);
    const selected = new Set<string>();
    for (const step of plan.steps) { step.prerequisiteIds.forEach(id => expect(selected.has(id)).toBe(true)); selected.add(step.resourceId); }
    expect(plan.steps).toHaveLength(4);
    expect(plan.totalMinutes).toBe(960);
    expect(plan.weeks).toBe(4);
    expect(plan.learningCost).toBe(0);
    expect(plan.warnings.some(w => w.includes('team planning estimates'))).toBe(true);
  });

  it('reflects weekly time without claiming a fixed completion deadline', () => {
    const profile = aina(); profile.weeklyHours = 2;
    expect(createPlan(profile, initialSnapshot, 'moderate', 'qa', roles, resources).weeks).toBe(8);
    profile.weeklyHours = 0;
    const plan = createPlan(profile, initialSnapshot, 'moderate', 'qa', roles, resources);
    expect(plan.steps).toEqual([]); expect(plan.weeks).toBe(0);
    expect(plan.warnings.join(' ')).toContain('positive weekly study allowance');
  });

  it('keeps the original plan pace and budget after profile edits and captures new constraints in a new revision', () => {
    const profile = aina();
    const original = createPlan(profile, initialSnapshot, 'moderate', 'qa', roles, resources);
    const saved = structuredClone(original);
    expect(original.constraints).toEqual({ weeklyHours: 4, budget: 0 });
    expect(original.weeks).toBe(4);
    profile.weeklyHours = 8;
    profile.budget = 50;
    profile.version += 1;
    const revised = createPlan(profile, initialSnapshot, 'moderate', 'qa', roles, resources);
    expect(revised.constraints).toEqual({ weeklyHours: 8, budget: 50 });
    expect(revised.weeks).toBe(2);
    expect(original).toEqual(saved);
    expect(revised.id).not.toBe(original.id);
    expect(revised.profileVersion).toBe(original.profileVersion + 1);
  });

  it('retains the input constraints even when no feasible steps can be scheduled', () => {
    const profile = aina(); profile.weeklyHours = 0; profile.budget = 17;
    const plan = createPlan(profile, initialSnapshot, 'moderate', 'qa', roles, resources);
    expect(plan.steps).toEqual([]);
    expect(plan.constraints).toEqual({ weeklyHours: 0, budget: 17 });
  });

  it('includes prerequisite cost in the budget and rejects unaffordable bundles', () => {
    const profile = aina(); profile.budget = 5;
    const items = [resource('paid-foundation', 'measurement', 4), resource('goal', 'ai_inspection', 3, ['paid-foundation'])];
    const plan = createPlan(profile, initialSnapshot, 'moderate', 'qa', roles, items);
    expect(plan.steps).toEqual([]);
    expect(plan.learningCost).toBeLessThanOrEqual(profile.budget);
    expect(plan.warnings.join(' ')).toContain('No affordable');
    profile.budget = 7;
    const affordable = createPlan(profile, initialSnapshot, 'moderate', 'qa', roles, items);
    expect(affordable.steps.map(s => s.resourceId)).toEqual(['paid-foundation', 'goal']);
    expect(affordable.learningCost).toBe(7);
  });

  it('does not silently price unknown learning at zero', () => {
    const item = resource('unknown-price', 'ai_inspection'); item.learningCost = null;
    const plan = createPlan(aina(), initialSnapshot, 'moderate', 'qa', roles, [item]);
    expect(plan.steps).toEqual([]); expect(plan.unknownCost).toBe(true);
    expect(plan.warnings.join(' ')).toContain('unknown learning prices were excluded');
  });

  it('rejects cycles, dangling edges and duplicate resources', () => {
    expect(() => validateResourceGraph([resource('a', 'records', 0, ['b']), resource('b', 'quality_data', 0, ['a'])])).toThrow('cycle');
    expect(() => validateResourceGraph([resource('a', 'records', 0, ['missing'])])).toThrow('Missing learning prerequisite');
    expect(() => validateResourceGraph([resource('a', 'records'), resource('a', 'records')])).toThrow('Duplicate');
  });

  it('does not turn progress into increased profile proficiency', () => {
    const profile = aina(); const before = score(profile);
    const plan = createPlan(profile, initialSnapshot, 'moderate', 'qa', roles, resources);
    plan.completed = plan.steps.map(s => s.resourceId);
    expect(score(profile)).toEqual(before);
    expect(profile).toEqual(aina());
  });

  it('keeps selected steps stable for fixed inputs and never mutates evidence', () => {
    const snapshot = withMappings(approved()); const original = copy(snapshot);
    const first = createPlan(aina(), snapshot, 'fast', 'qa', roles, resources);
    const second = createPlan(aina(), snapshot, 'fast', 'qa', roles, [...resources].reverse());
    expect(first.id).toBe(second.id); expect(first.steps).toEqual(second.steps); expect(snapshot).toEqual(original);
  });

  it('does not invent a learning gap when every skill is unknown', () => {
    const profile = aina(); skillIds.forEach(id => { profile.skills[id] = null; });
    const plan = createPlan(profile, initialSnapshot, 'moderate', 'qa', roles, resources);
    expect(plan.steps).toEqual([]);
    expect(plan.warnings.join(' ')).toContain('Unknown proficiency is not treated as zero');
  });
});

describe('curated source integrity', () => {
  it('keeps real dates precise and every role source resolvable', () => {
    expect(sources.find(s => s.id === 'intel-inline-2023')).toMatchObject({ publishedAt: '2023-12', datePrecision: 'month' });
    for (const role of roles) role.sourceIds.forEach(id => expect(sources.some(s => s.id === id)).toBe(true));
    expect(sources.every(s => /^[a-f0-9]{64}$/.test(s.hash))).toBe(true);
  });
  it('starts with pending interpretations and no claimed inference', () => {
    expect(initialSnapshot.mappings).toEqual([]);
    expect(seedMappings.every(m => m.status === 'pending')).toBe(true);
    expect(sources.every(s => !s.live)).toBe(true);
  });
});
