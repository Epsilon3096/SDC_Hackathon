import React, { useId, useState } from 'react';
import { FlaskConical, RefreshCw, Search } from 'lucide-react';
import type { AppState, Inference, Source } from '../shared/types';
import { inferenceMatchesContext, latestCurrentInference } from './inference-context';
import './source-inference.css';

type Props = {
  source: Source;
  data: AppState;
  busy: boolean;
  mutate: (path: string, method: string, body: unknown, message: string) => Promise<unknown>;
};

function RequestRecord({ inference }: { inference: Inference }) {
  return <dl>
    <dt>Model</dt><dd>{inference.model}</dd>
    <dt>Revision</dt><dd>{inference.modelRevision || 'Not recorded'}</dd>
    <dt>Preprocessing</dt><dd>{inference.preprocessing || 'Not recorded'}</dd>
    <dt>Query</dt><dd>{inference.query || 'Not recorded'}</dd>
    <dt>Source reference</dt><dd>{inference.sourceHash || 'Not recorded'}</dd>
    <dt>Passage reference</dt><dd>{inference.textHash || 'Not recorded'}</dd>
    <dt>Requested</dt><dd>{new Date(inference.createdAt).toLocaleString('en-MY', {timeZone:'Asia/Kuala_Lumpur'})} MYT</dd>
    <dt>Provider job</dt><dd>{inference.jobId || 'No job ID received'}</dd>
    <dt>Input scope</dt><dd>Public passage only, bounded to 2,000 characters. No worker profile is sent.</dd>
  </dl>;
}

/** A relevance result never changes a mapping, snapshot, profile or learning plan. */
export function SourceInference({ source, data, busy, mutate }: Props) {
  const inputId = useId();
  const [jobId, setJobId] = useState('');
  const context = data.connection.runpodContext;
  const inference = latestCurrentInference(data.inferences, source, context);
  const earlierRecords = data.inferences.filter(item => item.sourceId === source.id && item !== inference)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const authorised = data.connection.admin && ['local', 'authenticated'].includes(data.connection.reviewMode);
  const needsReconciliation = inference?.status === 'unknown' || inference?.status === 'submitting';
  const textReady = source.type !== 'synthetic' && Array.from(source.excerpt).slice(0, 2000).join('').trim().length >= 12;
  const blockedReason = data.rehearsal ? 'GPU requests are disabled in this synthetic rehearsal.'
    : !textReady ? 'No usable public passage is recorded. No paid request can be sent.'
      : !data.connection.runpod ? 'RunPod is not configured. No current model score has been produced.'
        : !context ? 'Current model settings are unavailable. No paid request can be sent.'
          : !authorised ? 'A team reviewer session is required to use inference credits.' : '';
  const statusText = !inference ? 'No relevance inference for the current source and model settings'
    : inference.status === 'completed' ? `${inference.mode === 'cached' ? 'Previously computed' : 'GPU-computed'} similarity: ${inference.score?.toFixed(3) ?? 'not supplied'}`
      : inference.status === 'pending' ? 'Provider job queued or running'
        : needsReconciliation ? 'Submission outcome needs checking — repeat requests are blocked'
          : inference.status === 'unconfigured' ? 'No inference connection was configured'
            : 'Provider job did not complete';
  const canSubmit = !blockedReason && !needsReconciliation && inference?.status !== 'pending' && inference?.status !== 'completed';

  return <section className="source-inference" aria-label={`Relevance triage: ${source.title}`}>
    <div className="source-inference-heading"><FlaskConical size={16}/><strong>{statusText}</strong></div>
    <p>Similarity helps a reviewer decide what to read. It does not establish deployment, workforce impact or a valid skill rule.</p>
    <p>Matching vocabulary can score highly even when a passage denies a claim. Read the full passage and verify what it actually supports.</p>
    {blockedReason && <p className="source-inference-boundary">{blockedReason}</p>}
    {inference?.error && inference.status !== 'unconfigured' && <p className="source-inference-boundary">{inference.error}</p>}
    {inference && <details><summary>Model and request record</summary><RequestRecord inference={inference}/></details>}
    {earlierRecords.length > 0 && <details><summary>Earlier or legacy records ({earlierRecords.length})</summary>
      <p>Only a result matching the current source reference, model revision, preprocessing and query can set the current reading order. Earlier records are kept for inspection.</p>
      {earlierRecords.map(record => <details key={record.id}><summary>{inferenceMatchesContext(record, source, context) ? 'Earlier matching record' : 'Stale or legacy record — excluded from current scores'} · {record.status}</summary>
        {record.status === 'completed' && typeof record.score === 'number' && Number.isFinite(record.score) && <p>Historical similarity: {record.score.toFixed(3)}. This is not the current score.</p>}
        <RequestRecord inference={record}/>
      </details>)}
    </details>}
    {!data.rehearsal && <div className="source-inference-actions">
      <button className="button" type="button" disabled={busy || !canSubmit} onClick={() => void mutate(`/api/inference/${source.id}`, 'POST', {}, 'Relevance request processed. Check the recorded status; recommendations are unchanged.')}><Search size={14}/>{inference?.status === 'completed' ? 'Result recorded' : 'Run relevance check'}</button>
      {inference?.status === 'pending' && <button className="button" type="button" disabled={busy || !authorised || !data.connection.runpod} onClick={() => void mutate(`/api/inference-status/${inference.id}`, 'POST', {}, 'Provider status checked. Recommendations are unchanged.')}><RefreshCw size={14}/>Check existing job</button>}
    </div>}
    {needsReconciliation && !data.rehearsal && <details className="inference-reconcile"><summary>Recover an existing provider result</summary>
      <p>Find this request in the RunPod console. After it completes, enter its job ID. The server checks the exact source, model and GPU result. This does not submit another paid job.</p>
      <form onSubmit={async event => { event.preventDefault(); if (busy || !authorised || !jobId.trim()) return; const ok = await mutate(`/api/inference-reconcile/${inference.id}`, 'POST', {jobId:jobId.trim()}, 'Existing GPU result checked and recorded.'); if (ok) setJobId(''); }}>
        <label className="field" htmlFor={inputId}>Completed RunPod job ID<input id={inputId} value={jobId} onChange={event => setJobId(event.target.value)} maxLength={200} pattern="[A-Za-z0-9_-]+" required autoComplete="off"/></label>
        <button className="button" type="submit" disabled={busy || !authorised || !data.connection.runpod || !jobId.trim()}>Check and recover result</button>
      </form>
    </details>}
  </section>;
}
