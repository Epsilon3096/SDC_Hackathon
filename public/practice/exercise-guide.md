# ShiftBridge practice pack

Prepared 21 October 2026. All CSV rows in this pack are **original synthetic training examples**. They contain no worker, employer, production or real model-performance data. The named people in ShiftBridge are synthetic presets.

These are short practice briefs supported by public references, not complete courses, certified assessments or instructions to operate factory equipment. A completed checkbox records an activity. It does not increase the app's proficiency level, certify competence or qualify a worker for a role.

## Files and how to use them

Download a CSV, open it in an existing spreadsheet or text editor, and save a separate working copy. Paper calculations are sufficient. No paid software, API, cloud lab or certification is required for these exercises.

| File | Contents | Suitable use |
| --- | --- | --- |
| [qa-inspection-cases.csv](qa-inspection-cases.csv) | 20 labelled hypothetical inspection cases; one missing measurement | Check sheets, quality summaries, AI errors and human escalation |
| [process-quality-observations.csv](process-quality-observations.csv) | 24 hypothetical samples in two confounded setting groups | Rates, observation versus causation and investigation design |
| [calibration-paper-records.csv](calibration-paper-records.csv) | 12 hypothetical readings at four reference values | Signed error, averages and missing calibration context |
| [investigation-worksheet.csv](investigation-worksheet.csv) | Blank cause/evidence/test worksheet | Record the reasoning for any route |

Each CSV's filename and this guide establish that it is synthetic. If you share a chart or table derived from it, label the output **Synthetic training example — not production data**. Keep the reference links and the unresolved questions with your work.

## Four starter blocks

The application currently budgets four hours per selected block, including reference reading and practice. That is a **team planning estimate**, not a provider's advertised duration. It does not guarantee that every learner can finish both reading and practice in that time. Record actual time and revise the plan if necessary; do not skip a prerequisite to keep the example at sixteen hours.

The documentation → data → investigation sequence is our exercise sequence. The AI branch begins with basic mathematical concepts, then machine-learning foundations, then computer vision. Power BI is not a prerequisite for machine learning. You can work on that AI branch independently of the data branch.

### 1. Build a traceable inspection check sheet

**Application step:** `data-foundations` · **Reference:** [ASQ Check Sheet](https://asq.org/quality-resources/check-sheet).

**Task.** Open the QA CSV. Write a short data dictionary that explains each column, its units or allowed values, and whether it is a reference label, an observation or an AI output. Count rows and confirm that case IDs are unique. Check that every measurement has enough information to compare it with the example tolerance.

Do not fill a missing measurement using the AI flag, an adjacent row or the reference defect label. Identify the missing value, explain why it matters, and mark the record for follow-up. A surface defect can exist even when the recorded dimension is within tolerance; inspection is not reduced to a single measurement.

**Output.** A data dictionary, a check sheet and a three-item list of data-quality checks. Record which row needs follow-up and what information you would request.

**Review criteria.** Someone else can reproduce your counts. Reference labels are not confused with predictions. Units and tolerances remain visible. Missing information is acknowledged instead of invented.

**Effort budget.** Approximately 30 minutes reading, 60 minutes inspecting the data, 90 minutes building the record and 60 minutes checking/explaining it. Adjust to your pace.

### 2. Turn records into a useful quality view

**Application step:** `quality-data-practice` · **Team prerequisite:** documentation block. **Reference:** [Microsoft Learn: Get started building with Power BI](https://learn.microsoft.com/en-us/training/modules/get-started-with-power-bi/).

Read the module for concepts; Microsoft lists no prerequisites for the module itself. You can complete this practice using a manual table or an existing spreadsheet. Publishing to a paid Power BI service is outside the exercise.

Choose the dataset for your route:

| Route | Useful view | Required restraint |
| --- | --- | --- |
| Upgraded QA | Counts of reference defects, AI flags and their disagreement by case or batch | Show the denominator. A flag is not proof of a defect. The tiny synthetic set is not a production estimate. |
| Process exploration | Defect rate for setting groups A and B, with material lot and time order alongside the rate | Several conditions change together. The data do not identify the cause of the difference. |
| Calibration exploration | Signed error and mean error at each reference value, with all individual readings visible | The example limit is an exercise assumption. Arithmetic alone does not establish instrument fitness. |

**Output.** One readable table or chart, its calculation method, two observed patterns and two conclusions the data cannot support. Add the synthetic-data label.

**Review criteria.** Counts use all intended rows. Rates use checked units as the denominator. Labels describe the calculation accurately. Observed patterns and causal hypotheses are clearly separated.

**Effort budget.** Approximately 60 minutes reference reading, 90 minutes calculation/charting, 30 minutes interpretation and 60 minutes checking the output. The provider's duration is unknown.

### 3. Explain when AI inspection needs human review

**Application step:** `inspection-evidence` · **References, in order:** [Introduction to machine learning concepts](https://learn.microsoft.com/en-us/training/modules/fundamentals-machine-learning/), then [Introduction to computer vision concepts](https://learn.microsoft.com/en-us/training/modules/introduction-computer-vision/).

The first module assumes basic mathematics. The second assumes basic machine-learning concepts. Review the foundations first; if they are unfamiliar, expand the time allowance rather than treating them as completed. Reading these modules is not machine-operation authorisation.

**Task.** In the QA dataset, `reference_defect=1` means the hypothetical exercise reference says the item has a defect. `ai_flag=1` means the hypothetical AI flagged it. Build the four cells of a confusion table. List the exact case IDs for false alarms and missed defects.

Explain why a missed defect and a false alarm can have different operational consequences. Write a human-review rule that names the required information, a responsible reviewer and what happens when the record is incomplete. This is a proposed training rule, not a factory safety procedure.

The dataset contains binary flags, not model scores. It cannot determine an optimal confidence threshold or demonstrate how a different threshold would perform. Do not invent either.

**Output.** A confusion table, the error case IDs and a short escalation explanation including the missing-measurement case. Write one sentence distinguishing these synthetic counts from measured model performance.

**Review criteria.** All 20 rows are accounted for. The error categories are correct. The explanation does not imply that a model flag or a missing value can be silently accepted as truth.

**Effort budget.** Four hours of reading and practice as an initial allowance; actual module study time may require more. Record extra time honestly.

### 4. Investigate without jumping to conclusions

**Application step:** `root-cause-practice` · **Team prerequisite:** data block. **Reference:** [ASQ: What is Root Cause Analysis?](https://asq.org/quality-resources/root-cause-analysis).

Use the blank worksheet. Choose a route case below and distinguish observed facts, hypotheses, alternative explanations and evidence that could reject a hypothesis. A cause is not established merely because it is plausible.

**Upgraded QA case.** Explain the missed-defect and false-alarm pattern in the synthetic QA data. Potential follow-up information could include image conditions, defect definitions and review consistency. Those conditions are absent; do not write that lighting or camera placement caused the errors. Propose what you would inspect or test next.

**Process case.** The second group has a higher observed defect rate. Temperature, line speed, material lot and time order also differ. Write at least two competing hypotheses, name the confounding factors, and propose a controlled comparison or appropriate data collection. The exercise does not authorise changing production parameters.

**Calibration case.** Calculate the mean signed error at each reference value and describe the trend. Reference traceability and environmental conditions are missing. Propose which records a qualified reviewer would need before deciding whether the instrument is suitable. Do not adjust a real instrument or issue a calibration certificate from this exercise.

**Output.** A completed worksheet with traceable row references, at least two competing explanations, a way to test each, missing context and a cautious next action.

**Review criteria.** Every asserted fact has a row or source reference. Hypotheses are labelled. A proposed test could reject the preferred explanation. The conclusion retains unresolved uncertainty.

**Effort budget.** Approximately 45 minutes reading, 75 minutes drafting, 60 minutes checking alternatives and 60 minutes peer explanation/revision.

## Optional reference for the calibration case

[NIST Engineering Statistics Handbook: Calibration](https://www.itl.nist.gov/div898/handbook/mpc/section3/mpc3.htm) provides background reading. It is a public reference, not a verified course, practical instrument training or a credential. Its provider duration is not established.

The exercise's `illustrative_allowed_error_mm=0.10` is invented for arithmetic practice. It is not an instrument specification, industry standard or real acceptance criterion. Values of `reference_traceability` and `environment` deliberately make missing context visible.

## Facilitator check — synthetic answers

Use this section after completing your own calculations. These are checks for the authored examples, not evaluation results from real learners or a deployed AI system.

**QA records.** There are 20 unique cases. `Q07` has no measurement. The reference labels contain eight defective and twelve non-defective cases. True positives: six (`Q13`–`Q18`). False positives: three (`Q01`, `Q05`, `Q09`). True negatives: nine. False negatives: two (`Q19`, `Q20`). The four cells sum to twenty.

For this tiny constructed table, the false-positive rate is `3/12`, and the false-negative rate is `2/8`. Both happen to be 25% by construction. Overall classification agreement is `15/20`, or 75%. These values are **not measured RunPod performance**, an industrial benchmark, a model comparison or a forecast. RunPod in ShiftBridge performs text-relevance triage; it did not generate these inspection flags.

**Process observations.** Group A contains 24 defects among 1,200 checked units: 2%. Group B contains 106 among 1,200: approximately 8.83%. A difference is observed; a cause is not identified. Temperature, speed, material lot and time order are confounded, and maintenance context is missing.

**Calibration arithmetic.** Mean indicated-minus-reference errors are +0.06 mm at 5 mm, +0.08 mm at 10 mm, +0.11 mm at 20 mm and +0.15 mm at 30 mm. The last two means exceed the exercise's illustrative ±0.10 mm limit. That is an arithmetic observation, not a calibration pass/fail decision: traceability, uncertainty, environmental conditions and a real specification are absent.

## Scope and recording progress

ShiftBridge initially models six selected dimensions: measurement, visual inspection, documentation, quality-data analysis, AI-inspection literacy and root-cause reasoning. These exercises leave many competencies unassessed, including hands-on instrument use, equipment operation, automation maintenance, process-specific knowledge and workplace safety procedures.

For each block, keep the created output, actual minutes spent, unresolved questions and any reviewer feedback. Marking a block complete records participation only. A later change to proficiency should be an explicit self-report or a separate assessment, with its basis explained. No skill gain, employability improvement or SDG outcome has been measured by publishing this pack.

Reference access was checked on 21 October 2026. Public reading content is available without purchasing a credential. Optional product services, labs, paid training and certification are separate and are not included in the displayed RM 0 learning cost.
