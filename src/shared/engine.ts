import type { Assessment, Contribution, Mapping, Plan, Profile, Resource, Role, ScenarioId, SkillId, Snapshot } from './types';

export const ENGINE_VERSION = '1.0.0';
export const skillIds: SkillId[] = ['measurement', 'inspection', 'records', 'quality_data', 'ai_inspection', 'root_cause'];
const skillLabels: Record<SkillId, string> = { measurement: 'measurement and tolerances', inspection: 'visual inspection', records: 'quality documentation', quality_data: 'quality-data analysis', ai_inspection: 'AI-inspection literacy', root_cause: 'root-cause reasoning' };
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const compareId = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export function validateProfile(profile: Profile): void {
  for (const id of skillIds) {
    const value = profile.skills[id];
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 4)) throw new Error(`Skill ${id} must be unknown or between 0 and 4.`);
  }
  if (!Number.isFinite(profile.weeklyHours) || profile.weeklyHours < 0 || profile.weeklyHours > 168) throw new Error('Weekly hours must be between 0 and 168.');
  if (!Number.isFinite(profile.budget) || profile.budget < 0) throw new Error('Budget must be a nonnegative amount.');
  if (!Number.isFinite(profile.experienceYears) || profile.experienceYears < 0) throw new Error('Experience must be nonnegative.');
}

function usableMapping(mapping: Mapping): boolean {
  return mapping.status === 'approved' && !mapping.fixture && !!mapping.sourceId.trim() && !!mapping.passage.trim()
    && !!mapping.implication.trim() && !!mapping.rationale.trim() && !!mapping.reviewedAt
    && Number.isFinite(mapping.deltaModerate) && Number.isFinite(mapping.deltaFast);
}

/** A similarity score never reaches this function. Only reviewed, published mappings do. */
export function skillMultiplier(snapshot: Snapshot, skillId: SkillId, scenario: ScenarioId): { multiplier: number; rationale: string } {
  const candidates = snapshot.mappings.filter(m => m.skillId === skillId && usableMapping(m));
  const delta = (m: Mapping) => scenario === 'fast' ? m.deltaFast : m.deltaModerate;
  const positive = candidates.some(m => delta(m) > 0);
  const negative = candidates.some(m => delta(m) < 0);
  if (positive && negative) return { multiplier: 1, rationale: 'Conflicting approved interpretations: keep the baseline weight until the conflict is reviewed.' };
  const chosen = [...candidates].sort((a, b) => Math.abs(delta(b)) - Math.abs(delta(a)) || compareId(a.id, b.id))[0];
  if (!chosen || delta(chosen) === 0) return { multiplier: 1, rationale: 'Baseline modelling weight; no applicable approved adjustment.' };
  const multiplier = clamp(1 + delta(chosen), 0.5, 2);
  return { multiplier, rationale: `Reviewed mapping ${chosen.id}: ${chosen.rationale} Multiplier ${round(multiplier)}×; strongest same-direction adjustment only. Scenario assumption, not a forecast.` };
}

export function qualificationFor(profile: Profile, role: Role): Pick<Assessment, 'qualification' | 'qualificationReason'> {
  const rule = role.rule;
  if (!rule && role.currentRole) return { qualification: 'met', qualificationReason: 'This route develops skills within the assumed current QA role. No new-job eligibility or professional qualification is certified.' };
  if (!rule || !rule.verified || !rule.sourceId) return { qualification: 'unknown', qualificationReason: 'Entry requirements need verification for a specific employer or training route. Skill alignment does not establish eligibility.' };
  if (rule.minExperience !== undefined && profile.experienceYears < rule.minExperience) return { qualification: 'unmet', qualificationReason: `${rule.scope}: requires at least ${rule.minExperience} years of experience; profile has ${profile.experienceYears}.` };
  const field = profile.field.trim().toLowerCase();
  if (rule.fieldIncludes?.length && field && !rule.fieldIncludes.some(f => field.includes(f.toLowerCase()))) return { qualification: 'unmet', qualificationReason: `${rule.scope}: the stated field does not match this specific route requirement. Verify the field with the provider.` };
  if (rule.accepted.length && profile.qualification === 'unknown') return { qualification: 'unknown', qualificationReason: `${rule.scope}: qualification is unknown; verify it against the cited requirement.` };
  if (rule.accepted.length && !rule.accepted.includes(profile.qualification)) return { qualification: 'unmet', qualificationReason: `${rule.scope}: the stated qualification is not in this specific route's accepted list. No equivalence has been assumed.` };
  if (rule.fieldIncludes?.length && !field) return { qualification: 'unknown', qualificationReason: `${rule.scope}: the qualification field has not been supplied.` };
  return { qualification: 'met', qualificationReason: `${rule.scope}: stated profile meets the recorded rule. This is a self-reported check, not admission or employment approval.` };
}

export function assess(profile: Profile, snapshot: Snapshot, scenario: ScenarioId, roles: Role[]): Assessment[] {
  validateProfile(profile);
  if (scenario !== 'moderate' && scenario !== 'fast') throw new Error('Unknown scenario.');
  const results = roles.map(role => {
    const contributions: Contribution[] = skillIds.map(skillId => {
      const required = role.required[skillId];
      const base = role.weights[skillId];
      if (!Number.isFinite(required) || required < 0 || required > 4 || !Number.isFinite(base) || base < 0) throw new Error(`Invalid requirement or weight for ${role.id}/${skillId}.`);
      const { multiplier, rationale } = skillMultiplier(snapshot, skillId, scenario);
      const weight = required === 0 ? 0 : base * multiplier;
      const level = profile.skills[skillId];
      const coverage = required === 0 ? 1 : level === null ? null : clamp(level / required, 0, 1);
      return { skillId, level, required, weight, coverage, points: null, gap: coverage === null ? null : 1 - coverage, rationale };
    });
    const denominator = contributions.reduce((sum, c) => sum + c.weight, 0);
    const knownWeight = contributions.reduce((sum, c) => sum + (c.coverage === null ? 0 : c.weight), 0);
    const knownPoints = contributions.reduce((sum, c) => sum + c.weight * (c.coverage ?? 0), 0);
    const lowerScore = denominator > 0 ? 100 * knownPoints / denominator : 0;
    const upperScore = denominator > 0 ? 100 * (knownPoints + denominator - knownWeight) / denominator : 0;
    const complete = contributions.every(c => c.weight === 0 || c.coverage !== null);
    contributions.forEach(c => { c.points = denominator > 0 && c.coverage !== null ? 100 * c.weight * c.coverage / denominator : null; });
    return {
      roleId: role.id, score: denominator > 0 && complete ? round(lowerScore) : null,
      lowerScore: round(lowerScore), upperScore: round(upperScore), completeness: denominator > 0 ? round(100 * knownWeight / denominator) : 0,
      ...qualificationFor(profile, role), contributions,
      explanation: denominator === 0 ? 'No weighted requirements are available; an alignment score cannot be calculated.' : `${complete ? 'Weighted coverage' : 'Lower–upper range with unknown skill levels'} across six selected skills only. Requirements and base weights are modelling assumptions; this is not occupational readiness, hiring probability or a forecast.`,
      rank: 0,
    } satisfies Assessment;
  });
  const group = { met: 0, unknown: 1, unmet: 2 };
  results.sort((a, b) => group[a.qualification] - group[b.qualification] || b.lowerScore - a.lowerScore || b.completeness - a.completeness || compareId(a.roleId, b.roleId));
  return results.map((result, index) => ({ ...result, rank: index + 1 }));
}

export function validateResourceGraph(resources: Resource[]): void {
  const lookup = new Map<string, Resource>();
  for (const resource of resources) {
    if (lookup.has(resource.id)) throw new Error(`Duplicate learning resource: ${resource.id}.`);
    if (!Number.isFinite(resource.practiceMinutes) || resource.practiceMinutes < 0 || (resource.providerMinutes !== null && (!Number.isFinite(resource.providerMinutes) || resource.providerMinutes < 0))) throw new Error(`Invalid learning duration: ${resource.id}.`);
    if (resource.learningCost !== null && (!Number.isFinite(resource.learningCost) || resource.learningCost < 0)) throw new Error(`Invalid learning cost: ${resource.id}.`);
    lookup.set(resource.id, resource);
  }
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const visit = (id: string) => {
    if (visiting.has(id)) throw new Error(`Learning prerequisite cycle includes ${id}.`);
    if (visited.has(id)) return;
    const resource = lookup.get(id);
    if (!resource) throw new Error(`Missing learning prerequisite: ${id}.`);
    visiting.add(id);
    for (const prerequisite of resource.prerequisites) visit(prerequisite);
    visiting.delete(id);
    visited.add(id);
  };
  for (const resource of resources) visit(resource.id);
}

function stableId(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(36);
}

/** A transparent greedy starter planner. Completion is deliberately not an input to skill scoring. */
export function createPlan(profile: Profile, snapshot: Snapshot, scenario: ScenarioId, roleId: string, roles: Role[], resources: Resource[]): Plan {
  validateProfile(profile);
  validateResourceGraph(resources);
  const assessment = assess(profile, snapshot, scenario, roles).find(a => a.roleId === roleId);
  if (!assessment) throw new Error(`Unknown role: ${roleId}.`);
  const other = assess(profile, snapshot, scenario === 'fast' ? 'moderate' : 'fast', roles).find(a => a.roleId === roleId)!;
  const denominator = assessment.contributions.reduce((sum, c) => sum + c.weight, 0);
  const otherDenominator = other.contributions.reduce((sum, c) => sum + c.weight, 0);
  const priority = new Map<SkillId, number>();
  const selectedPriority = new Map<SkillId, number>();
  for (const c of assessment.contributions) {
    const otherWeight = other.contributions.find(o => o.skillId === c.skillId)!.weight;
    const importance = denominator > 0 ? c.weight / denominator : 0;
    const sharedImportance = Math.min(importance, otherDenominator > 0 ? otherWeight / otherDenominator : 0);
    // Prefer shared gaps; the selected scenario has a small, disclosed tie-breaking influence.
    priority.set(c.skillId, c.gap === null ? 0 : sharedImportance * c.gap);
    selectedPriority.set(c.skillId, c.gap === null ? 0 : importance * c.gap);
  }
  const warnings: string[] = [];
  if (assessment.qualification !== 'met') warnings.push(assessment.qualificationReason);
  if (assessment.completeness < 100) warnings.push('Unknown proficiency is not treated as zero. This draft covers only stated gaps; provide the missing levels before relying on it.');
  if (denominator === 0) warnings.push('No weighted role requirements are available, so no learning priorities can be inferred.');
  const lookup = new Map(resources.map(r => [r.id, r]));
  const selected = new Set<string>();
  const covered = new Set<SkillId>();
  const steps: Plan['steps'] = [];
  let learningCost = 0;
  let unknownCost = false;
  const minutes = (r: Resource) => (r.providerMinutes ?? 0) + r.practiceMinutes;
  const relevant = (r: Resource) => r.skillIds.some(id => (priority.get(id) ?? 0) > 0 || (selectedPriority.get(id) ?? 0) > 0);
  const closure = (id: string): Resource[] => {
    const ordered: Resource[] = [];
    const added = new Set<string>();
    const visit = (resourceId: string) => {
      if (selected.has(resourceId) || added.has(resourceId)) return;
      const resource = lookup.get(resourceId)!;
      for (const prerequisite of [...resource.prerequisites].sort(compareId)) visit(prerequisite);
      added.add(resourceId);
      ordered.push(resource);
    };
    visit(id);
    return ordered;
  };
  if (profile.weeklyHours === 0) warnings.push('Set a positive weekly study allowance to schedule a plan.');
  while (profile.weeklyHours > 0) {
    const candidates = resources.filter(r => !selected.has(r.id) && relevant(r)).map(resource => {
      const bundle = closure(resource.id);
      const skills = new Set(bundle.flatMap(r => r.skillIds));
      const benefit = [...skills].reduce((sum, id) => sum + (covered.has(id) ? 0 : priority.get(id) ?? 0), 0);
      const scenarioBenefit = [...skills].reduce((sum, id) => sum + (covered.has(id) ? 0 : selectedPriority.get(id) ?? 0), 0);
      const unknownPrice = bundle.some(r => r.learningCost === null);
      if (unknownPrice) unknownCost = true;
      const cost = bundle.reduce((sum, r) => sum + (r.learningCost ?? 0), 0);
      const duration = bundle.reduce((sum, r) => sum + minutes(r), 0);
      return { resource, bundle, benefit, scenarioBenefit, cost, duration, unknownPrice };
    }).filter(c => !c.unknownPrice && learningCost + c.cost <= profile.budget + 1e-9 && (c.benefit > 0 || c.scenarioBenefit > 0));
    candidates.sort((a, b) => b.benefit / Math.max(b.duration, 1) - a.benefit / Math.max(a.duration, 1) || b.scenarioBenefit / Math.max(b.duration, 1) - a.scenarioBenefit / Math.max(a.duration, 1) || a.cost - b.cost || compareId(a.resource.id, b.resource.id));
    const chosen = candidates[0];
    if (!chosen) break;
    for (const resource of chosen.bundle) {
      const localPriority = resource.skillIds.reduce((sum, id) => sum + (covered.has(id) ? 0 : priority.get(id) ?? 0), 0);
      const isPrerequisite = resource.id !== chosen.resource.id;
      steps.push({ resourceId: resource.id, title: resource.title, minutes: minutes(resource), priority: round(localPriority * 100), prerequisiteIds: [...resource.prerequisites], reason: `${isPrerequisite ? 'Included as a prerequisite. ' : ''}Practises ${resource.skillIds.map(id => skillLabels[id]).join(', ')} for this route. Selected to address stated gaps or support prerequisite work. Priority favours gaps that matter in both modelled scenarios; it is a planning estimate. ${resource.providerMinutes === null ? 'Effort is a team estimate; no provider duration is asserted.' : 'Provider duration and practice effort are added.'}` });
      selected.add(resource.id);
      resource.skillIds.forEach(id => covered.add(id));
      learningCost += resource.learningCost ?? 0;
    }
  }
  if (unknownCost) warnings.push('Resources with unknown learning prices were excluded. The displayed cost covers selected resources only; verify access before starting.');
  const unresolved = skillIds.filter(id => (priority.get(id) ?? 0) > 0 && !covered.has(id));
  if (unresolved.length && profile.weeklyHours > 0) warnings.push(`No affordable verified-price sequence covers these stated gaps: ${unresolved.map(id => skillLabels[id]).join(', ')}. Increase the budget or review the catalogue; no substitute was invented.`);
  if (!steps.length && !unresolved.length && profile.weeklyHours > 0 && denominator > 0) warnings.push('No stated gap needs a catalogue step. This does not establish readiness beyond the six selected dimensions.');
  if (steps.some(s => lookup.get(s.resourceId)!.providerMinutes === null)) warnings.push('Study hours are team planning estimates, including reading and practice. They are not provider-certified durations.');
  warnings.push('Finishing a step records activity only; it does not increase proficiency. This starter plan does not award a qualification. Optional certification and paid tools are outside the displayed learning budget.');
  const totalMinutes = steps.reduce((sum, step) => sum + step.minutes, 0);
  const id = `plan-${stableId(JSON.stringify({ engine: ENGINE_VERSION, profile, snapshot: snapshot.id, snapshotVersion: snapshot.version, scenario, roleId, steps }))}`;
  return { id, profileId: profile.id, profileVersion: profile.version, snapshotId: snapshot.id, scenario, roleId, steps, totalMinutes, weeks: profile.weeklyHours > 0 ? Math.ceil(totalMinutes / (60 * profile.weeklyHours)) : 0, learningCost: round(learningCost), unknownCost, warnings, completed: [], createdAt: new Date().toISOString() };
}
