# Build verification — 21 October 2026

ShiftBridge is a working Domain 1 prototype. It is not a claim of competition acceptance, qualification eligibility, or prize likelihood. Codex assisted development and review; the participant team owns the entry and final decisions.

## Verified locally

- TypeScript checking and the production Vite build pass.
- All 90 automated tests pass, covering deterministic assessments, unknown qualifications, prerequisites, evidence review/publication, source validation, workspace isolation, optimistic concurrency, saved plan adoption and database reopen persistence.
- Production dependency audit reports zero known vulnerabilities at the time of this check.
- Browser checks cover all eight pages at a 1280px viewport without horizontal overflow. Profile edits, plan progress, evidence approval, separate publication, rejection and explicit plan adoption were exercised against the real API.
- Approving the supported Intel mapping does not publish it. Publishing changes the active assessment and learning priority while preserving the accepted plan until adoption. Adoption retains completed steps with valid prerequisites.
- Live arXiv retrieval returned real source records. Metadata ingestion does not establish a workforce implication or approve a mapping.

## Boundaries

- Responsive styles exist; a mobile viewport has not yet been browser-tested.
- A working Replit preview and a published deployment must each be verified independently. See DEPLOYMENT.md for the configuration.
- RunPod remains unconfigured at the participant's request. The adapter has mocked transport tests, but no deployed worker or live GPU proof.
- Personas and practice datasets are synthetic. Role requirements and weights are transparent prototype assumptions, not universal hiring standards. Adjacent-role qualification requirements remain unverified.
- Four-hour learning blocks are team planning estimates. No measured time-saving or employment outcome is claimed; the evaluation protocol is prepared for real participants.
- The supplied Replit voucher was rejected as expired. No subscription was purchased.
- Submission documents, public repository, final recording and sponsor-compliance verification remain separate readiness tasks.

## Reproduce

Run `npm ci`, `npm test`, `npm run build`, and `npm audit --omit=dev`. For local development run `npm run dev`. Hosted startup requires a PostgreSQL DATABASE_URL. No credentials or runtime data are distributed in the source ZIP.
