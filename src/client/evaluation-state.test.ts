import { describe, expect, it } from 'vitest';
import { initialSnapshot, profiles, resources, roles } from '../shared/catalogue';
import { assess, createPlan } from '../shared/engine';
import type { Evaluation } from '../shared/types';
import { evaluationMatchesSelection, type EvaluationSelection } from './evaluation-state';

const profile = profiles[0];
const response: Evaluation = {
  profile,
  snapshot: initialSnapshot,
  scenario: 'moderate',
  assessments: assess(profile, initialSnapshot, 'moderate', roles),
  plan: createPlan(profile, initialSnapshot, 'moderate', 'qa', roles, resources),
};
const selection: EvaluationSelection = {
  profileId: profile.id,
  profileVersion: profile.version,
  snapshotId: initialSnapshot.id,
  scenario: 'moderate',
  roleId: 'qa',
};

describe('retained evaluations cannot be relabelled after a failed refresh', () => {
  it('accepts the complete response for the currently selected worker context', () => {
    expect(evaluationMatchesSelection(response, selection)).toBe(true);
  });

  it.each([
    ['another role', { roleId: 'process' }],
    ['newly published evidence', { snapshotId: 'snapshot-published-next' }],
    ['an edited profile', { profileVersion: profile.version + 1 }],
    ['another worker', { profileId: profiles[1].id }],
    ['another adoption assumption', { scenario: 'fast' as const }],
  ])('rejects the retained QA response when the user requested %s', (_label, changes) => {
    expect(evaluationMatchesSelection(response, { ...selection, ...changes })).toBe(false);
  });

  it('rejects a mixed response whose envelope is current but whose plan is stale', () => {
    const currentVersion = profile.version + 1;
    const mixed: Evaluation = { ...response, profile: { ...profile, version: currentVersion } };
    expect(evaluationMatchesSelection(mixed, { ...selection, profileVersion: currentVersion })).toBe(false);
  });
});
