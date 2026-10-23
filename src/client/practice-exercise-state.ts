export type InspectionCase = {
  id: string;
  batch: string;
  referenceDefect: 0 | 1;
  aiFlag: 0 | 1;
  measurement: number | null;
  lower: number;
  upper: number;
  defectType: string;
};

export type CountKind = 'tp' | 'tn' | 'fp' | 'fn';
export const countLabels: Record<CountKind, string> = {
  tp: 'True positives', tn: 'True negatives', fp: 'False alarms', fn: 'Missed defects',
};
export const countDefinitions: Record<CountKind, string> = {
  tp: 'Reference defect 1, AI flag 1', tn: 'Reference defect 0, AI flag 0',
  fp: 'Reference defect 0, AI flag 1', fn: 'Reference defect 1, AI flag 0',
};
export const countKinds: CountKind[] = ['tp', 'tn', 'fp', 'fn'];
export type PracticeAnswers = {
  counts: Record<CountKind, string>;
  missedIds: string[];
  missingAction: string;
};
export type PracticeFeedback = { id: string; title: string; matches: boolean; explanation: string };

export function blankPracticeAnswers(): PracticeAnswers {
  return { counts: { tp: '', tn: '', fp: '', fn: '' }, missedIds: [], missingAction: '' };
}

// This parser is deliberately restricted to the authored, unquoted teaching CSV.
// A changed or incomplete dataset must fail visibly instead of inventing answers.
export function parseInspectionCsv(csv: string): InspectionCase[] {
  const lines = csv.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const header = 'case_id,batch_id,reference_defect,ai_flag,measurement_mm,tolerance_lower_mm,tolerance_upper_mm,reference_defect_type';
  if (lines.shift() !== header || lines.length !== 20) throw new Error('The practice dataset is incomplete or has an unexpected format.');
  const number = (value: string): number => {
    if (!/^-?\d+(?:\.\d+)?$/.test(value) || !Number.isFinite(Number(value))) throw new Error('A practice measurement is invalid.');
    return Number(value);
  };
  return lines.map((line, index) => {
    const fields = line.split(',');
    const [id, batch, reference, flag, measurement, lower, upper, defectType] = fields;
    if (fields.length !== 8 || id !== `Q${String(index + 1).padStart(2, '0')}` || !/^B-[AB]$/.test(batch)
      || !/^[01]$/.test(reference) || !/^[01]$/.test(flag) || !/^[a-z_]+$/.test(defectType)) {
      throw new Error('The practice dataset contains an unexpected record.');
    }
    const parsedLower = number(lower), parsedUpper = number(upper);
    if (parsedLower > parsedUpper) throw new Error('The practice tolerance is invalid.');
    return { id, batch, referenceDefect: Number(reference) as 0 | 1, aiFlag: Number(flag) as 0 | 1,
      measurement: measurement === '' ? null : number(measurement), lower: parsedLower, upper: parsedUpper, defectType };
  });
}

export function classifyInspectionCase(row: InspectionCase): CountKind {
  return row.referenceDefect ? row.aiFlag ? 'tp' : 'fn' : row.aiFlag ? 'fp' : 'tn';
}

export function checkPracticeAnswers(cases: InspectionCase[], answers: PracticeAnswers): PracticeFeedback[] {
  const reference = { tp: [] as string[], tn: [] as string[], fp: [] as string[], fn: [] as string[] };
  for (const row of cases) reference[classifyInspectionCase(row)].push(row.id);
  const feedback: PracticeFeedback[] = countKinds.map(kind => ({
    id: kind, title: countLabels[kind],
    matches: /^\d+$/.test(answers.counts[kind]) && Number(answers.counts[kind]) === reference[kind].length,
    explanation: `${reference[kind].length} of ${cases.length} cases: ${reference[kind].join(', ') || 'none'}. ${countDefinitions[kind]}.`,
  }));
  const selected = new Set(answers.missedIds);
  feedback.push({ id: 'missed-cases', title: 'Exact missed-defect cases',
    matches: selected.size === reference.fn.length && reference.fn.every(id => selected.has(id)),
    explanation: `${reference.fn.join(' and ')} have a defect in the exercise reference but an AI flag of 0. A missing measurement alone does not determine this classification.`,
  });
  const missingIds = cases.filter(row => row.measurement === null).map(row => row.id);
  feedback.push({ id: 'missing-measurement', title: 'Missing measurement response',
    matches: answers.missingAction === 'retain-and-escalate',
    explanation: `${missingIds.join(', ')}: retain the blank, request the required measurement and context, and refer the unresolved record to the responsible supervisor or qualified reviewer. Neither binary label supplies a dimensional measurement.`,
  });
  return feedback;
}
