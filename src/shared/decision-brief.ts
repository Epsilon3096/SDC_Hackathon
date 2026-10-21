import type { AppState, Plan, QualificationType, Source } from './types';

export type DecisionBriefCatalogue = Pick<AppState, 'roles' | 'resources' | 'sources' | 'snapshots' | 'skills'>;

const qualifications: Record<QualificationType, string> = {
  academic_diploma: 'Academic diploma', dkm4: 'DKM level 4', dlkm5: 'DLKM level 5',
  skm3: 'SKM level 3', skm2: 'SKM level 2', spm: 'SPM', unknown: 'Unknown',
};
const number = (value: number) => String(Math.round((value + Number.EPSILON) * 100) / 100);
const money = (value: number | null) => value === null ? 'Unknown; verify before paying' : `RM ${number(value)}`;
const sourceDate = (source: Source) => {
  const kind = source.dateKind === 'updated' ? 'Updated' : source.dateKind === 'copyright' ? 'Copyright' : 'Publication';
  return source.publishedAt === null ? `${kind} date: unknown` : `${kind} date: ${source.publishedAt} (${source.datePrecision} precision)`;
};

/** Exports recorded decisions only; it never reassesses an old plan using today's profile. */
export function buildDecisionBrief(plan: Plan, catalogue: DecisionBriefCatalogue): string {
  const role = catalogue.roles.find(item => item.id === plan.roleId);
  const snapshot = catalogue.snapshots.find(item => item.id === plan.snapshotId);
  const captured = plan.decision;
  const constraints = plan.constraints ?? (captured ? { weeklyHours: captured.profile.weeklyHours, budget: captured.profile.budget } : undefined);
  const skillName = (id: string) => catalogue.skills.find(item => item.id === id)?.name ?? id;
  const stepName = (id: string) => plan.steps.find(item => item.resourceId === id)?.title ?? id;
  const lines = [
    'ShiftBridge decision brief',
    'A learning decision aid for a synthetic worker profile.',
    '',
    `Plan: ${plan.id}`,
    `Created: ${plan.createdAt}`,
    `Worker: ${captured ? captured.profile.name : `${plan.profileId} (original name not recorded)`}`,
    `Original profile version: ${plan.profileVersion}`,
    `Route: ${role?.name ?? plan.roleId}`,
    `Scenario: ${plan.scenario === 'fast' ? 'Faster adoption' : 'Moderate adoption'} (a modelling assumption, not a forecast)`,
    `Evidence snapshot: ${plan.snapshotId}${snapshot ? ` · version ${snapshot.version} · ${snapshot.title} · published ${snapshot.publishedAt}` : ' · snapshot record unavailable'}`,
    `Engine version: ${captured?.engineVersion ?? 'not recorded for this legacy plan'}`,
    '',
    'ORIGINAL DECISION',
  ];

  if (captured) {
    const { profile, assessment } = captured;
    lines.push(
      'The following profile and assessment were captured when this plan was created.',
      `Stated qualification: ${qualifications[profile.qualification]}; field: ${profile.field || 'not supplied'}; experience: ${number(profile.experienceYears)} years.`,
      assessment.score === null
        ? `Alignment score: unavailable. Recorded lower–upper range: ${number(assessment.lowerScore)}–${number(assessment.upperScore)}/100; known weighted coverage: ${number(assessment.completeness)}%.`
        : `Alignment score: ${number(assessment.score)}/100; known weighted coverage: ${number(assessment.completeness)}%.`,
      assessment.explanation,
      `Qualification check: ${assessment.qualification}. ${assessment.qualificationReason}`,
      'Captured skill contributions (stated proficiency / modelled requirement; adjusted weight):',
    );
    for (const contribution of assessment.contributions) {
      lines.push(
        `- ${skillName(contribution.skillId)}: ${contribution.level === null ? 'unknown' : number(contribution.level)} / ${number(contribution.required)}; weight ${number(contribution.weight)}; gap ${contribution.gap === null ? 'unknown' : `${number(contribution.gap * 100)}%`}.`,
        `  ${contribution.rationale}`,
      );
    }
  } else {
    lines.push('The original profile and assessment were not recorded for this legacy plan. Its original score and qualification check are unavailable; no result has been reconstructed from the current profile.');
  }

  lines.push(
    '',
    'STUDY CONSTRAINTS AND ORDER',
    constraints ? `Original allowance: ${number(constraints.weeklyHours)} hours/week; learning budget ${money(constraints.budget)}.` : 'Original weekly allowance and budget were not recorded for this legacy plan.',
    `Recorded effort estimate: ${number(plan.totalMinutes / 60)} hours across ${plan.steps.length} steps; schedule estimate: ${plan.weeks} weeks. These are estimates, not a completion deadline.`,
    `Selected learning cost recorded in this plan: ${money(plan.learningCost)}. Optional credentials and paid tools are outside this total.`,
    ...(plan.unknownCost ? ['Unknown-priced candidates were excluded; the total does not price those options.'] : []),
    'Follow the saved order and its prerequisite links. Completion below is activity recorded at export, not assessed proficiency.',
  );
  if (plan.steps.length === 0) lines.push('No steps were selected. Read the warnings below before treating this as a suitable pathway.');
  for (const [index, step] of plan.steps.entries()) {
    const resource = catalogue.resources.find(item => item.id === step.resourceId);
    lines.push(
      '',
      `${index + 1}. ${step.title} [${plan.completed.includes(step.resourceId) ? 'activity marked complete' : 'not marked complete'}]`,
      `   Saved effort: ${number(step.minutes / 60)} hours; priority: ${number(step.priority)} (planning estimate).`,
      `   Earlier plan prerequisites: ${step.prerequisiteIds.length ? step.prerequisiteIds.map(stepName).join('; ') : 'none'}.`,
      `   Why: ${step.reason}`,
    );
    if (resource) {
      lines.push(
        `   Provider/reference: ${resource.provider}`,
        `   Open: ${resource.url}`,
        `   Practice instructions and reading prerequisites: ${resource.description}`,
        `   Produce: ${resource.outcome}`,
        `   Learning access: ${money(resource.learningCost)}. Optional certification: ${resource.certificationCost === null ? 'price unknown / not included' : money(resource.certificationCost)}.`,
        `   Cost note: ${resource.costNote}`,
        `   Resource checked: ${resource.verifiedAt}; provider duration: ${resource.providerMinutes === null ? 'not verified' : `${number(resource.providerMinutes)} minutes`}.`,
      );
    } else lines.push(`   Catalogue reference unavailable for resource ${step.resourceId}; verify access, price and instructions before starting.`);
  }

  lines.push('', 'EVIDENCE AND REVIEWED RULES');
  if (!snapshot) lines.push('The exact saved snapshot is unavailable. Current snapshot rules have not been substituted.');
  else {
    if (snapshot.mappings.length === 0) lines.push('This snapshot has no published trend adjustments. Baseline role requirements and weights remain team modelling assumptions.');
    for (const mapping of snapshot.mappings) {
      const scope = mapping.roleIds === undefined
        ? 'Legacy rule: no role scope was recorded; its original all-route effect is preserved.'
        : mapping.roleIds.length === 0
          ? 'Empty scope: excluded from scoring; it does not mean all routes.'
          : `${mapping.roleIds.map(id => catalogue.roles.find(item => item.id === id)?.name ?? id).join('; ')}. ${mapping.roleIds.includes(plan.roleId) ? 'Includes this saved route.' : 'Does not apply to this saved route.'}`;
      lines.push(
        `Rule ${mapping.id} → ${skillName(mapping.skillId)}; source ${mapping.sourceId}.`,
        `  Role scope: ${scope}`,
        `  Status: ${mapping.status}; reviewed: ${mapping.reviewedAt ?? 'not recorded'}${mapping.fixture ? '; synthetic fixture (excluded from scoring)' : ''}.`,
        `  Recorded passage: "${mapping.passage}"`,
        `  Task interpretation: ${mapping.implication}`,
        `  Proposed weight changes: moderate ${number(mapping.deltaModerate * 100)}%; faster ${number(mapping.deltaFast * 100)}%. These are scenario assumptions, not measurements from the source.`,
        `  Rationale: ${mapping.rationale}`,
        `  Review note: ${mapping.reviewNote || 'not recorded'}`,
      );
    }
    if (snapshot.retiredMappingIds?.length) lines.push(`Retired from this snapshot: ${snapshot.retiredMappingIds.join(', ')}. Reason: ${snapshot.retirementNote ?? 'not recorded'}.`);
    lines.push('The captured skill contributions above record the effective rule rationale. Bounded adjustments, duplicate restraint and conflict handling can differ from an individual proposed weight change.');
  }
  const sourceIds = [...new Set([...(role?.sourceIds ?? []), ...(snapshot?.mappings.map(mapping => mapping.sourceId) ?? [])])];
  for (const id of sourceIds) {
    const source = catalogue.sources.find(item => item.id === id);
    if (!source) { lines.push(`Source ${id}: catalogue record unavailable.`); continue; }
    lines.push(
      '',
      `${source.title} [${source.id}]`,
      `  ${source.publisher}; ${source.type}. ${sourceDate(source)}. Retrieved: ${source.retrievedAt}.`,
      `  ${source.url}`,
      `  Content hash: ${source.hash}`,
      `  Limitation: ${source.limitation}`,
    );
  }
  if (role) lines.push('', `Intended SDG contribution: ${role.sdg}. ${role.sdgReason} This is an intended contribution, not measured impact.`);
  lines.push(
    '', 'WARNINGS AND LIMITS',
    ...plan.warnings.map(warning => `- ${warning}`),
    '- Finishing learning records activity only. It does not raise proficiency, award a qualification or guarantee admission, employment or income.',
    '- Alignment covers six selected skills. Role requirements, weights and scenarios are modelling assumptions, not occupational readiness or hiring probabilities.',
    '- Role, learning-resource and source descriptions in this export are catalogue references available at export. The saved assessment and ordered steps above are the recorded decision; catalogue descriptions were not separately archived with it.',
    '',
  );
  return lines.join('\n');
}
