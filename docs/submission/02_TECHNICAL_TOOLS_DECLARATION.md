# SDC 2026 Technical Tools Declaration — ShiftBridge

Draft text updated 23 October 2026; the earlier rendered PDF must be regenerated before final submission. Copy into the official declaration and export as `SDC2026_Console_TechDeclaration.pdf`. This draft follows all eight sections. “Not used”, “None” and “Pending verification” are deliberate status statements, not blank fields. **REQUIRED INPUT** means the participant must supply or confirm information before signing. No secrets belong in this document.

## 1. Team and project overview

| Official field | Response |
| --- | --- |
| Team name | Console |
| Project / solution name | ShiftBridge |
| Leader name | Tan King Yang |
| Leader email and phone | Supplied separately for the private official PDF; intentionally omitted here. |
| University affiliation(s) | UTAR |
| Live prototype URL | [ShiftBridge live prototype](https://shift-bridge-kingyang3096.replit.app). Public HTTPS access passed 24 independent checks on 23 October 2026; patched v3 GPU verification remains separate and pending. |
| Code repository URL, public or judge access | [Epsilon3096/SDC_Hackathon](https://github.com/Epsilon3096/SDC_Hackathon). Public anonymous access verified; original history preserved through `f056cef`. Maintain access throughout judging. |

## 2. Architecture and technology stack

### 2.1 System architecture overview — maximum 200 words

<!-- word-limit: T2.1 200 -->
The React/TypeScript interface calls a Fastify API. Synthetic worker profiles, public source records, review decisions, immutable evidence snapshots and adopted plans persist as isolated PostgreSQL JSONB workspaces. Local development uses embedded PostgreSQL through PGlite; managed PostgreSQL uses the pg driver.

The arXiv connector fetches and validates Atom metadata, with an RSS fallback. Source content is untrusted. A reviewer selects an exact passage, records an interpretation and role scope, then approves it. A separate publication operation produces a new snapshot. Deterministic TypeScript code calculates skill alignment, qualification status and prerequisite-aware learning priorities. The worker explicitly adopts a plan; its original assessment, profile and constraints are captured for later export.

An isolated rehearsal uses the same API operations with synthetic data and generation guards. It does not execute paid inference. RunPod performs bounded public-passage relevance triage. The app accepted one live Intel-passage result; six declared synthetic cases also completed. Similarity never publishes evidence or ranks workers. Replit `f056cef` passed tests/build/smoke and the published app passed 24 HTTPS checks. Patched v3 GPU execution remains unverified. Validation includes automated tests and browser exercises, while human usability and workforce validation remain outstanding.
<!-- /word-limit -->

A system block diagram appears in proposal section 3.1.

### 2.2 Languages, frameworks and libraries

Use the table in `DEPENDENCIES.md` as the section’s continuation sheet. It lists every direct runtime and development package’s **resolved package-lock version**, stated purpose and package-declared licence. `dependency-licenses.csv` lists all 260 lockfile package entries at preparation time, including transitive/platform entries. The inventory records metadata; it is not a completed legal clearance or a claim every optional platform binary was executed.

Other runtime/platform components: JavaScript/TypeScript, HTML/CSS, Node.js 24.14.0 locally, Node.js 22.22.0 in the earlier Replit check, npm, PostgreSQL and PGlite. The PostgreSQL server and npm versions used by a final host must be recorded when deployed. No ORM or custom model training framework is claimed in the running application.

## 3. APIs and cloud services

### 3.1 External APIs

| API and provider | Purpose | Access tier and actual status |
| --- | --- | --- |
| arXiv Atom API — export.arxiv.org | Refresh industrial-inspection research candidates, actual publication/revision metadata and source links. | Public endpoint, no app API key. Live retrieval has been exercised. Rate limits/network failures are handled; no availability guarantee. |
| arXiv cs.CV RSS — rss.arxiv.org | Fallback candidate ingestion with honest announcement/date metadata. | Public feed, no app API key. Code path and validation tested; announce date is not invented publication date. |
| RunPod serverless API | Embedding relevance job submission/status polling, with durable reservations and matching provenance. | **Live execution verified.** One app-accepted Intel-passage result and six synthetic cases completed. Endpoint-restricted GET/POST key configured privately; billed usage remains to be checked. |

No payment, recruitment, email, mapping or messaging APIs are called by the application. External learning/source links open the publisher’s website. Development-time Codex browsing and research are disclosed separately below; they are not end-user runtime APIs.

### 3.2 Cloud platforms and deployment

| Service/provider | Purpose | Plan/region and actual status |
| --- | --- | --- |
| Replit development workspace and managed PostgreSQL | Earlier source import, HTTPS standalone preview, database persistence check. | Commit `f056cef`: 257 tests (three skipped), build and smoke passed. Published app: 24 HTTPS checks passed. Security scan: zero active/zero dismissed findings. Core/US$20 credit confirmed; auto-reload off. Autoscale: 1 CPU, 1 GiB, max 1 instance, Asia, fresh production database. |
| RunPod | Bounded GPU relevance service. | Endpoint `0qcgjcclf6fln9`, container built from private source; first real passage and six synthetic jobs completed. One 16 GB GPU family; quoted runtime US$0.58/hour; max 1/active 0 workers; idle 5s; execution 120s. Region and actual completed-job usage remain to be recorded. |
| GitHub | Public application source and CI; separate private GPU build input. | Public [Epsilon3096/SDC_Hackathon](https://github.com/Epsilon3096/SDC_Hackathon), anonymous access verified with original history preserved through `f056cef`. All seven [CI jobs](https://github.com/Epsilon3096/SDC_Hackathon/actions/runs/39942612991) passed; per-job counts were not extracted from these logs. Private `Epsilon3096/shiftbridge-inference` remains repository-only build input. |
| Local Windows + PGlite | Current development, tests and persisted demo. | Local execution; not cloud hosting. |

## 4. AI tools, models and datasets

### 4.1 AI models used in the solution

**One live public-passage result was accepted by the application; six synthetic triage cases also completed.** Matching and planning are deterministic; evidence mapping is reviewed manually.

| Model/version | Source/provider | Usage | Licence/terms and status |
| --- | --- | --- | --- |
| `BAAI/bge-large-en-v1.5` — build revision `d4aa6901d3a41ba39fb536a557fa166f842b0e09` | BAAI, configured for RunPod | Pretrained embedding relevance triage only; one live passage plus six synthetic cases completed; app accepted the real-passage result. No training/fine-tuning. | **Executed revision pinned; genuine job provenance recorded in `../RUNPOD_VERIFICATION.md`.** Final model-card/licence review remains required; these cases do not establish accuracy. |

The model row records initial executed use under preprocessing contract v2. The published source passed the Replit security scan with zero active/zero dismissed findings. Patched v3 worker `383eabc` is rebuilding after dependency/build failures and requires genuine CUDA proof. The original seven jobs do not verify the new runtime. Retain genuine job evidence and complete the final licence review; no threshold calibration or general model accuracy is established. The Python worker uses PyTorch, Transformers, huggingface-hub, safetensors and the RunPod SDK; pinned direct versions are in `runpod/requirements.txt` and `runpod/Dockerfile`. These worker dependencies are separate from the npm inventory; transitive Python hashes are not yet frozen.

### 4.2 Datasets

| Dataset / material | Source | Type | Personal data? | Licence / permitted use recorded here |
| --- | --- | --- | --- | --- |
| Aina and Farid profiles; edited rehearsal; practice CSVs/worksheets | `src/shared/catalogue.ts`, `public/practice/`, team project | Synthetic, AI-assisted creation | No real worker data | Original project material under the project’s Apache-2.0 licence; team verifies ownership declaration. These are not measured factory records. |
| Role/skill/source catalogue | TalentCorp E&E report; O*NET inspection/process/calibration references; Intel deployment account; NIST calibration | Public reference material; team-authored modelling assumptions | No worker records; bibliography may contain public author names | Source publishers retain rights. Short excerpts and links are attributed. Do not redistribute complete copyrighted reports or assume the application licence covers them. Source-specific terms require final team review. |
| Learning-resource catalogue | Microsoft Learn, ASQ and NIST links listed in proposal [S5–S6] | Public references + original practice briefs | No learner account data imported | External learning materials remain under publisher terms. Reading access is separate from reuse, credentials and paid tools. |
| arXiv abstracts/metadata and PatchCore research example | arXiv API/RSS; source record URLs | Public research metadata/text, not training data | No worker profiles sent; publication text may contain public author names | Individual paper/content terms may differ. API access does not grant blanket relicensing of all abstracts or papers. Preserve attribution and avoid bundling complete papers. |
| Automated test fixtures | `tests/` | Synthetic | No | Project licence; mocked network outputs are test data, not live model or user evidence. |

No dataset was used to train or fine-tune a model. No private employer records, real CVs or genuine employee profiles were supplied to the running app. The team must maintain that boundary during recording and evaluation.

### 4.3 AI-assisted development tools

**Yes.**

| Tool/version | Used for | Extent |
| --- | --- | --- |
| OpenAI Codex; **REQUIRED INPUT — copy exact session model/version from the app/session record** | Research assistance, initial concept/strategy, UI design, implementation, tests, critique, documentation, this draft and coordinated agent review. | **Major.** Do not describe this as minor autocomplete or only grammar checking. |
| Google Gemini interface using the Argon picker; **REQUIRED INPUT — underlying model/version unverified** | Ideas-only reviews on 21 and 23 October. Accepted suggestions clarified reviewer/worker perspectives, foregrounded synthetic practice and connected feedback voluntarily to the plan. The follow-up also prompted a clearer negation/vocabulary warning. Unsupported compliance, scale, time-saving, expert-calibration and employment claims were rejected. | **Minor relative to the overall build; participant confirms actual extent.** Do not treat the picker label as a verified model identity. |
| Other team-used AI tools | **REQUIRED INPUT — add every additional tool or write None after checking with all members.** | Confirm truthfully. |

#### Review, testing and responsibility — maximum 100 words

<!-- word-limit: T4.3 100 -->
AI assistance contributed substantially to concept development, code, tests and documentation. Automated checks cover scoring, prerequisites, review/publication boundaries, persistence and historical decisions; browser rehearsals exercise real API interactions. Public-source dates, qualifications and claimed learning costs were checked and unsupported claims removed. These checks do not establish that every team member understands the implementation. Before signing, the participant team must review the generated work, reproduce the demonstration, explain the modelling choices and limitations, confirm provenance, and accept responsibility for the submitted entry. Human ownership review and signatures remain pending.
<!-- /word-limit -->

## 5. Sponsor-provided resources

**REQUIRED HUMAN ANSWER — Yes or No after checking actual credits, platform access, mentoring and data use.** The participant reported US$20 Replit and US$25 RunPod credits and authorised their use; RunPod setup is in progress. Confirm the source of those credits and any mentoring separately. Earlier Replit development and current endpoint preparation must be declared truthfully; a rejected earlier voucher does not determine funding provenance. Initial live GPU jobs completed; a later account check showed US$24.99 remaining and US$0/hour, with AutoPay disabled. This is not a per-job cost calculation.

| Sponsor | Resource | How actually used |
| --- | --- | --- |
| Replit — sponsor funding status unconfirmed | Development platform / managed PostgreSQL | Published prototype, managed PostgreSQL and 24 independent HTTPS checks; current source and Replit verification are recorded above. |
| RunPod — credit provenance requires confirmation | Existing US$25 credit and serverless build setup | Private worker repository connected; endpoint container built; one real-passage and six synthetic jobs completed. Account observation: US$24.99 remaining, US$0/hour and AutoPay disabled; no per-job cost claim. |
| Other sponsor/mentor | **REQUIRED INPUT or None** | State actual resources and contribution without exposing codes, keys or contact details unnecessarily. |

#### Essential or replaceable — maximum 100 words

<!-- word-limit: T5 100 -->
Replit hosts the public application and managed PostgreSQL. Local execution remains possible. RunPod supplies bounded relevance triage and is separate from deterministic matching and manual review. Seven original v2 jobs completed; patched v3 execution remains pending. Failures preserve published recommendations and display their real status. Technical replaceability does not imply exemption from sponsor-use rules. Public HTTPS checks and historical GPU records establish specific platform use; final sponsor-rule review and participant declarations remain required.
<!-- /word-limit -->

## 6. Security, privacy and responsible use

### 6.1 Data handling and privacy — maximum 150 words

<!-- word-limit: T6.1 150 -->
The prototype stores editable synthetic names, qualifications, experience, skill levels, study constraints, saved plans, review notes and audit records. A random browser-session cookie identifies an isolated workspace; no real CV upload or account registration is provided. Real personal profiles must not be entered for this competition.

The session cookie is HttpOnly and SameSite=Strict, with Secure enabled in hosted HTTPS mode. API validation, origin checks, rate limits and transactional writes protect state changes. Workspace data persists in PostgreSQL; the cookie expires after fourteen days, but database cleanup is not automated. A retention/deletion policy is therefore still required before a real pilot.

arXiv requests contain a fixed research query, not worker profiles. The configured RunPod adapter sends a bounded public-source passage and relevance query, not worker data. Publisher links may involve those sites’ own privacy practices. No production security certification or independent audit is claimed.
<!-- /word-limit -->

### 6.2 Known limitations and risks — maximum 150 words

<!-- word-limit: T6.2 150 -->
The six-skill model is incomplete, self-reported and not validated as occupational readiness. Requirements, weights and adoption scenarios are assumptions. Unknown proficiency remains unknown; adjacent-route entry requirements are not invented. No employment probability is produced.

Research relevance does not prove deployment or changed duties. Exact passages, recorded human interpretation, role scope and separate publication constrain evidence changes. Rejection preserves accepted plans; corrections create new snapshots. Older unscoped rules are explicitly labelled rather than silently rewritten.

Seven v2 GPU jobs completed; patched v3 execution remains pending. Accuracy and calibration remain unmeasured. Timings are single-run observations. The live feed may fail or return insufficient evidence; previous reviewed state remains readable. Learning times are team estimates; credentials and optional tools are outside the displayed learning cost. Completion records activity rather than competence. Automated tests and developer rehearsals do not substitute for independent worker validation, usability measurement or a complete security/accessibility audit.
<!-- /word-limit -->

## 7. Compliance and readiness checklist

| Official statement | Present status; leader decides whether to tick |
| --- | --- |
| All resources are declared | App/runtime and known assistant use drafted; every member must check for additional tools/resources. |
| Third-party licences followed and attribution provided | Package metadata inventoried and sources linked; final notices, publisher terms and redistribution review still required. |
| No credentials exposed | No credentials are included in these drafts. Final source/repository/recording needs a secret scan and visual check. |
| AI development use disclosed and reviewed by team | Major use disclosed; human review/ownership confirmation pending. |
| Sponsor use declared | Earlier platform use described; credit provenance/mentoring confirmation and completed platform proof pending. |
| Prototype accessible through provided links | Public source and prototype access are verified. Patched v3 GPU verification and the final video link remain outstanding. |
| All fields complete within limits | Limited responses fit; required participant/external inputs and signatures remain. |

## 8. Declaration

**Leader signature: REQUIRED INPUT. Date: REQUIRED INPUT.** Sign the official complete-and-accurate resource declaration only after all member inputs and access checks are complete. Codex is an assistant, not the competition host, entrant or signatory.
