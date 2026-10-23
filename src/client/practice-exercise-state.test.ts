import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { blankPracticeAnswers, checkPracticeAnswers, classifyInspectionCase, parseInspectionCsv } from './practice-exercise-state';

const csv = readFileSync(new URL('../../public/practice/qa-inspection-cases.csv', import.meta.url), 'utf8');
const cases = parseInspectionCsv(csv);
const complete = { counts: { tp: '6', tn: '9', fp: '3', fn: '2' }, missedIds: ['Q19', 'Q20'], missingAction: 'retain-and-escalate' };

describe('QA exercise uses the original synthetic case file', () => {
  it('preserves all 20 cases and the missing measurement rather than coercing it to zero', () => {
    expect(cases).toHaveLength(20);
    expect(cases.find(row => row.id === 'Q07')?.measurement).toBeNull();
    expect(cases.filter(row => row.measurement === null).map(row => row.id)).toEqual(['Q07']);
  });
  it('keeps reference labels distinct from dimensions and predictions', () => {
    expect(cases.filter(row => classifyInspectionCase(row) === 'fp').map(row => row.id)).toEqual(['Q01', 'Q05', 'Q09']);
    expect(classifyInspectionCase(cases[6])).toBe('tn');
    expect(classifyInspectionCase(cases[12])).toBe('tp');
    expect(cases[12].measurement).toBeLessThan(cases[12].upper);
  });
  it('checks every authored answer, without mutating inputs or awarding proficiency', () => {
    const before = structuredClone(complete);
    const result = checkPracticeAnswers(cases, complete);
    expect(result).toHaveLength(6);
    expect(result.every(item => item.matches)).toBe(true);
    expect(result[3].explanation).toContain('Q19, Q20');
    expect(result[5].explanation).toContain('Q07');
    expect(complete).toEqual(before);
    expect(result.every(item => !('proficiency' in item))).toBe(true);
  });
  it('does not accept unanswered fields as zero, or as an escalation decision', () => {
    expect(checkPracticeAnswers(cases, blankPracticeAnswers()).every(item => !item.matches)).toBe(true);
  });
  it.each(['6.0', '6e0', '-6', '6x', 'Infinity'])('rejects malformed whole-number count %s', value => {
    expect(checkPracticeAnswers(cases, { ...complete, counts: { ...complete.counts, tp: value } })[0].matches).toBe(false);
  });
  it.each([['Q19'], ['Q19', 'Q20', 'Q07'], ['Q01', 'Q05'], ['Q19', 'Q99']])('requires the exact missed-defect set %j', (...ids) => {
    expect(checkPracticeAnswers(cases, { ...complete, missedIds: ids })[4].matches).toBe(false);
  });
  it('accepts case selection in either order', () => {
    expect(checkPracticeAnswers(cases, { ...complete, missedIds: ['Q20', 'Q19'] })[4].matches).toBe(true);
  });
  it.each(['accept-ai', 'copy-neighbour', 'discard-record'])('explains why %s is not a defensible response', missingAction => {
    const item = checkPracticeAnswers(cases, { ...complete, missingAction })[5];
    expect(item.matches).toBe(false);
    expect(item.explanation).toContain('retain the blank');
  });
  it.each([
    ['incomplete', csv.split('\n').slice(0, 19).join('\n')],
    ['duplicate identifier', csv.replace('Q20,', 'Q19,')],
    ['invalid flag', csv.replace('Q01,B-A,0,1,', 'Q01,B-A,0,2,')],
    ['invalid measurement', csv.replace('9.98', 'NaN')],
    ['inverted tolerance', csv.replace('9.90,10.10', '10.10,9.90')],
    ['HTML error body', '<html>Not found</html>'],
  ])('rejects %s data instead of showing misleading answer feedback', (_label, content) => {
    expect(() => parseInspectionCsv(content)).toThrow();
  });
});
