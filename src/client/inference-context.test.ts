import { describe, expect, it } from 'vitest';
import type { Inference, RunpodContext, Source } from '../shared/types';
import { currentSourceScore, inferenceMatchesContext, latestCurrentInference } from './inference-context';

const source = { id: 'source-1', hash: 'current-source-hash' } as Source;
const context: RunpodContext = { model: 'BAAI/bge-large-en-v1.5', modelRevision: 'revision-2', preprocessing: 'cls-l2-v1', query: 'manufacturing inspection' };
const result: Inference = {
  id: 'result-1', sourceId: source.id, sourceHash: source.hash, textHash: 'bounded-text-hash',
  ...context, status: 'completed', mode: 'live', score: 0.75, jobId: 'provider-1',
  createdAt: '2026-10-22T01:00:00.000Z', error: null,
};

describe('inference context presented to the reviewer', () => {
  it('accepts an exact source and model context', () => {
    expect(inferenceMatchesContext(result, source, context)).toBe(true);
    expect(currentSourceScore([result], source, context)).toBe(0.75);
  });

  it.each([
    { sourceId: 'another-source' },
    { sourceHash: 'previous-source-hash' },
    { model: 'another-model' },
    { modelRevision: 'revision-1' },
    { preprocessing: 'different-pooling' },
    { query: 'retail chatbots' },
    { sourceHash: undefined },
    { modelRevision: null },
    { preprocessing: undefined },
    { query: undefined },
  ])('excludes changed or missing provenance %j from current scores', difference => {
    const old = { ...result, ...difference };
    expect(inferenceMatchesContext(old, source, context)).toBe(false);
    expect(latestCurrentInference([old], source, context)).toBeUndefined();
    expect(currentSourceScore([old], source, context)).toBe(-Infinity);
  });

  it('does not infer current model settings when the server omits them', () => {
    expect(latestCurrentInference([result], source)).toBeUndefined();
    expect(currentSourceScore([result], source)).toBe(-Infinity);
  });

  it('selects the newest matching record without mutating history or selecting a newer incompatible result', () => {
    const newer = { ...result, id: 'new-current', createdAt: '2026-10-22T02:00:00.000Z', score: 0.8 };
    const incompatible = { ...result, id: 'different-context', modelRevision: 'revision-3', createdAt: '2026-10-22T03:00:00.000Z', score: 0.99 };
    const records = [result, incompatible, newer];
    const originalOrder = records.map(item => item.id);
    expect(latestCurrentInference(records, source, context)).toBe(newer);
    expect(currentSourceScore(records, source, context)).toBe(0.8);
    expect(records.map(item => item.id)).toEqual(originalOrder);
  });

  it.each(['submitting', 'unknown', 'pending', 'failed', 'unconfigured'] as const)('keeps current %s state available without treating it as a score', status => {
    const record = { ...result, status, score: null };
    expect(latestCurrentInference([record], source, context)).toBe(record);
    expect(currentSourceScore([record], source, context)).toBe(-Infinity);
  });

  it.each([null, NaN, Infinity, -Infinity])('does not order an invalid completed score %s', score => {
    expect(currentSourceScore([{ ...result, score }], source, context)).toBe(-Infinity);
  });
});
