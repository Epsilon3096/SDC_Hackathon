# ShiftBridge source and learning catalogue research

Verified 21 October 2026 (Asia/Kuala_Lumpur). Prepared for implementation, not proof of a deployed integration. Only primary publishers were used. Dates below retain the precision actually shown by the publisher; a retrieval date must never become a publication date.

## Decisions for the production seed

- Keep three routes, but call the numeric result **alignment across six selected skills**. It is not complete occupational readiness or a hiring probability.
- Upgraded QA is the most defensible first route. Process Technician is an adjacent route with a broader competency gap. Calibration Technician is exploratory pending local validation.
- Default all universal employer qualification requirements to **unknown**. No source below establishes a universal Malaysian diploma requirement for these roles.
- Correct the Intel source to **December 2023**. The URL's `2023-11` directory is not the publication date. Page 1 of the linked PDF explicitly says December 2023.
- Research relevance is separate from evidence supporting a workforce change. The arXiv paper below is a good relevant-but-insufficient case.
- Use verified public reading/module resources plus clearly named team-authored practice briefs. Do not call ASQ/NIST reference pages certified courses or attach fabricated provider durations.

## Evidence sources

All records have `retrievedOn: 2026-10-21`. Preserve content hashes when importing. Do not fabricate exact timestamps for this research record.

| Suggested ID | Primary source and URL | Date to store/display | Evidence class and permitted use |
| --- | --- | --- | --- |
| `intel-inline-2023` | Intel, [Computer Vision and AI for Inline Inspection](https://www.intel.com/content/www/us/en/it-management/intel-it-best-practices/smart-mfg-computer-vision-ai-inspection.html); [dated white paper](https://www.intel.com/content/dam/www/central-libraries/us/en/documents/2023-11/intel-it-smart-manu-using-ai-inline-paper.pdf) | `dateLabel: December 2023`, precision `month`; no invented day | Manufacturer deployment account. Supports inspection automation as a real technical change. Does not establish Malaysian vacancy growth, job losses, or ShiftBridge impact. |
| `talentcorp-ee-2024` | TalentCorp, [Impact Study of Artificial Intelligence, Digital, and Green Economy on the Malaysian Workforce, Volume 2: Electrical and Electronics](https://www.talentcorp.com.my/images/uploads/publication/195/Impact-Study-of-Artificial-Intelligence-Digital-and-Green-Economy-on-the-Malaysian-Workforce-Volume-2-Sector-Electrical-and-Electronics-1747879257.pdf) | Copyright 2024; exact publication day unknown. Store year as edition/copyright metadata, not an invented exact publication date. | Malaysian sector study. QA Technician and Process Technician are medium-impacted/evolving roles in its framework. Printed pp. 67 and 70 support specific role skills. This is contextual evidence, not a forecast for a particular worker or employer. |
| `onet-inspection-2026` | O*NET, [51-9061.00 Inspectors, Testers, Sorters, Samplers, and Weighers](https://www.onetonline.org/link/summary/51-9061.00) | Updated 2026, precision `year`; exact day unknown | US occupational task reference. Supports inspection, measurement, documentation, test-data analysis and monitoring automated inspection. Do not import US wages, demand or education statistics as Malaysian facts. |
| `onet-process-2026` | O*NET, [17-3027.00 Mechanical Engineering Technologists and Technicians](https://www.onetonline.org/link/summary/17-3027.00) | Updated 2026, precision `year` | US task reference explicitly including Process Technician among reported titles. Its scope includes mechanical systems and equipment: our six skills cover only part of this route. |
| `onet-calibration-2026` | O*NET, [17-3028.00 Calibration Technologists and Technicians](https://www.onetonline.org/link/summary/17-3028.00) | Updated 2026, precision `year` | US occupation reference supporting measurement, calibration tests, reporting and test analysis. Publisher says its profile is incomplete and data collection is ongoing. No universal Malaysian entry gate established. |
| `mycol-2024-2025` | TalentCorp, [MyMahir Malaysia Critical Occupations List 2024/2025](https://www.talentcorp.com.my/resources/publications/mymahir-malaysia-critical-occupations-list-mycol20242025/); [official brochure](https://www.talentcorp.com.my/images/uploads/publication/205/MyMahir-Malaysia-Critical-Occupations-List-20242025-Brochure-1763369069.pdf) | Edition 2024/2025; exact publication day not established | Malaysian labour context. Do not infer that each of the three app routes is individually on the critical list from the homepage or brochure alone. The sector impact report is more directly useful for QA/process route content. |
| `arxiv-patchcore-2106.08265v2` | Roth et al., [Towards Total Recall in Industrial Anomaly Detection](https://arxiv.org/abs/2106.08265v2) | First submitted `2021-06-15`; revised `2022-05-05`; preserve version `v2` | Research, accepted to CVPR 2022 according to the record. Introduces PatchCore for industrial anomaly detection with non-defective example images. Relevant to inspection, but benchmark results do not prove factory deployment or local skill demand. |
| `jpk-qualification-types` | Department of Skills Development, [Malaysian Skills Certificate](https://www.dsd.gov.my/en/service/malaysian-skills-certificate-skm) | Publication date unknown; official search extract verified 21 October after direct fetch timed out | Qualification naming reference: SKM levels 1–3; DKM level 4; DLKM level 5. Academic diploma is a distinct type; no blanket equivalence or employer eligibility implied. |

The TalentCorp PDF was downloaded, text-extracted and the relevant table spreads visually verified. Printed page 67 gives Process Technician skills including continuous improvement, quality systems and operation/control. Printed page 70 gives QA Technician skills including automated monitoring and maintenance. Broader competencies remain outside our initial six-skill model. Local research copy: `work/catalogue-sources/talentcorp-ee-impact.pdf`; do not bundle the complete copyrighted report into the public app repository.

## Short passages for auditable mappings

Use one exact passage per selected source, with a page/task locator and original link. Keep each source's total quoted text short. The interpretation and numeric adjustment are our explicit design hypotheses, not quotations or publisher-provided weights.

| Source | Exact short passage | Locator | Defensible interpretation |
| --- | --- | --- | --- |
| Intel webpage | “Intel IT is using computer vision and AI for inline inspection in Intel’s assembly and test factories.” | Introductory statement | Workers in a comparable process may need literacy in automated inspection outputs. Applicability needs review; do not generalise a deployment into nationwide demand. |
| O*NET inspection | “Monitor machines that automatically measure, sort, or inspect products.” | Task list | Automated-inspection monitoring fits the inspection occupation's documented task scope. |
| TalentCorp E&E | “Automated Operation Monitoring”; “Automation System Maintenance” | Printed p. 70, QA Technician | Supports an upskilling route in QA. Maintenance is broader than AI literacy and must remain an unresolved competency, not silently treated as covered. |
| TalentCorp E&E | “Continuous Improvement”; “Quality Systems Management”; “Operation and Control” | Printed p. 67, Process Technician | Supports process-related learning. These are not qualification requirements and do not establish our exact proficiency thresholds. |

For the arXiv case, prefer a short original paraphrase with its abstract link: a model is evaluated on industrial anomaly-detection benchmarks. Mark it **research; workforce implication not established**. The prototype need not quote the whole abstract.

## Six initial skill dimensions

These are product taxonomy definitions, not a full competency standard. Levels and weights need team validation.

| Stable skill ID | Working definition | Evidence anchor and limit |
| --- | --- | --- |
| `measurement` | Use measurements and tolerances to identify deviations and understand when instrument checks are needed. | O*NET inspection/calibration; NIST calibration. Does not certify practical metrology competence. |
| `visual_inspection` | Recognise visible defects against an explicit inspection specification and escalate uncertain cases. | O*NET inspection. AI literature does not establish a worker's visual assessment proficiency. |
| `quality_documentation` | Record observations, sampling context, decisions and traceable inspection results. | O*NET inspection; ASQ check-sheet guidance. |
| `quality_data` | Read basic quality data and distinguish a data pattern from a supported conclusion. | O*NET inspection/process; ASQ control charts; Power BI introductory module. |
| `ai_inspection` | Understand automated inspection outputs, error modes and the need for human escalation. | Intel deployment plus TalentCorp QA context; foundational ML/CV learning. A reading module is not machine-operation authorisation. |
| `root_cause` | Form and test plausible causes, distinguish symptoms, and document follow-up action. | ASQ RCA; broader process-improvement context. No single article proves mastery. |

## Verified learning resources

Every row was checked on 21 October 2026. All URLs below expose English content. Duration values were not reliably shown in the retrieved provider pages, so use `providerDurationMinutes: null`. A module's number of units is not a time estimate. Suggested study/practice effort must have `estimateBy: ShiftBridge team` and remain adjustable.

| ID | Exact title, publisher, URL | Prerequisites | Access, cost and credential | Suggested use |
| --- | --- | --- | --- | --- |
| `learn-powerbi` | Microsoft Learn, [Get started building with Power BI](https://learn.microsoft.com/en-us/training/modules/get-started-with-power-bi/) | Provider says none | Beginner module, six units. Training content free; account needed to retain achievements. Certification not included; software/service access is separate. | Introductory quality-data reporting, with a synthetic defect dataset practice brief. |
| `learn-ml` | Microsoft Learn, [Introduction to machine learning concepts](https://learn.microsoft.com/en-us/training/modules/fundamentals-machine-learning/) | Provider: basic mathematics | Beginner module, eleven units. Training content free. No occupational certification supplied. | Foundations before CV; distinguish training examples, predictions and model evaluation. |
| `learn-cv` | Microsoft Learn, [Introduction to computer vision concepts](https://learn.microsoft.com/en-us/training/modules/introduction-computer-vision/) | Provider: basic machine-learning concepts; `learn-ml` is our suggested preparation | Beginner module, nine units. Training text free; external exercise environment access/cost not established. | Introductory concepts. Do not imply it specifically certifies factory inspection or fully teaches failure-mode handling. |
| `asq-check-sheet` | ASQ, [Check Sheet](https://asq.org/quality-resources/check-sheet) | No formal prerequisite stated; team suggests basic counting and a defined defect vocabulary | Public reference article readable without payment. No provider duration or credential. Linked commercial products are separate. | Create an original synthetic inspection log; practice documentation and consistent observation. |
| `asq-control-chart` | ASQ, [Control Chart](https://asq.org/quality-resources/control-chart) | No formal prerequisite stated; team suggests check-sheet practice and basic averages | Public reference article, not a certified course. No provider duration. | Interpret time-ordered quality observations; follow with a practice brief and avoid conflating control limits with engineering tolerances. |
| `asq-rca` | ASQ, [What is Root Cause Analysis (RCA)?](https://asq.org/quality-resources/root-cause-analysis) | No formal prerequisite stated; team suggests familiarity with the process and recorded observations | Public reference article. Separate paid training/certification links exist; no free four-hour course verified. | Build a cause/evidence/action worksheet from a synthetic defect case. |
| `nist-calibration` | NIST/SEMATECH e-Handbook, [2.3. Calibration](https://www.itl.nist.gov/div898/handbook/mpc/section3/mpc3.htm) | No formal prerequisite stated; team suggests basic measurement concepts and mathematics | Public reference section. No provider duration or credential. | Introduce reference standards and bias before a team-designed paper-only calibration-record exercise. |

Microsoft confirms free training and optional profiles in its [Learn FAQ](https://learn.microsoft.com/en-us/training/support/faq). This supports `learningContentCostMYR: 0`; it does not establish that every optional cloud exercise, product subscription or certification exam is free. For ASQ/NIST, label the zero value **public reading access**, based on direct access at verification time. Mark certifications **not included**, not “RM 0 certificate”.

The e-LATiH homepage is not seeded as a course because no specific course record was verified in this review. There is also no verified practical visual-inspection or hands-on calibration course here. Expose those limitations in any longer-term route.

## Sensible prerequisite and route design

- Common documentation/data branch: check-sheet reference and practice → introductory quality-data work → control-chart interpretation where appropriate.
- AI branch: basic mathematics confirmed → ML concepts → CV concepts → team-authored exercise distinguishing false alarms, missed defects and escalation decisions. Power BI is not an ML prerequisite.
- Process branch: documentation → data/control-chart interpretation → RCA worksheet; list unassessed machine/process operation and employer-specific technical competencies.
- Calibration branch: measurement foundations → NIST calibration concepts → traceable calibration-record exercise → RCA where useful; list practical instrument training, uncertainty analysis and local entry conditions as unresolved.
- Upgraded QA can combine the documentation and AI branches. Select four milestones if desired, but a milestone can contain prerequisites and effort may exceed sixteen hours. Do not omit prerequisites merely to reach four cards.

Do not automatically translate a checked learning step into higher proficiency. Completion records participation; competence requires an explicit assessment or revised self-report. Team practice briefs are not full courses and should point to the original sources rather than reproducing them.

## Remaining limits

No real employer listing or Malaysian occupation-wide prerequisite was validated, so all general qualification eligibility remains unknown. No course duration or external certificate fee was established. No measured employment, salary, productivity or planning-time outcome was collected. Numeric scenario adjustments and six-skill role levels remain transparent prototype assumptions, not source facts.
