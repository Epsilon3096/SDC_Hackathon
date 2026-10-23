# Build verification — 23 October 2026

ShiftBridge is a working Domain 1 prototype. It is not a claim of competition acceptance, qualification eligibility, or prize likelihood. Codex assisted development and review; the participant team owns the entry and final decisions.

## Latest completed local checkpoint — 23 October

ShiftBridge remains a React/TypeScript/Fastify/PostgreSQL application; the original HTML file was a design preview. After adding source triage, the in-app practice exercise and bounded inference handling, `npm run verify` passed **257 application tests**, with **three optional real-PostgreSQL transaction tests skipped**. TypeScript checking, the Vite production build and the built-application smoke test passed. The previous 22 October `npm audit --omit=dev` check reported zero known production dependency vulnerabilities. Further code edits need a new check before packaging or deployment is described as verified.

The Python command `python -m unittest discover -s runpod -p "test_*.py" -v` passed **11 offline worker contract/evaluation tests**. These checks do not establish a container build, real inference or model accuracy.

Implemented in the release candidate:

- Evidence Studio separates **Sources & triage, Review, Publish and History**. A public source can receive a relevance check before a skill mapping is proposed. Recorded cosine similarity can help order reading; it cannot approve an interpretation, publish a snapshot or replace an accepted plan.
- Source inference displays unconfigured, submitting, pending, unknown, completed and failed states. Empty/too-short passages and synthetic rehearsal requests cannot spend GPU credit. Paid operations require a team reviewer session.
- The API commits a durable reservation before submitting a paid job. Concurrent requests reuse it. An uncertain network outcome blocks automatic resubmission; reconciliation accepts a known completed job only when provenance matches. The ledger rejects new records at capacity instead of discarding uncertain jobs, and a late pending response cannot overwrite a completed result.
- The executable worker requires a pinned model revision, bounded text, exact source/text hashes, declared preprocessing, the fixed query and a CUDA result. Model files are prepared at container build time; runtime downloads and CPU fallback are disabled. Role ranking and qualification logic remain deterministic.
- The QA learning page now contains an in-app exercise using the authored 20-case synthetic CSV. Its temporary answers and deterministic feedback do not change proficiency, saved learning progress, qualifications or review decisions.
- A Python worker-contract job is included in the prepared GitHub workflow. Remote CI has not been run.

The QA exercise was completed in the local browser: TP 6, TN 9, FP 3, FN 2; missed cases Q19/Q20; missing measurement Q07. All six feedback checks matched the reference. The accepted plan remained at one of four completed steps. At 390px the exercise displayed responsive case cards without horizontal overflow. This is browser emulation, not a physical-device or full accessibility audit.

Three fresh Gemini critique attempts failed with service errors, including a fresh chat. No new critique or endorsement was obtained. The earlier 21 October ideas-only review and later implementation decisions are distinguished in `GEMINI_REVIEW.md`.

## Earlier local checkpoint — 21 October

The following observations describe the previous release. They remain historical evidence, not verification of a new hosted release.

- TypeScript checking and the production Vite build pass.
- All 188 locally executed tests pass across 13 files. Three additional real-PostgreSQL transaction tests are explicitly skipped because no disposable PostgreSQL service is configured locally. Coverage includes deterministic assessments and score intervals, role-scoped mappings, unknown qualifications, prerequisites, evidence review/publication/retirement, source and proposal deduplication, workspace isolation, optimistic concurrency, saved decision capture/export, rehearsal generation guards and database reopen persistence. Client helper tests cover matching evaluation context, saved next actions, plan-order differences, genuine rehearsal milestones and committed-write/read-back failure handling.
- Production dependency audit reports zero known vulnerabilities at the time of this check.
- Browser checks cover all eight pages at a 1280px viewport without horizontal overflow. Profile edits, plan progress, evidence approval, separate publication, rejection and explicit plan adoption were exercised against the real API.
- Approving the supported Intel mapping does not publish it. Publishing changes the active assessment and learning priority while preserving the accepted plan until adoption. Adoption retains completed steps with valid prerequisites.
- Live arXiv retrieval returned real source records. Metadata ingestion does not establish a workforce implication or approve a mapping.
- All eight pages were checked at a 390px mobile viewport with no horizontal overflow. Closed navigation is absent from the accessibility tree; opening focuses its first link, and Escape closes it and restores focus to the menu button.
- Saved schedule continuity was browser-tested: a plan adopted at 8h/week retained its 2-week schedule and 25% completion after the profile changed to 4h/week. Older plans without captured constraints explicitly label the original pace as unrecorded.
- A documented retirement was published through the local UI. The comparison from v2 to v3 shows the removed interpretation and reason; history retains v1 and v2. API regressions separately verify weaker-rule replacement and independent scenario progress.
- A floating-point boundary fix prevents complete profiles from displaying an inverted score interval. Three regression tests cover identical known bounds and containment of unknown-profile endpoints.
- The complete guided rehearsal was exercised through the browser: baseline saved, Intel passage inspected/approved, QA-scoped snapshot published, both weak mappings rejected, old/new step positions inspected, and current revision explicitly adopted. All five milestones were recorded by real application state. The constructed Farid case moved AI inspection learning from step 3 to step 1; the saved decision brief recorded alignment 51.02/100 under moderate adoption, not a measured outcome.
- The brief was downloaded through the app and inspected. It contains original profile v1, engine 1.1.0, the adopted snapshot, 4h/week and RM 0 constraints, role scope, reading prerequisites and the recorded review reason. Legacy plans retain an explicit missing-original-assessment notice.
- Restarting the rehearsal reset only its synthetic data to 0/5 milestones. Exiting returned to the regular workspace with Aina's earlier 1/4 completion, profile-v5 plan and original 8h/week schedule intact. API tests also cover stale-tab writes, concurrent restarts, visitor isolation and delayed import commits. GPU requests are blocked in rehearsal.
- Evidence Studio now separates Review, Publish and History. A draft research review note remained intact while a different mapping was rejected; approval opened the Publish stage without selecting or publishing a rule automatically.
- Updated mobile checks cover all eight pages at 390px, plus the guide and rendered plan comparison, with no horizontal overflow. Main explanatory text and guide text measured 14px; metadata and controls were enlarged. Keyboard navigation and separate pointer navigation were exercised.
- The release pass preserves all fifty saved plans instead of silently dropping the oldest on a new adoption. Malformed/repeated XML fields and conflicting RSS versions are rejected, and rejected response streams are cancelled. Regression tests cover each boundary.
- Browser checks on the release pass confirmed that short review notes cannot approve a mapping, valid notes enable review, source dialogs focus their title and return focus to Inspect on Escape, route changes focus the page heading, and prerequisite progress unlocks in order. Unchecking the first completed prerequisite showed the dependent-reset explanation, returned progress from 2/4 to 0/4, and disabled the dependent step again.
- The guide now labels Worker and Reviewer perspectives as demonstration labels. Its release layout has no horizontal overflow at 1280px and 390px viewports. The draft review note and saved rehearsal plan were created only in the isolated synthetic workspace.
- `npm run verify` passed, including production-bundle delivery, practice CSV, API JSON error, secure cookie, no-store response, captured plan persistence, visitor isolation and cross-origin rejection smoke checks. Production dependency audit again reported zero known vulnerabilities.
- GitHub verification workflows are prepared for Node 22/24 on Windows/Linux and a separate PostgreSQL service. They have not run remotely. Eight local configuration checks prevent the optional PostgreSQL test URL from selecting another database, overriding the loopback host or loading TLS files.
- Gemini was consulted for ideas and strategy only. Reviewer/worker context was accepted; unsupported audit certification, scale, time-saving, expert-calibration and employment claims were rejected. The no-runtime-AI weakness remains explicit.
- Console submission draft responses, a proof matrix, recording copy and dependency inventory are prepared. All eight limited answers pass their word limits. Two private unsigned PDF drafts were rendered and visually checked; public repository documents omit email and phone. An editable eight-slide PowerPoint draft was exported, re-imported and visually checked on every slide; its two native tables and actual app screenshots are preserved. No native PowerPoint compatibility test, submission, signature, video upload or public-repository publication is claimed.

## Replit development verification

The participant has resumed setup using existing **US$20 Replit and US$25 RunPod credits**. The earlier platform deferral no longer applies. No new subscription, top-up or spending above those balances is authorised. Credits do not themselves prove a deployment or enforce a provider spending cap. The following records earlier Replit verification, not verification of the latest local source.

- Source imported into https://replit.com/@kingyang3096/ShiftBridge.
- Node 22.22.0 runs the production build and Fastify on port 3001 with managed PostgreSQL. The HTTPS startup configuration includes Replit development environments.
- A synthetic worker plan was saved through the standalone HTTPS preview and its first step completed. After the server restarted, the saved plan still showed 1 of 4 steps complete (25%).
- Publishing controls have since become available, but no new public production deployment or final judge-accessible URL has been verified. The development preview depends on the workspace runtime and is not a stable submission link.
- The earlier subscription/voucher failure is historical. It is not a current blocker established by this record. The latest local improvements still need upload, hosted tests and final deployment verification.

## RunPod — initial live execution verified

Executable worker source was uploaded to the private [Epsilon3096/shiftbridge-inference](https://github.com/Epsilon3096/shiftbridge-inference) repository at commit `5ddfef5b7f553d6e1d1b9618fcaf9f6e4f007598`. The participant approved repository-only access and an endpoint-restricted GET/POST key. Endpoint `0qcgjcclf6fln9` built successfully and reached Ready; credentials remain private in the ignored local environment and Replit Secrets.

The app accepted the completed Intel-passage GPU result with model/revision/preprocessing/source/text provenance. Provider delay was 61,368 ms, execution 3,314 ms, and cosine similarity 0.6027023196220398. Six declared synthetic triage cases then completed on CUDA; both direct inspection cases scored above both unrelated cases (4/4 pair comparisons). This is a tiny constructed smoke result, not accuracy, calibration, a production latency benchmark or employment evidence. No 0.65 threshold is applied.

See [RUNPOD_VERIFICATION.md](RUNPOD_VERIFICATION.md) and the retained provider JSON under `docs/evidence/` for exact jobs/results. Actual usage inspection, final Replit upload/deployment, judge access and broader model evaluation remain outstanding. The private worker repository is not the full application's public submission link.

## Remaining boundaries

- Mobile browser verification covers one 390px viewport, not a physical device or a complete assistive-technology audit.
- The final source must later be uploaded and reverified in Replit. The earlier hosted test run had one platform-specific temporary-directory failure; the local fix now passes, but it has not been rerun remotely. A published deployment needs separate verification. See DEPLOYMENT.md.
- Initial RunPod execution is verified as described above. The existing-credit budget remains in force; inspect actual usage and retain zero active/max one worker settings. Local contract tests and the tiny live smoke set do not prove general model quality.
- Personas and practice datasets are synthetic. Role requirements and weights are transparent prototype assumptions, not universal hiring standards. Adjacent-role qualification requirements remain unverified.
- New Intel mappings are QA-scoped. Older mappings without stored scope preserve their historical all-route behaviour and display a legacy label; correcting an old published scope requires retirement and replacement, not silent rewriting.
- Four-hour learning blocks are team planning estimates. No measured time-saving or employment outcome is claimed; the evaluation protocol is prepared for real participants.
- Submission documents and the editable deck are dated drafts that predate these improvements. Final human declarations/signatures, workshop confirmation, numeric impact baseline, full source repository access, actual recording, judge-access links and sponsor-compliance verification remain outstanding. No online submission has occurred. Initial runtime relevance inference is now evidenced separately from AI-assisted coding; final sponsor-compliance review is still required.
- Public submission Markdown was reconciled to the 23 October checkpoint and its eight bounded responses rechecked. Existing rendered private PDFs and deck remain the earlier drafts; regenerate them after final platform verification. Private email and phone belong only in the private official forms, not the public source package. The confirmed team is Console, a solo entry by Tan King Yang at UTAR; an ellipsis does not confirm workshop completion or declarations.
- Reviewed materials conflict about the time on 25 October 2026. The conservative internal completion target remains 24 October until the current official cutoff is confirmed. This record does not re-verify organiser announcements or resolve sponsor/workshop conditionality.
- Commercial use with real worker data is not ready. Server-side session expiry/revocation, accounts and named reviewers, organisation access, retention/deletion/recovery, tested backups, monitoring and independent occupational/user validation are release gates in OPERATIONS.md.

## Reproduce

Run `npm ci`, `npm run verify`, `npm audit --omit=dev`, and the Python worker test command above. For local development run `npm run dev`. Hosted startup requires a PostgreSQL DATABASE_URL; do not point optional transaction tests at the application database.

Use `python scripts/package-release.py --scan-only` while preparing source. After committing the verified release, use `python scripts/package-release.py --output ../ShiftBridge_Replit_Source_23Oct.zip` with an unused output name. The script puts source files at the ZIP root, excludes runtime data, dependency directories, credentials and private binary submission documents, verifies archive contents, and writes a SHA-256 manifest. It does not run application tests or claim deployment; its heuristic scan is not a guarantee that arbitrary files contain no secrets.

No final 23 October release ZIP has yet been created at this checkpoint. Earlier ZIPs, PDFs and decks remain dated draft artifacts and must not be labelled as this release.
