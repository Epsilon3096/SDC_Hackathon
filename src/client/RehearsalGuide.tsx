import React, { useState } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronUp, RotateCcw, X } from 'lucide-react';
import type { AppState } from '../shared/types';
import { rehearsalSteps } from './rehearsal-state';
import './rehearsal.css';

export interface RehearsalGuideProps {
  data: AppState;
  busy: boolean;
  onNavigate: (page: string) => void;
  onExit: () => void;
  onRestart: () => Promise<unknown> | void;
}

export function RehearsalGuide({ data, busy, onNavigate, onExit, onRestart }: RehearsalGuideProps) {
  const [expanded, setExpanded] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const steps = rehearsalSteps(data);
  const done = steps.filter(s => s.complete).length;
  const next = steps.find(s => !s.complete) || steps[steps.length - 1];
  const current = steps.find(s => s.id === selected) || next;
  return <section className="rehearsal-guide" aria-label="Guided demonstration">
    <div className="rehearsal-heading">
      <div><span className="rehearsal-kicker">ISOLATED DEMONSTRATION</span><h2>One worker. One change. A choice you can explain.</h2><p>Your regular workspace is preserved. Every decision below uses the real application and database.</p></div>
      <div className="rehearsal-controls">
        <button type="button" className="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls="rehearsal-details">{expanded ? 'Hide guide' : 'Show guide'}{expanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}</button>
        <button type="button" className="button" disabled={busy} onClick={onExit}><X size={15}/>Exit demonstration</button>
      </div>
    </div>
    <div className="rehearsal-progress" aria-label={`${done} of ${steps.length} demonstration milestones recorded`}><span style={{ width: `${done / steps.length * 100}%` }}/></div>
    {expanded && <div id="rehearsal-details">
      <div className="rehearsal-case"><strong>Constructed case: Farid · QA · moderate adoption</strong><p>Four hours per week, RM 0 learning budget, documentation level 1 and quality-data level 0. These stated synthetic inputs make the ordering trade-off visible; they are not a measured worker outcome. The Intel source is recorded evidence, not a newly fetched article.</p><button type="button" className="button" onClick={() => onNavigate('profile')}>Inspect the case inputs<ArrowRight size={14}/></button></div>
      <ol className="rehearsal-steps">{steps.map((step, index) => <li key={step.id}><button type="button" className={`${current.id === step.id ? 'current' : ''} ${step.complete ? 'complete' : ''}`} onClick={() => setSelected(step.id)} aria-current={current.id === step.id ? 'step' : undefined}><span>{step.complete ? <Check size={14}/> : index + 1}</span>{step.title}<small>{step.complete ? 'Recorded' : 'To demonstrate'}</small></button></li>)}</ol>
      <div className="rehearsal-instruction"><div><h3>{current.title}</h3><p>{current.instruction}</p>{current.complete && <p className="rehearsal-proof"><Check size={14}/>{current.proof}</p>}</div><button type="button" className="button primary" disabled={busy} onClick={() => onNavigate(current.page)}>{current.action}<ArrowRight size={15}/></button></div>
      {done === steps.length && <p className="rehearsal-finished" role="status">All five milestones are recorded. The demo shows evidence review, a model update, restraint and a worker’s explicit adoption. It does not establish an employment or time-saving result.</p>}
      <div className="rehearsal-footer"><span>{done}/{steps.length} milestones recorded · Suggested presentation: 6 minutes · GPU requests are disabled here.</span><button type="button" className="button" disabled={busy} onClick={() => setConfirmRestart(!confirmRestart)}><RotateCcw size={14}/>Restart this demonstration</button></div>
      {confirmRestart && <div className="rehearsal-restart" role="group" aria-label="Restart demonstration confirmation"><p>Replace only this rehearsal’s synthetic profiles, reviews and plans with the starting case. Your regular workspace stays intact.</p><button type="button" className="button primary" disabled={busy} onClick={async () => { await onRestart(); setConfirmRestart(false); setSelected(null); }}>Restart the rehearsal</button><button type="button" className="button" onClick={() => setConfirmRestart(false)}>Keep this run</button></div>}
    </div>}
  </section>;
}
