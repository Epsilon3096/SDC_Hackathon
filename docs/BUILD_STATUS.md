# Build verification — 21 October 2026

ShiftBridge is a working Domain 1 prototype. It is not a claim of competition acceptance, qualification eligibility, or prize likelihood. Codex assisted development and review; the participant team owns the entry and final decisions.

## Verified locally

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

Replit setup and publishing are currently on hold at the participant's request. Development continues locally; the latest correctness, rehearsal and decision-brief changes have not been uploaded. The following records earlier verification, not verification of the latest source on Replit.

- Source imported into https://replit.com/@kingyang3096/ShiftBridge.
- Node 22.22.0 runs the production build and Fastify on port 3001 with managed PostgreSQL. The HTTPS startup configuration includes Replit development environments.
- A synthetic worker plan was saved through the standalone HTTPS preview and its first step completed. After the server restarted, the saved plan still showed 1 of 4 steps complete (25%).
- The account's Publish panel says a subscription is required. No public production deployment exists. The development preview depends on the workspace runtime and is not a stable submission link.
- The provided voucher was rejected as expired; no paid subscription or RunPod setup was performed.

## Remaining boundaries

- Mobile browser verification covers one 390px viewport, not a physical device or a complete assistive-technology audit.
- The final source must later be uploaded and reverified in Replit. The earlier hosted test run had one platform-specific temporary-directory failure; the local fix now passes, but it has not been rerun remotely. A published deployment needs separate verification. See DEPLOYMENT.md.
- RunPod remains unconfigured at the participant's request. The adapter has mocked transport tests, but no deployed worker or live GPU proof.
- Personas and practice datasets are synthetic. Role requirements and weights are transparent prototype assumptions, not universal hiring standards. Adjacent-role qualification requirements remain unverified.
- New Intel mappings are QA-scoped. Older mappings without stored scope preserve their historical all-route behaviour and display a legacy label; correcting an old published scope requires retirement and replacement, not silent rewriting.
- Four-hour learning blocks are team planning estimates. No measured time-saving or employment outcome is claimed; the evaluation protocol is prepared for real participants.
- Submission documents and the editable deck are prepared as drafts; final human declarations/signatures, numeric impact baseline, public repository, actual recording, judge-access links and sponsor-compliance verification remain outstanding. The absence of live runtime inference is a material competitive/requirement gap, not resolved by AI-assisted coding.
- Commercial use with real worker data is not ready. Server-side session expiry/revocation, accounts and named reviewers, organisation access, retention/deletion/recovery, tested backups, monitoring and independent occupational/user validation are release gates in OPERATIONS.md.

## Reproduce

Run `npm ci`, `npm run verify`, and `npm audit --omit=dev`. For local development run `npm run dev`. Hosted startup requires a PostgreSQL DATABASE_URL. No credentials, private submission contact details or runtime data are distributed in the source ZIP.
