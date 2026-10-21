import { describe, expect, it } from 'vitest';
import { initialSnapshot, seedMappings } from '../shared/catalogue';
import type { Snapshot } from '../shared/types';
import { compareSnapshotMappings, initialMappingPassage } from './snapshot-diff';

const first = seedMappings[0];
const second = { ...first, id: 'second-reviewed-mapping' };
const before: Snapshot = { ...initialSnapshot, id: 'before', mappings: [first] };

describe('published evidence comparisons', () => {
  it('explains a retirement-only revision without inventing an addition or changing history', () => {
    const after: Snapshot = {
      ...initialSnapshot,
      id: 'retired',
      parentId: before.id,
      version: 2,
      mappings: [],
      retiredMappingIds: [first.id],
      retirementNote: 'The interpretation is no longer supported.',
    };
    const beforeCopy = structuredClone(before);
    const afterCopy = structuredClone(after);
    expect(compareSnapshotMappings(before, after)).toEqual({ added: [], retired: [first] });
    expect(before).toEqual(beforeCopy);
    expect(after).toEqual(afterCopy);
  });

  it('identifies both sides of a combined addition and retirement', () => {
    const after: Snapshot = { ...before, id: 'combined', mappings: [second] };
    expect(compareSnapshotMappings(before, after)).toEqual({ added: [second], retired: [first] });
  });

  it('compares membership rather than treating historical retirement metadata as a current removal', () => {
    const readded: Snapshot = {
      ...before,
      id: 'readded',
      version: 3,
      retiredMappingIds: ['another-retired-mapping'],
      retirementNote: 'A separate interpretation was withdrawn.',
    };
    expect(compareSnapshotMappings(before, readded)).toEqual({ added: [], retired: [] });
  });
});

describe('exact source passage prefilling', () => {
  it('preserves the full exact text when it fits the API limit', () => {
    const excerpt = 'The source records an inspection finding.\nIts limitations remain part of the exact excerpt.';
    expect(initialMappingPassage(excerpt)).toBe(excerpt);
    expect(initialMappingPassage('a'.repeat(1200))).toHaveLength(1200);
  });

  it('leaves oversized excerpts empty instead of truncating or preloading invalid form content', () => {
    expect(initialMappingPassage('a'.repeat(1201))).toBe('');
  });

  it('handles absent and empty excerpts without generating a claim', () => {
    expect(initialMappingPassage(undefined)).toBe('');
    expect(initialMappingPassage('')).toBe('');
  });
});
