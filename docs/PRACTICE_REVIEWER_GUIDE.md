# QA practice: facilitator reference

This is an answer reference for the original **synthetic** `public/practice/qa-inspection-cases.csv`, not a validated skills examination or a factory operating procedure. Keep it separate from a participant's first unaided attempt. A completed exercise or app checkbox does not automatically change proficiency or confer permission to operate equipment.

## Check the example before discussing it

The file has twenty distinct cases, Q01-Q20. `reference_defect` is the hypothetical exercise label; `ai_flag` is the hypothetical prediction. Neither column supplies the missing dimensional measurement. All figures below describe this teaching dataset only, not a deployed model's performance.

| Exercise reference | AI flag 1 | AI flag 0 | Total |
| --- | ---: | ---: | ---: |
| Defect 1 | 6 true positives | 2 missed defects | 8 |
| No defect 0 | 3 false alarms | 9 true negatives | 12 |
| Total | 9 | 11 | 20 |

- False alarms: **Q01, Q05, Q09**. The model flag disagrees with the provided no-defect reference.
- Missed defects: **Q19, Q20**. The exercise reference indicates a defect, but the model flag is zero.
- Missing measurement: **Q07**. Both binary labels are zero, but that does not establish dimensional conformity. Retain the blank, identify the missing information and request the required measurement/context through the appropriate supervised process.
- Q13-Q16 illustrate a surface defect even though their recorded dimension lies within the example limits. One measurement is not a complete inspection decision.
- Q17-Q20 have measurements outside the example tolerance. This tolerance is part of the exercise, not a general industrial specification.

## A defensible discussion output

The learner should name the exact disagreement cases, distinguish reference labels from predictions, explain why missed defects and false alarms may have different consequences, and identify the unresolved Q07 information. A proposed escalation explanation should name the required information, responsible reviewer and next supervised check. It must not invent a reading, authorise equipment operation or treat this sample as evidence of safe automation.

This CSV contains binary flags, not a range of confidence scores. It cannot support an optimal threshold, a threshold-sensitivity curve or an estimate of real factory error rates. There is no basis for a Malaysian employment forecast or a claimed economic saving.

## Suggested observation sheet

Record whether the participant independently: (1) accounts for all twenty rows, (2) identifies all five disagreement cases, (3) retains and escalates the missing value, and (4) states what the synthetic example cannot establish. Log help and corrections explicitly. Do not describe this four-item observation checklist as validated competency assessment. Independent occupational reviewers must refine it before a real pilot.

Use `docs/submission/pilot_results.csv` for the separate planning-usability task. That task's timing and source/prerequisite correctness are different from performance on this practice exercise; do not combine them into an invented impact number.
