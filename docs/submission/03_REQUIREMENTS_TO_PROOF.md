# Requirements to proof — ShiftBridge

Updated 23 October 2026 from the current source, `docs/BUILD_STATUS.md`, the supplied Domain 1 brief and the original template audit. This matrix distinguishes implementation proof, developer verification and external submission obligations. It is not a predicted judging score or confirmation of eligibility.

## Six Domain 1 must-haves

| Requirement | Working implementation | What to show / inspect | Limits and remaining proof |
| --- | --- | --- | --- |
| 1. Skills intake | Two synthetic presets; editable six-level profile, unknown values, qualification, experience, time and budget. | My profile → save → role/plan evaluation changes. `src/shared/types.ts`, profile validation in `src/server/app.ts`; `tests/engine.test.ts`, `tests/api.test.ts`. | Self-report, not validated competency assessment. Synthetic-only policy; no real CVs. |
| 2. Updatable AI trend source with source/date | arXiv Atom/RSS ingestion; bounded responses, dates, content hashes and deduplication. Source candidates enter review, not scoring automatically. | Evidence Studio refresh; inspect actual article URL/date or unknown date, retrieval metadata and research limitation. `src/server/connectors.ts`, connector/API tests. | A real refresh was recorded in build verification. Repeat in the final environment; a failure is not live-success proof. RSS announcement date is not publication date. Initial passage inference is verified; wider model quality remains unmeasured. |
| 3. Ranked future roles, explainable score and missing skills | Three exploratory routes; normalized coverage, skill contributions/gaps, explicit unknown ranges; separate eligibility groups. | Explore roles → breakdown. Show why current QA development remains viable while adjacent entry requirements are unknown. `src/shared/engine.ts`; engine and mapping-scope tests. | Six selected skills only. Base requirements/weights are prototype assumptions, not expert-calibrated hiring standards. No universal diploma gate. |
| 4. Personalized ordered reskilling pathway, effort and affordable resources | Prerequisite ordering, study pace/budget, verified-price selection, practice outputs and external resources; explicit adoption and preserved original decision. | Learning plan → inspect prerequisites → download QA practice/decision brief → adopt revision. Engine/decision-brief/API tests. | Four-hour blocks are team estimates. RM 0 covers chosen public reading/paper practice; credentials and paid tools are separate. Completion records activity only. |
| 5. SDG mapping for every role and skill | Role/skill catalogue includes SDG and contribution explanations; impact page explains intended educational relevance. | Role SDG explanation and all six skill explanations on SDG Impact. `src/shared/catalogue.ts`. | Mapping is a theory of contribution, not measured SDG progress, job retention or emissions reduction. Independent outcome study absent. |
| 6. Uncertainty and multiple futures | Moderate/faster adoption scenarios, bounded rule adjustments, unknown skill/qualification states, conflict restraint and published evidence versions. | Scenario switch and source rule rationale; missing skill range. `src/shared/engine.ts`; tests of bounds, monotonicity, unknowns and conflicts. | Scenarios are assumptions, not probabilities. The two scenarios can honestly be identical before a relevant adjustment exists. |

## Decision-value proof

The guided case is constructed from Farid’s synthetic preset with documentation **1/4**, quality-data analysis **0/4**, **4 hours/week** and **RM 0**. It is explicitly labelled, and uses real review/publication/adoption operations in a separate persisted workspace.

| Observation | Before Intel publication | After QA-scoped Intel publication | Interpretation |
| --- | --- | --- | --- |
| Moderate QA alignment | 52.13/100 | 51.02/100 | Changed model weights, not lost proficiency or a measured worker outcome. |
| Faster QA alignment | 52.13/100 | 49.48/100 | A different stated adoption assumption, not a probability estimate. |
| Learning order | Documentation → quality data → AI inspection → root cause | AI inspection → documentation → quality data → root cause | The next action actually changes; remaining prerequisite ordering stays valid. |
| Planned effort, pace and access cost | 16 hours, 4 weeks, RM 0 | 16 hours, 4 weeks, RM 0 | Priority changed, not a fabricated saving in total study time. |
| Process/calibration results under this new rule | Baseline | Unchanged | New rule is explicitly scoped to QA. Older unscoped snapshots retain their original all-route meaning and show a legacy label. |
| Accepted worker plan | Baseline decision | Preserved until explicit adoption | Evidence publication does not silently replace the worker’s decision. |

These numbers were reproduced directly from the current shared engine on 21 October 2026. Confirm them again against the final build if modelling inputs change. Do not force every profile to reorder: Aina’s default order can remain unchanged while weights change, and the UI should say so.

## Tested integrity, not external certification

`../BUILD_STATUS.md` records the 23 October local checkpoint: 257 application tests passed, three optional real-PostgreSQL transaction tests skipped, and TypeScript checking, production build and built-app smoke passed. Eleven offline Python worker tests passed. The previous 22 October production dependency audit reported zero known vulnerabilities; dated browser checks are recorded separately. Replit commit `b9e1365` separately passed the same 257-test/build/smoke checks; later UI refinements await upload. GitHub CI is prepared but has not run remotely. Preserve actual dated output and recheck the final environment before recording; these developer results are not user-validation evidence.

| Claim | Supporting files or observable evidence | What it does not prove |
| --- | --- | --- |
| Approval and publication are distinct; weak evidence cannot alter accepted results | API tests; actual UI review/publish/reject sequence | That every human interpretation is correct |
| Saved decisions keep original inputs/results | `Plan.decision`, `src/shared/decision-brief.ts`, decision-brief tests | Immutable archival of all external publisher webpages or every catalogue description |
| Historical correction is explicit | Retirement/replacement API tests and snapshot history | ISO compliance, audit certification or regulator acceptance |
| Workspace/rehearsal isolation and stale-write protections | Store/API/rehearsal tests and browser restart/exit sequence | Production-grade identity administration or independent security audit |
| Readable desktop/mobile layout | Recorded 1280px and 390px browser checks | Full accessibility certification or physical-device coverage |
| Synthetic confusion-table practice | `public/practice/qa-inspection-cases.csv`, in-app deterministic feedback, `docs/EXERCISES.md` | Model quality: these invented binary flags were not generated by RunPod |

## Required preliminary deliverables

| Deliverable | Prepared locally | Still required before actual submission |
| --- | --- | --- |
| Official proposal / PRD | `01_PRELIMINARY_PROPOSAL.md`; all numbered template responses and bounded prose | Team fields, empirical or properly sourced estimated baseline, confirmations, final template placement, signature, named PDF |
| Pitch deck | `05_PITCH_DECK_COPY.md` and editable `outputs/ShiftBridge_Console_Pitch_DRAFT.pptx`; all eight slides rendered and visually checked | Participant content approval, rehearsal in the intended app and verified final links |
| Accessible working prototype/build | Current local app, README and build instructions | Final judge-accessible build/link verified without owner session; final hosted verification remains pending |
| Technical Tools Declaration | `02_TECHNICAL_TOOLS_DECLARATION.md`, dependency inventories | Exact assistant model labels, all member tools/resources, licensing review, sponsor details, signature, named PDF |
| GitHub/source link | Local source and Apache-2.0 LICENSE | Public repository accessible throughout judging, verified without owner credentials; README links, attribution/secret review and authentic history. Participant Handbook physical p29 §§10.2–10.5 is stricter than the declaration template's private judge-access option. |
| 5–7 minute YouTube pitch + demo | `04_RECORDING_SHOT_LIST.md`, narration/deck copy | Human recording, final playback/audio/duration check, upload and anonymous-access link test |

## Gaps requiring human or external evidence

1. **Team ownership and eligibility:** registered identity, team size, university details, workshop attendance, any pre-existing work and employment-related IP. Major Codex assistance is disclosed. Each member must understand the work and substantively own the framing; assistant-generated content cannot certify that requirement.
2. **Impact baseline:** no independent planning-time experiment or intended-user validation exists yet. The proposal deliberately leaves the measured baseline unfilled. Its 30% improvement is a proposed future target only. Use the blank pilot sheet; do not relabel developer rehearsal time as participant evidence.
3. **Runtime AI:** one public-passage result was accepted by the app and six synthetic triage cases completed. A created endpoint does not make deterministic planning a model-inference engine. Exact revision/job evidence and the six-case ranking observation are in `../RUNPOD_VERIFICATION.md`; wider representative evaluation remains outstanding.
4. **Deployment/sponsor compliance:** setup has resumed within existing US$20 Replit/US$25 RunPod credits. Endpoint creation and repository/key configuration are progress, not completed inference or an event exemption. Earlier Replit preview/persistence tests do not verify the current build or a published stable link. Initial genuine RunPod execution proof exists; it does not alone establish sponsor compliance.
5. **Submission access and formatting:** official named PDFs, signed declarations, actual deck, public repository accessible throughout judging and recorded YouTube link still require completion. Private judge access alone does not meet the supplied Participant Handbook's public-repository requirement (physical p29 §10.3).
6. **Source/licence final review:** dependency metadata is recorded, but each third-party asset keeps its rights. Do not upload the entire TalentCorp report, copied course material or secret-bearing local files as original Apache-licensed work.
7. **Official timing/conflicts:** the reviewed handbook says 25 October 2026 at 07:59:59 MYT; other reviewed material says 23:59. The template gives only the date. The conservative internal completion target is 24 October; obtain the latest official instruction before relying on a later time. Workshop attendance and RunPod conditionality also remain unresolved in the reviewed materials.

Source of competition obligations: `work/template_audit.md`, `work/submission_template.txt`, `work/tools_declaration_template.txt`, `work/original_domain1.txt`, and the local strategy report’s deliverables section. This pack does not re-verify current organizer announcements and sends no messages on the team’s behalf.
