import { useEffect, useId, useRef, useState } from 'react';
import { BookOpenCheck, Check, RotateCcw } from 'lucide-react';
import { blankPracticeAnswers, checkPracticeAnswers, countDefinitions, countKinds, countLabels, parseInspectionCsv,
  type InspectionCase, type PracticeAnswers, type PracticeFeedback } from './practice-exercise-state';
import './practice-exercise.css';

export function PracticeExercise() {
  const id = useId();
  const [opened, setOpened] = useState(false);
  const [cases, setCases] = useState<InspectionCase[]>([]);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [answers, setAnswers] = useState(blankPracticeAnswers);
  const [feedback, setFeedback] = useState<PracticeFeedback[] | null>(null);
  const feedbackHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!opened || cases.length) return;
    const controller = new AbortController();
    setLoadError('');
    void fetch('/practice/qa-inspection-cases.csv', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('The practice file could not be loaded.'); return response.text(); })
      .then(csv => { if (!controller.signal.aborted) setCases(parseInspectionCsv(csv)); })
      .catch(error => { if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'The practice file could not be loaded.'); });
    return () => controller.abort();
  }, [opened, retry, cases.length]);
  useEffect(() => { if (feedback) feedbackHeading.current?.focus(); }, [feedback]);
  const update = (next: PracticeAnswers) => { setAnswers(next); setFeedback(null); };
  const total = countKinds.every(kind => /^\d+$/.test(answers.counts[kind]))
    ? countKinds.reduce((sum, kind) => sum + Number(answers.counts[kind]), 0) : null;

  return <section className="qa-practice" aria-labelledby={`${id}-title`}>
    <div className="qa-practice-heading"><BookOpenCheck size={23} aria-hidden="true"/><div>
      <span className="qa-practice-kicker">PRACTISE WITH THE EVIDENCE</span>
      <h2 id={`${id}-title`}>Can you spot what the AI missed?</h2>
      <p>Try the 20-case QA exercise here, including on your phone. No spreadsheet needed.</p>
    </div></div>
    <div className="qa-practice-scope"><strong>Synthetic teaching example</strong><span>Answers stay on this page only and reset when you leave. This does not save learning progress, update skills or certify competence.</span></div>
    <details onToggle={event => setOpened(event.currentTarget.open)}>
      <summary>Open the interactive QA exercise</summary>
      {opened && <div className="qa-practice-body">
        {!cases.length && !loadError && <p role="status">Loading the synthetic practice cases…</p>}
        {loadError && <div role="alert"><p>{loadError} Your plan is unchanged.</p><button className="button" type="button" onClick={() => setRetry(value => value + 1)}>Retry practice file</button></div>}
        {cases.length > 0 && <form onSubmit={event => { event.preventDefault(); setFeedback(checkPracticeAnswers(cases, answers)); }}>
          <p className="qa-practice-intro"><strong>Read the labels first.</strong> Reference = the hypothetical exercise label; AI flag = the hypothetical prediction. A 1 means defect or flagged; a 0 means no defect or not flagged. These are original practice rows, not results from RunPod or a factory model.</p>
          <fieldset className="qa-practice-step"><legend>1. Count the four outcomes</legend>
            <p>Compare the reference and AI flag for every case below. Enter whole-number counts.</p>
            <div className="qa-practice-counts">{countKinds.map(kind => <label key={kind} htmlFor={`${id}-${kind}`}>
              <span>{countLabels[kind]}</span><small>{countDefinitions[kind]}</small>
              <input id={`${id}-${kind}`} type="number" inputMode="numeric" min="0" max={cases.length} step="1" required
                value={answers.counts[kind]} onChange={event => update({ ...answers, counts: { ...answers.counts, [kind]: event.target.value } })}/>
            </label>)}</div>
            <p className="qa-practice-total" aria-live="polite">{total === null ? 'Your four counts should account for all 20 cases.' : `Your counts account for ${total} of 20 cases.${total !== 20 ? ' Recheck the total before comparing your answers.' : ''}`}</p>
          </fieldset>
          <fieldset className="qa-practice-step"><legend>2. Find the missed defects</legend>
            <p>Select every case with a reference defect of 1 and an AI flag of 0. A missing measurement is a separate issue.</p>
            <div className="qa-practice-table-wrap"><table className="qa-practice-table">
              <caption>20 synthetic inspection cases. Example dimensional limits: 9.90–10.10 mm, inclusive.</caption>
              <thead><tr><th scope="col">Case / batch</th><th scope="col">Reference</th><th scope="col">AI flag</th><th scope="col">Measurement</th><th scope="col">Reference type</th><th scope="col">Missed defect?</th></tr></thead>
              <tbody>{cases.map(row => <tr key={row.id}>
                <th scope="row"><strong>{row.id}</strong><small>{row.batch}</small></th>
                <td data-label="Reference">{row.referenceDefect}</td><td data-label="AI flag">{row.aiFlag}</td>
                <td data-label="Measurement">{row.measurement === null ? <span className="qa-practice-missing">Missing</span> : `${row.measurement.toFixed(2)} mm`}</td>
                <td data-label="Reference type">{row.defectType.replaceAll('_', ' ')}</td>
                <td><label className="qa-practice-case-choice"><input type="checkbox" checked={answers.missedIds.includes(row.id)}
                  onChange={event => update({ ...answers, missedIds: event.target.checked ? [...answers.missedIds, row.id] : answers.missedIds.filter(value => value !== row.id) })}/>
                  <span><span className="qa-practice-sr-only">{row.id}: </span>Missed defect</span></label></td>
              </tr>)}</tbody>
            </table></div>
          </fieldset>
          <fieldset className="qa-practice-step"><legend>3. Handle the incomplete record</legend>
            <p>Q07 has no recorded measurement. What is the defensible next step?</p>
            {[
              ['accept-ai', 'Treat the AI flag of 0 as proof that the dimension is acceptable.'],
              ['retain-and-escalate', 'Keep the blank; request the measurement and context, and refer the unresolved record to the responsible supervisor or qualified reviewer.'],
              ['copy-neighbour', 'Copy the previous reading because the cases belong to the same batch.'],
              ['discard-record', 'Remove Q07 from the records so the summary is complete.'],
            ].map(([value, label]) => <label key={value} className="qa-practice-radio"><input type="radio" name={`${id}-missing-action`} value={value} required checked={answers.missingAction === value} onChange={() => update({ ...answers, missingAction: value })}/><span>{label}</span></label>)}
          </fieldset>
          <div className="qa-practice-actions"><button type="submit" className="button primary"><Check size={16} aria-hidden="true"/>Check against the reference</button>
            <button type="button" className="button" onClick={() => update(blankPracticeAnswers())}><RotateCcw size={15} aria-hidden="true"/>Clear my answers</button>
            <a href="/practice/qa-inspection-cases.csv" download className="qa-practice-download">Download the same cases</a>
          </div>
          {feedback && <section className="qa-practice-feedback" aria-labelledby={`${id}-feedback-title`}>
            <h3 id={`${id}-feedback-title`} tabIndex={-1} ref={feedbackHeading}>Review against the synthetic reference</h3>
            <p>This checks the authored dataset only. You can revise an answer and check again.</p>
            <ul>{feedback.map(item => <li key={item.id} className={item.matches ? 'qa-practice-match' : 'qa-practice-revisit'}>
              <div><strong>{item.title}</strong><span>{item.matches ? 'Matches the reference' : 'Revisit this answer'}</span></div><p>{item.explanation}</p>
            </li>)}</ul>
            <p className="qa-practice-takeaway"><strong>Discuss with a reviewer:</strong> Surface defects Q13–Q16 exist even though their dimensions are within the example limits. These binary flags cannot establish an optimal confidence threshold, real factory performance or safe automation. Explain the consequences of false alarms and missed defects in your own words; this app does not assess that explanation.</p>
          </section>}
        </form>}
      </div>}
    </details>
  </section>;
}
