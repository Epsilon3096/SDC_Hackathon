import { describe, expect, it } from 'vitest';
import { initialSnapshot, profiles, resources, roles, seedMappings, skills, sources } from '../src/shared/catalogue';
import { buildDecisionBrief, type DecisionBriefCatalogue } from '../src/shared/decision-brief';
import { createPlan } from '../src/shared/engine';
import type { Snapshot } from '../src/shared/types';

const catalogue = (snapshots: Snapshot[] = [initialSnapshot]): DecisionBriefCatalogue => structuredClone({ roles, resources, sources, skills, snapshots });
const plan = () => createPlan(structuredClone(profiles[0]), initialSnapshot, 'moderate', 'qa', roles, resources);

describe('recorded decision brief', () => {
  it('exports the saved assessment after a profile changes, without mutation or reassessment', () => {
    const original = plan();
    const saved = structuredClone(original);
    const updatedProfile = structuredClone(profiles[0]);
    updatedProfile.version += 1;
    Object.keys(updatedProfile.skills).forEach(key => { updatedProfile.skills[key as keyof typeof updatedProfile.skills] = 4; });
    const context = { ...catalogue(), profiles: [updatedProfile] };
    const before = structuredClone(context);
    const brief = buildDecisionBrief(original, context);
    expect(brief).toContain('Alignment score: 65.33/100');
    expect(brief).not.toContain('Alignment score: 100/100');
    expect(brief).toContain(`Original profile version: ${profiles[0].version}`);
    expect(brief).toContain('Original allowance: 4 hours/week; learning budget RM 0.');
    expect(buildDecisionBrief(original, context)).toBe(brief);
    expect(original).toEqual(saved);
    expect(context).toEqual(before);
  });

  it('does not fabricate a legacy score, qualification check or original pace', () => {
    const legacy = plan();
    delete legacy.decision;
    delete legacy.constraints;
    const brief = buildDecisionBrief(legacy, catalogue());
    expect(brief).toContain('original profile and assessment were not recorded');
    expect(brief).toContain('original score and qualification check are unavailable');
    expect(brief).toContain('Original weekly allowance and budget were not recorded');
    expect(brief).not.toContain('Alignment score:');
    expect(brief).not.toContain('Qualification check:');
    expect(brief).not.toContain(profiles[0].name);
  });

  it('uses the exact saved snapshot and its review trail even when another snapshot is newer', () => {
    const mapping = { ...structuredClone(seedMappings[0]), status: 'approved' as const, reviewedAt: '2026-10-21T10:00:00Z', reviewNote: 'Reviewed the deployment and limited task implication.' };
    const published: Snapshot = { ...initialSnapshot, id: 'snapshot-reviewed', parentId: initialSnapshot.id, version: 2, title: 'Reviewed deployment', publishedAt: '2026-10-21T10:01:00Z', mappings: [mapping] };
    const later: Snapshot = { ...published, id: 'snapshot-later', version: 3, mappings: [] };
    const saved = createPlan(structuredClone(profiles[0]), published, 'fast', 'qa', roles, resources);
    const brief = buildDecisionBrief(saved, catalogue([initialSnapshot, published, later]));
    const source = sources.find(item => item.id === mapping.sourceId)!;
    expect(brief).toContain('Evidence snapshot: snapshot-reviewed · version 2');
    expect(brief).toContain(`Recorded passage: "${mapping.passage}"`);
    expect(brief).toContain(mapping.reviewNote);
    expect(brief).toContain(mapping.reviewedAt);
    expect(brief).toContain(source.url);
    expect(brief).toContain(source.hash);
    expect(brief).toContain('Publication date: 2023-12 (month precision)');
    expect(brief).toContain('moderate 20%; faster 50%');
    expect(brief).not.toContain('Evidence snapshot: snapshot-later');
  });

  it('preserves unknown skills and entry requirements instead of presenting false certainty', () => {
    const profile = structuredClone(profiles[0]); profile.skills.ai_inspection = null;
    const saved = createPlan(profile, initialSnapshot, 'moderate', 'process', roles, resources);
    const brief = buildDecisionBrief(saved, catalogue());
    expect(brief).toContain('Alignment score: unavailable. Recorded lower–upper range:');
    expect(brief).toContain('Qualification check: unknown.');
    expect(brief).toContain(`${skills.find(item => item.id === 'ai_inspection')!.name}: unknown /`);
    expect(brief).toContain('gap unknown');
    expect(brief).toContain('Unknown proficiency is not treated as zero');
  });

  it('keeps saved prerequisite order, practice output and links, and separates completion from proficiency', () => {
    const saved = plan();
    saved.completed = [saved.steps[0].resourceId];
    const brief = buildDecisionBrief(saved, catalogue());
    for (const [index, step] of saved.steps.entries()) {
      const resource = resources.find(item => item.id === step.resourceId)!;
      expect(brief).toContain(`${index + 1}. ${step.title}`);
      expect(brief).toContain(`Open: ${resource.url}`);
      expect(brief).toContain(`Produce: ${resource.outcome}`);
      expect(brief).toContain(resource.description);
      for (const prerequisite of step.prerequisiteIds) {
        const earlier = saved.steps.findIndex(item => item.resourceId === prerequisite);
        expect(earlier).toBeLessThan(index);
        expect(brief).toContain(saved.steps[earlier].title);
      }
    }
    expect(brief).toContain('[activity marked complete]');
    expect(brief).toContain('Optional certification: price unknown / not included');
    expect(brief).toContain('It does not raise proficiency');
    expect(brief).toContain('learning-resource and source descriptions in this export are catalogue references available at export');
  });

  it('reports missing snapshot, resource and source records instead of substituting new data', () => {
    const saved = plan();
    const context = catalogue([]);
    context.resources = [];
    context.sources = [];
    const brief = buildDecisionBrief(saved, context);
    expect(brief).toContain('The exact saved snapshot is unavailable');
    expect(brief).toContain('Current snapshot rules have not been substituted');
    expect(brief).toContain(`Catalogue reference unavailable for resource ${saved.steps[0].resourceId}`);
    expect(brief).toContain(`Source ${roles[0].sourceIds[0]}: catalogue record unavailable`);
    expect(brief).toContain('Alignment score: 65.33/100');
  });

  it('retains unknown source dates and access prices without replacing them with retrieval dates or zero', () => {
    const saved = plan();
    const context = catalogue();
    const source = context.sources.find(item => item.id === roles[0].sourceIds[0])!;
    source.publishedAt = null; source.datePrecision = 'unknown'; source.dateKind = 'publication';
    context.resources.find(item => item.id === saved.steps[0].resourceId)!.learningCost = null;
    const brief = buildDecisionBrief(saved, context);
    expect(brief).toContain(`Publication date: unknown. Retrieved: ${source.retrievedAt}`);
    expect(brief).toContain('Learning access: Unknown; verify before paying');
    expect(brief).toContain('Selected learning cost recorded in this plan: RM 0');
  });
});
