import type { Inference, RunpodContext, Source } from '../shared/types';

/** Missing provenance is not evidence that an older score is comparable. */
export function inferenceMatchesContext(inference: Inference, source: Source, context?: RunpodContext): boolean {
  return Boolean(context
    && inference.sourceId === source.id
    && inference.sourceHash === source.hash
    && inference.model === context.model
    && inference.modelRevision === context.modelRevision
    && inference.preprocessing === context.preprocessing
    && inference.query === context.query);
}

export function latestCurrentInference(inferences: Inference[], source: Source, context?: RunpodContext): Inference | undefined {
  return inferences.filter(item => inferenceMatchesContext(item, source, context))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

/** Queue ordering must never compare scores from different model/input settings. */
export function currentSourceScore(inferences: Inference[], source: Source, context?: RunpodContext): number {
  const inference = latestCurrentInference(inferences, source, context);
  return inference?.status === 'completed' && typeof inference.score === 'number' && Number.isFinite(inference.score)
    ? inference.score : -Infinity;
}
