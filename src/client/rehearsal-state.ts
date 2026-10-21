import type { AppState } from '../shared/types';

export interface RehearsalStep {
  id: string;
  actor: 'Worker' | 'Reviewer';
  title: string;
  complete: boolean;
  page: string;
  action: string;
  instruction: string;
  proof: string;
}

/** Milestones come from persisted API state, never timers or scripted success. */
export function rehearsalSteps(data: AppState): RehearsalStep[] {
  const profile = data.profiles.find(p => p.id === 'farid');
  const active = data.snapshots.find(s => s.id === data.activeSnapshotId);
  const baseline = data.snapshots.find(s => s.version === 1);
  const routePlans = data.plans.filter(p => p.profileId === 'farid' && p.roleId === 'qa' && p.scenario === 'moderate');
  const baseSaved = routePlans.some(p => p.snapshotId === baseline?.id);
  const supported = data.mappings.find(m => m.id === 'mapping-intel-ai-literacy');
  const published = !!active?.mappings.some(m => m.id === supported?.id);
  const rejected = ['mapping-unrelated-chatbot', 'mapping-research-insufficient'].every(id => data.mappings.some(m => m.id === id && m.status === 'rejected'));
  const revisedSaved = published && routePlans.some(p => p.snapshotId === active?.id && p.profileVersion === profile?.version);
  return [
    { id: 'baseline', actor: 'Worker', title: 'Save a baseline', complete: baseSaved, page: 'pathway', action: 'Open the learning plan', instruction: 'Meet Farid in My profile, then save his QA plan under moderate adoption before publishing evidence. Note the first step and the 4-hour weekly pace.', proof: 'A baseline plan is saved in this rehearsal.' },
    { id: 'review', actor: 'Reviewer', title: 'Review the passage', complete: supported?.status === 'approved', page: 'evidence', action: 'Review supported evidence', instruction: 'Inspect Intel’s December 2023 account and its exact passage. Write your review reason and approve the bounded interpretation. Approval alone must leave recommendations unchanged.', proof: 'The supported mapping has a recorded approval.' },
    { id: 'publish', actor: 'Reviewer', title: 'Publish a version', complete: published, page: 'evidence', action: 'Open Evidence Studio', instruction: 'Open the Publish stage, select the approved inspection mapping, and publish a named snapshot. This is the action that changes the model; the saved plan stays intact.', proof: 'The supported mapping is in the active snapshot.' },
    { id: 'restraint', actor: 'Reviewer', title: 'Reject weak signals', complete: rejected, page: 'evidence', action: 'Review the remaining queue', instruction: 'Reject both the fictional retail chatbot and the research-only mapping, with reasons. Explain why an unrelated signal and a related-but-insufficient paper cannot change work requirements.', proof: 'Both negative cases have recorded rejection decisions.' },
    { id: 'adopt', actor: 'Worker', title: 'Compare and choose', complete: baseSaved && revisedSaved, page: 'changes', action: 'Compare the two plans', instruction: 'Compare the baseline with the active evidence. Read the actual step-order change and its reason. Then open My learning plan, choose Latest suggestion, and adopt it. Download the saved decision brief.', proof: 'Both the baseline and an adopted current revision are retained.' },
  ];
}
