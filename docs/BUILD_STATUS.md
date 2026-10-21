# Build verification — 21 October 2026

ShiftBridge is a working Domain 1 prototype. It is not a claim of competition acceptance, qualification eligibility, or prize likelihood. Codex assisted development and review; the participant team owns the entry and final decisions.

## Verified locally

- TypeScript checking and the production Vite build pass.
- All 119 automated tests pass, covering deterministic assessments and score intervals, unknown qualifications, prerequisites, evidence review/publication/retirement, source deduplication, workspace isolation, optimistic concurrency, saved plan adoption and database reopen persistence. Client helper tests reject mismatched evaluations and oversized default excerpts.
- Production dependency audit reports zero known vulnerabilities at the time of this check.
- Browser checks cover all eight pages at a 1280px viewport without horizontal overflow. Profile edits, plan progress, evidence approval, separate publication, rejection and explicit plan adoption were exercised against the real API.
- Approving the supported Intel mapping does not publish it. Publishing changes the active assessment and learning priority while preserving the accepted plan until adoption. Adoption retains completed steps with valid prerequisites.
- Live arXiv retrieval returned real source records. Metadata ingestion does not establish a workforce implication or approve a mapping.
- All eight pages were checked at a 390px mobile viewport with no horizontal overflow. Closed navigation is absent from the accessibility tree; opening focuses its first link, and Escape closes it and restores focus to the menu button.
- Saved schedule continuity was browser-tested: a plan adopted at 8h/week retained its 2-week schedule and 25% completion after the profile changed to 4h/week. Older plans without captured constraints explicitly label the original pace as unrecorded.
- A documented retirement was published through the local UI. The comparison from v2 to v3 shows the removed interpretation and reason; history retains v1 and v2. API regressions separately verify weaker-rule replacement and independent scenario progress.
- A floating-point boundary fix prevents complete profiles from displaying an inverted score interval. Three regression tests cover identical known bounds and containment of unknown-profile endpoints.

## Replit development verification

Replit setup and publishing are currently on hold at the participant's request. Development continues locally; the latest correctness and retirement changes have not been uploaded. The following records earlier verification, not verification of the latest source on Replit.

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
- Four-hour learning blocks are team planning estimates. No measured time-saving or employment outcome is claimed; the evaluation protocol is prepared for real participants.
- Submission documents, public repository, final recording and sponsor-compliance verification remain separate readiness tasks.

## Reproduce

Run `npm ci`, `npm test`, `npm run build`, and `npm audit --omit=dev`. For local development run `npm run dev`. Hosted startup requires a PostgreSQL DATABASE_URL. No credentials or runtime data are distributed in the source ZIP.
