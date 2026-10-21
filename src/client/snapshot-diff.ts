import type { Snapshot } from '../shared/types';

/** Compare actual membership, so retirement-only revisions and re-additions remain explainable. */
export function compareSnapshotMappings(before: Snapshot, after: Snapshot) {
  const previousIds = new Set(before.mappings.map(mapping => mapping.id));
  const currentIds = new Set(after.mappings.map(mapping => mapping.id));
  return {
    added: after.mappings.filter(mapping => !previousIds.has(mapping.id)),
    retired: before.mappings.filter(mapping => !currentIds.has(mapping.id)),
  };
}

/** Do not silently truncate a source or prefill text the API cannot accept. */
export function initialMappingPassage(excerpt: string | undefined): string {
  return excerpt && excerpt.length <= 1200 ? excerpt : '';
}
