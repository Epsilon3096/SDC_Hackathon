# SDC 2026 Phase 1 Preliminary Project Proposal — ShiftBridge

Draft text updated 23 October 2026; the earlier rendered PDF must be regenerated before final submission. Copy into the official proposal template and export as `SDC2026_Console_Preliminary.pdf`. The numbered responses follow every field in the supplied template. Text marked **REQUIRED INPUT** must be completed by the participant; this unsigned draft is not a completed submission. Replit and RunPod setup has resumed; initial live inference is verified and final hosted-app proof is pending.

## 1. Team and project overview

| Official field | Response |
| --- | --- |
| Team name | Console |
| Selected domain | Domain 1 — AIVERSECITY, Future-Ready Workforce |
| Selected SDG track (1–17) | 4 — Quality Education |
| Project / solution name | ShiftBridge |
| Name (leader) | Tan King Yang |
| Email and phone (leader) | Supplied separately for the private official PDF; intentionally omitted from public repository documents. |
| University affiliation(s) | UTAR |
| Number of team members | 1 (solo participant) |

## 2. Executive summary and problem statement

### 2.1 The problem context — maximum 250 words

<!-- word-limit: P2.1 250 -->
An experienced manufacturing quality inspector may hear that camera-based inspection is being introduced without knowing which existing skills remain useful or what to learn next. Limited study time makes an unfocused course list a poor answer. Our initial audience is Malaysian electrical and electronics quality inspectors, with training advisers as potential facilitators.

There is evidence for the underlying change. TalentCorp’s electrical and electronics workforce study describes evolving QA and process roles and includes automated monitoring among QA skills [S1]. Intel documents computer vision and AI used for inline inspection [S2]. These sources support investigating changed tasks; they do not establish Malaysian job losses or predict one worker’s future.

ShiftBridge addresses a narrower decision: given a worker’s stated skills, time and budget, which learning action is justified now, and what should change when credible evidence changes? It preserves a route for improving within QA alongside exploratory adjacent roles. This supports access to relevant technical learning under SDG 4.4 and affordable learning under SDG 4.3 [S8].

The specific planning difficulty remains a hypothesis awaiting independent worker or adviser validation. Our prototype uses synthetic profiles and public references. It does not collect real CVs, automate hiring decisions or claim employment, wage or environmental outcomes.
<!-- /word-limit -->

### 2.2 The proposed AI solution — maximum 300 words

<!-- word-limit: P2.2 300 -->
ShiftBridge connects skills, evidence, role comparison and an affordable learning sequence in one inspectable workflow. A synthetic worker records six skill levels, qualification information, weekly time and budget. Three routes are ranked using deterministic weighted coverage; unknown skills produce a range, and qualification checks remain separate from alignment.

The evidence layer can refresh arXiv research metadata and retains source links, dates and content hashes. A reviewer must identify a supporting passage, explain its task implication, select affected roles and propose bounded scenario adjustments. Approval and publication are separate. Unsupported or irrelevant items leave the accepted plan unchanged.

The intended runtime AI component is an embedding model for relevance triage on public source passages. A RunPod adapter exists, but the model has not been deployed or executed live. The present working prototype uses manual evidence review; it does not describe deterministic ranking as model inference. Relevance alone will never prove a workforce implication or publish a rule.

The planner orders learning prerequisites, accounts for known access prices and weekly time, and shows practical outputs. Every role and skill has an SDG explanation. Moderate and faster adoption scenarios expose assumptions rather than promise forecasts. A published change can visibly reorder learning; the worker chooses whether to adopt it. Saved decisions retain the original profile, assessment and evidence version and can be downloaded.

Workshop themes reflected in the architecture include API integration, PostgreSQL persistence and deployment configuration. Actual workshop attendance requires team confirmation. AI-assisted development is disclosed separately from runtime AI. Initial relevance inference has completed; final hosting and wider model evaluation remain active tasks.
<!-- /word-limit -->

## 3. Technical architecture and implementation plan

### 3.1 Conceptual tech stack

| Layer | Actual implementation and intended use |
| --- | --- |
| Interface | React, TypeScript, Vite and Lucide icons; eight responsive application pages plus an isolated guided rehearsal. |
| API | Node.js and Fastify; Zod validation; separate profile, evaluation, adoption, source-refresh, review and publication operations. |
| Planning | Shared TypeScript engine 1.1.0; normalized selected-skill coverage, role-scoped evidence, qualification checks, prerequisite-aware starter planning. |
| Storage | PostgreSQL JSONB workspace records with transactional changes; PGlite for local persistence, `pg` for managed PostgreSQL. This build does not use a multi-table ORM architecture. |
| Updatable source | arXiv Atom API with category RSS fallback. Manual refresh is real; a fetched paper is a candidate, not approved labour evidence. |
| AI integration, initial execution verified | RunPod endpoint and executable worker for `BAAI/bge-large-en-v1.5` relevance triage. Model revision is pinned in the contract; the app accepted a completed Intel-passage result and six declared synthetic cases completed. Wider relevance evaluation remains outstanding. |
| Hosting, verification pending | Replit configuration and an earlier development preview were tested. The current source has no verified public production URL. |
| Verification | Vitest domain/API/connector/client-helper tests, TypeScript checking, production build and recorded browser checks. |

```text
Synthetic profile + study constraints ────────────┐
                                                v
arXiv refresh → dated candidate → human review → published snapshot
                    │                  │                  │
                    └→ AI triage       └→ reject/no change │
                       [DEFERRED]                         v
                          Deterministic role comparison + scenario assumptions
                                                │
                                                v
                          Ordered learning plan → explicit worker adoption
                                                │
                                                v
                          PostgreSQL saved decision → downloadable text brief
```

**Official sponsor API or cloud use:** an earlier Replit development workspace and managed PostgreSQL were exercised; this does not prove current production hosting or sponsor-funded use. RunPod has not been configured. **REQUIRED INPUT — team confirms all sponsor credits, mentoring and resources actually used and provides genuine evidence later.** No exemption from event platform requirements is asserted.

### 3.2 Design-thinking and deployment strategy — maximum 200 words

<!-- word-limit: P3.2 200 -->
We narrowed the design to one decision: a quality inspector choosing a useful next learning action under time and budget constraints. Public occupational and sector evidence informed the initial taxonomy, while synthetic personas made constraints and unknowns visible. These are design hypotheses, not completed worker interviews.

The prototype allows profile edits, scenario comparison, evidence inspection and an explicit decision to adopt a revision. A constructed rehearsal shows both a relevant update and restraint when evidence is weak. Practice outputs and preserved saved decisions make the result usable beyond a score.

Implementation verification covers scoring, unknowns, prerequisites, review/publication separation, historical preservation and database persistence. Browser checks exercise the real API at desktop and mobile widths. A small independent usability study is planned to compare selecting a justified next step with a static catalogue versus ShiftBridge; no measured improvement is claimed.

Before deployment, the team must finish ownership review, validate the problem with intended users, complete the impact baseline, prepare judge-accessible links and verify the final hosted build. Initial RunPod inference is verified; the latest Replit build still needs hosted verification. The team will update declarations and evidence after those actions, rather than present a local demonstration as a deployed AI service.
<!-- /word-limit -->

## 4. Preliminary environmental and SDG impact framework

| Official metric category | Response |
| --- | --- |
| Target SDG sub-target(s) | Primary: **4.4**, relevant technical and vocational skills. Secondary: **4.3**, access to affordable technical and vocational learning. Route and skill explanations show the intended contribution. These are project-level intentions, not measurements of UN population indicators. [S8] |
| Current problem baseline, expressed numerically | **REQUIRED MEASURED INPUT — median ___ seconds for ___ independent participants to choose a source-backed, prerequisite-valid next learning action using the static catalogue. Task version ___; collection date ___; success rate ___/___; assistance rate ___/___; ordering procedure ___.** No such worker/usability baseline is recorded yet. The software was already built before this baseline, so do not falsely describe the measurement as pre-build. If the team uses an estimate instead, label its method and provenance explicitly, as permitted by the template; do not invent a number. |
| Core measurable KPI | Median planning-task time among successfully completed tasks, accompanied by success rate, citation correctness, prerequisite errors and help received. Count failures separately rather than dropping them without disclosure. Track automated source-reference and constraint checks as engineering quality measures. |
| Phase 2 impact target | **Draft target for team confirmation: 30% lower median planning time** relative to the measured static-catalogue condition, with no deterioration in task success or source/prerequisite correctness. Calculate `100 × (baseline median − app median) / baseline median` only when the measured baseline is positive. This is a target, not an achieved result. |

**Evaluation method:** use at least five independent participants if feasible; counterbalance two equivalent synthetic cases and condition order. Use the same success rubric: identify a next step, point to its supporting source, respect prerequisites and constraints, and explain one limitation. Record actual timings and failures in `pilot_results.csv`. Report individual observations and sample size. Small convenience-sample usability results cannot establish employment retention, wage gains or waste reduction. The initial synthetic rehearsal is a software demonstration, not this study.

## 5. Eligibility and readiness checklist

Do not transfer these as checked boxes until the leader confirms the condition.

| Official statement | Current status |
| --- | --- |
| All members completed mandatory GenAI, Database and Cloud Deployment workshops | **REQUIRED HUMAN CONFIRMATION.** Reviewed materials conflict on attendance wording; actual attendance and latest official instruction must be established. |
| Concept addresses a verified real-world problem directly mapped to SDGs | Public evidence supports the task context; the specific user difficulty still needs team validation. Leader confirms the final statement after reviewing [S1–S2]. |
| Solution targets a functional, deployed application | Functional local prototype exists. Stable current public deployment remains unverified. Do not claim completed hosting. |
| Every template field is complete and within limits | Limited responses fit their stated maxima; required identity, baseline, declarations and signatures remain incomplete. |

## 6. IP and originality declaration

### 6.1 Pre-existing / prior-owned work

**REQUIRED HUMAN ANSWER — Yes or No.** Identify any team-owned code, designs, research or other materials created before the hackathon and name their owners. Current local files alone do not establish that no prior-owned work exists. Keep truthful development dates and history.

AI assistance contributed substantially to initial concept development, strategy, design, implementation, tests and documentation. The team must document its own substantive problem understanding and design decisions; merely renaming an AI-generated idea does not establish team ownership of the approach. Review the event’s originality/AI rule before signing.

### 6.2 Third-party code, datasets or models

**Yes.** See the exact direct dependency versions and declared licences in `DEPENDENCIES.md`, the full lockfile inventory in `dependency-licenses.csv`, and section 4 of the Technical Tools Declaration. Application code has an Apache-2.0 LICENSE. Third-party code and source content retain their own rights; the application licence does not relicense reports, abstracts or learning content. Baseline practice datasets are original synthetic exercises generated with disclosed AI assistance. No model training or fine-tuning was performed.

### 6.3 Employment-related IP conflicts

**REQUIRED HUMAN ANSWER — Yes or No.** Each member checks employment, internship and consulting agreements. If applicable, identify the agreement and member and obtain any necessary clearance. No answer is inferred from student status.

## 7. Declaration

**Leader signature: REQUIRED INPUT. Date: REQUIRED INPUT.** The leader signs the official accuracy/originality declaration only after completing the unresolved fields and reviewing the assistance and provenance disclosures. This draft does not sign or certify on the team’s behalf.

## Source appendix

- **[S1]** TalentCorp, *Impact Study of Artificial Intelligence, Digital, and Green Economy on the Malaysian Workforce, Volume 2: Electrical and Electronics*, copyright 2024, printed pp. 67 and 70. [Official report](https://www.talentcorp.com.my/images/uploads/publication/195/Impact-Study-of-Artificial-Intelligence-Digital-and-Green-Economy-on-the-Malaysian-Workforce-Volume-2-Sector-Electrical-and-Electronics-1747879257.pdf). Context, not a particular worker’s forecast.
- **[S2]** Intel, *Computer Vision and AI for Inline Inspection*, December 2023 according to its linked white paper. [Deployment account](https://www.intel.com/content/www/us/en/it-management/intel-it-best-practices/smart-mfg-computer-vision-ai-inspection.html). Date precision is month; it is not a Malaysian employment study.
- **[S3]** O*NET, [51-9061.00](https://www.onetonline.org/link/summary/51-9061.00), updated 2026. US task reference, not Malaysian labour-market statistics.
- **[S4]** O*NET, [17-3027.00](https://www.onetonline.org/link/summary/17-3027.00) and [17-3028.00](https://www.onetonline.org/link/summary/17-3028.00), updated 2026. Exploratory adjacent-role task references, not universal entry rules.
- **[S5]** Microsoft Learn: [Power BI](https://learn.microsoft.com/en-us/training/modules/get-started-with-power-bi/), [machine-learning concepts](https://learn.microsoft.com/en-us/training/modules/fundamentals-machine-learning/) and [computer-vision concepts](https://learn.microsoft.com/en-us/training/modules/introduction-computer-vision/). Provider durations are not established; certificates are not included.
- **[S6]** ASQ: [Check Sheet](https://asq.org/quality-resources/check-sheet) and [Root Cause Analysis](https://asq.org/quality-resources/root-cause-analysis); NIST: [Calibration](https://www.itl.nist.gov/div898/handbook/mpc/section3/mpc3.htm). Public references, not certified four-hour courses.
- **[S7]** [arXiv API](https://export.arxiv.org/api/query) and [cs.CV RSS](https://rss.arxiv.org/rss/cs.CV); [PatchCore research example](https://arxiv.org/abs/2106.08265), first submitted 2021-06-15, revised 2022-05-05. Research alone does not prove adoption or altered job duties.
- **[S8]** United Nations, [Goal 4 and its targets](https://sdgs.un.org/goals/goal4). The app’s planning measures are project proxies, not official SDG indicator measurements.

Catalogue source review date: 21 October 2026; see `../SOURCE_RESEARCH.md` for locators and limitations. Recheck source access before final recording.
