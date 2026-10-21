import type { Evaluation, ScenarioId } from '../shared/types';

export interface EvaluationSelection {
  profileId: string;
  profileVersion: number;
  snapshotId: string;
  scenario: ScenarioId;
  roleId: string;
}

export function evaluationSelectionKey(selection: EvaluationSelection): string {
  return JSON.stringify([selection.profileId, selection.profileVersion, selection.snapshotId, selection.scenario, selection.roleId]);
}

/** Do not relabel a retained evaluation after the worker changes the requested context. */
export function evaluationMatchesSelection(evaluation: Evaluation, selection: EvaluationSelection): boolean {
  return evaluation.profile.id === selection.profileId
    && evaluation.profile.version === selection.profileVersion
    && evaluation.snapshot.id === selection.snapshotId
    && evaluation.scenario === selection.scenario
    && evaluation.plan.profileId === selection.profileId
    && evaluation.plan.profileVersion === selection.profileVersion
    && evaluation.plan.snapshotId === selection.snapshotId
    && evaluation.plan.scenario === selection.scenario
    && evaluation.plan.roleId === selection.roleId;
}
