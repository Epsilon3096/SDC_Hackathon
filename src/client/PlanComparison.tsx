import React from 'react';
import { ArrowRight, Check, Route } from 'lucide-react';
import type { Plan } from '../shared/types';
import { comparePlanSteps } from './plan-comparison';
import './plan-comparison.css';

export function PlanComparison({ before, after, onOpenPlan }: { before: Plan; after: Plan; onOpenPlan: () => void }) {
  const comparison = comparePlanSteps(before, after);
  if (!comparison) return <section className="panel pad"><h2>Plan comparison needs matching inputs</h2><p>Select the same worker revision, route and scenario so an evidence change can be compared fairly.</p></section>;
  return <section className="panel plan-comparison" aria-label="Learning step order comparison">
    <div className="plan-comparison-heading"><div><span className="eyebrow">THE PRACTICAL DIFFERENCE</span><h2>{comparison.firstStepChanged ? 'Your suggested first step changes.' : comparison.orderChanged ? 'The suggested learning sequence changes.' : 'The learning order stays useful.'}</h2><p>Both suggestions use the same profile v{after.profileVersion}, route and scenario. This compares plans generated from two evidence snapshots; it does not overwrite your accepted plan.</p></div><Route size={25}/></div>
    <div className="next-step-comparison"><div><span>Earlier first step</span><strong>{before.steps[0]?.title || 'No feasible step'}</strong></div><ArrowRight size={20}/><div><span>Current first step</span><strong>{after.steps[0]?.title || 'No feasible step'}</strong></div></div>
    {!comparison.orderChanged && <p className="plan-order-retained"><Check size={16}/>A priority can change without reordering a prerequisite-valid plan. The app reports that explicitly.</p>}
    <ol className="plan-order-list">{comparison.rows.map(row => <li key={row.id}><div className={`plan-position ${row.change}`} aria-label={`Earlier position ${row.from ?? 'not included'}, current position ${row.to}`}><span>{row.from ?? '—'}</span><ArrowRight size={13}/><strong>{row.to}</strong></div><div><h3>{row.title}</h3><p>{row.change === 'added' ? 'Added to this suggestion.' : row.change === 'moved' ? `Moves from step ${row.from} to step ${row.to}.` : 'Position unchanged.'} {row.prerequisiteIds.length ? `After: ${row.prerequisiteIds.map(id => after.steps.find(s => s.resourceId === id)?.title || id).join('; ')}.` : 'No earlier step required.'}</p>{row.change !== 'unchanged' && <details><summary>Why this step is included</summary><p>{row.reason}</p></details>}</div></li>)}</ol>
    {comparison.removed.length > 0 && <div className="removed-plan-steps"><strong>No longer in this suggested phase</strong><ul>{comparison.removed.map(step => <li key={step.resourceId}>{step.title}</li>)}</ul><p>Earlier saved plans and recorded completion remain available.</p></div>}
    <div className="plan-comparison-footer"><span>Changing recommendations never changes self-reported skill levels.</span><button type="button" className="button primary" onClick={onOpenPlan}>Review my learning plan<ArrowRight size={15}/></button></div>
  </section>;
}
