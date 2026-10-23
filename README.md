# ShiftBridge

A workforce learning planner for Malaysian manufacturing quality inspectors, built for SDC Domain 1. Review dated evidence, compare explainable skill gaps and choose a practical learning plan.

The HTML produced during ideation is a separate design reference. This directory is the actual application.

[Public source repository](https://github.com/Epsilon3096/SDC_Hackathon) · [Verified CI run](https://github.com/Epsilon3096/SDC_Hackathon/actions/runs/39939758010)

[![Verify ShiftBridge](https://github.com/Epsilon3096/SDC_Hackathon/actions/workflows/verify.yml/badge.svg)](https://github.com/Epsilon3096/SDC_Hackathon/actions/workflows/verify.yml)

Anonymous repository access and all six CI jobs passed at commit `71489cc`, with eight commits preserved. Public app publishing awaits dependency-security remediation and rescanning; no live demo URL is claimed yet.

## Three-minute judge orientation

Run `npm ci`, then `npm run dev`, and open `http://127.0.0.1:5173`. No API key is needed for the synthetic planning walkthrough. Start **Guided demo** for the constructed Farid case, inspect the Intel passage, and follow the review, publication and explicit adoption milestones.

| Page | What to inspect |
| --- | --- |
| Overview | Current decision and next action |
| My profile | Skills, unknowns, qualifications, time and budget |
| Skills radar | Six selected skills and visible gaps |
| Explore roles | Explainable alignment and separate entry requirements |
| My learning plan | Ordered steps, practice feedback and voluntary return to the plan |
| What changed | Old/new priorities and explicit adoption |
| My contribution | SDG explanations and unmeasured-impact limits |
| Evidence studio | Source triage, human review, separate publication and history |

Architecture: React/TypeScript calls a Fastify API backed by PostgreSQL. arXiv supplies source candidates. RunPod embeds bounded public passages for reading triage; deterministic code ranks learning directions and human review controls evidence publication.

## Try the guided demonstration

Choose **Guided demo** in the app header. It opens a separate database workspace with a clearly constructed Farid inspection case. Follow five milestones: save the baseline, review the passage, publish a version, reject weak signals, and compare/adopt the new plan. The guide checks saved application state; it does not approve or publish evidence for you. Exit returns to the regular workspace. Restart replaces only the rehearsal data, and stale tabs cannot write into a restarted round. Paid GPU requests are disabled in this mode.

The comparison shows actual old/new learning-step positions, including an honest unchanged-order result when appropriate. Saved plans provide a downloadable text decision brief with the captured profile, assessment, evidence version and study sequence.

## Start locally

Requires Node.js 22.12+ or 24 and npm. Local verification uses Node 24; the Replit workspace uses Node 22.22. Run `npm ci`, then `npm run dev`, and open `http://127.0.0.1:5173`.

No key or external database is required locally. PGlite runs embedded PostgreSQL and saves data under `.data/postgres`. Each browser receives its own synthetic workspace. Reloading preserves profiles, evidence decisions and learning plans. A local reviewer mode is enabled only on a loopback host outside Replit/production.

`npm test` runs domain, API and connector tests. `npm run build` checks TypeScript and builds the client. `npm start` serves the built client and API together. `npm run ingest` performs a real read-only arXiv fetch/validation probe; use Evidence Studio to save fetched articles in a workspace.

`npm run verify` runs the test suite, production build and built-app smoke check. All six jobs in the linked CI run passed: four Windows/Linux and Node 22/24 jobs, the 11-test Python worker job, and the PostgreSQL 17 job with all 11 database/configuration checks, including the three real-PostgreSQL checks skipped by default locally. See `docs/OPERATIONS.md` for the exact checks and real-data pilot gates.

## Submission materials

`docs/submission/README.md` indexes the Console proposal, technical declaration, requirements-to-proof matrix, 6:40 recording script, deck copy, dependency inventory and blank evaluation sheet. All eight bounded template responses have reproducible word checks. Required human declarations, baseline evidence and public links remain clearly marked. Private contact details and signed forms do not belong in this public source directory.

Gemini provided ideas-only reviews on 21 and 23 October. Three intervening attempts on 22 October failed. The successful follow-up led to voluntary practice-to-plan navigation and a clearer warning about negated or vocabulary-matching passages; no code was requested. Accepted changes and rejected overclaims are documented in `docs/GEMINI_REVIEW.md`. This remains a synthetic demonstration, with one application-accepted live GPU result and a six-case synthetic triage smoke evaluation; no commercial deployment is claimed.

## Product boundaries

- Two editable synthetic worker presets, six selected skills, three exploratory routes and two adoption scenarios.
- Scores explain selected-skill alignment, not full occupational readiness or employment probability.
- Unknown qualification requirements remain unknown. A current-role development route is not a promise of eligibility for another job.
- Actual dated baseline sources; human interpretations and numerical scenario rules are labelled modelling assumptions.
- Evidence approval and publication are separate. Rejecting weak evidence does not revert published snapshots. Saved plans change only when the worker adopts a new one.
- A new snapshot can explicitly retire an active evidence rule with a reason, optionally replacing it with an approved revision. Earlier snapshots and accepted plans retain their original evidence.
- Saved plans retain the weekly hours and budget used when adopted. Completion carries forward within the same worker, route and scenario; changing one scenario's progress does not rewrite another saved branch.
- New plans also retain their original profile, assessment and engine version. Legacy plans explicitly report uncaptured decision details instead of reconstructing a historical score from today's profile.
- Learning blocks combine public resources and team-authored practice estimates. Completing a step does not award a qualification or increase proficiency automatically.
- No measured employment, wage, emissions or planning-time result is claimed.
- Real arXiv refresh may fail; the previous reviewed state remains available. Research is not deployment evidence.
- RunPod relevance triage is separate from deterministic planning. The worker container built successfully; the app accepted a completed Intel-passage GPU result, and six declared synthetic cases completed. These establish execution and a tiny ranking smoke result, not general accuracy. Failed, unavailable and uncertain requests are visible; no simulated score is presented as live inference.

## Replit

Development and platform setup are proceeding within the participant's existing US$20 Replit and US$25 RunPod credits. Replit commit `423bf15`, including the practice-navigation and warning improvements, passed 257 tests with three optional PostgreSQL tests skipped, the production build and built-app smoke. The Autoscale target change from `71489cc` was then applied. A RunPod queue endpoint was created from the private worker repository and its container built successfully. A completed Intel-passage GPU result was accepted by the app and six synthetic triage jobs completed. Public application deployment is blocked by the dependency-security review described in `docs/DEPLOYMENT.md`; remediation and rescanning remain pending. Keeping source in Replit is not, by itself, verified competition proof of use.

The 23 October local checkpoint passed 257 application tests, with three optional real-PostgreSQL tests skipped, plus TypeScript checking, the production build, built-app smoke test and 11 offline Python worker tests. See `docs/BUILD_STATUS.md` for dated evidence and remaining release gates. Scan source with `python scripts/package-release.py --scan-only`; after committing verified source, create a new archive with `python scripts/package-release.py --output ../ShiftBridge_Replit_Source_23Oct.zip`.

See `docs/DEPLOYMENT.md`. Hosted environments require a real PostgreSQL `DATABASE_URL`; the app deliberately refuses ephemeral disk-only hosting. The Replit commands enable isolated demonstration review for judges. Configure an `ADMIN_TOKEN` for controlled review or future paid inference; demo mode never authorises paid inference. Never commit keys, database URLs, voucher codes or runtime data.

## Implementation choices

The preliminary application stores one versioned JSONB workspace aggregate per browser session in PostgreSQL, with row locks for atomic changes. This is an intentionally small, inspectable implementation. The earlier multi-table/Drizzle design remains a scaling option, not a claim about this build. The aggregate includes immutable evidence snapshots and versioned profiles; API validation enforces publication and progression rules.

The prototype has synthetic sessions rather than personal accounts. Each session's catalogue, review and plans are isolated, including on the hosted demo. Before a real pilot, add organisational accounts, shared evidence publication, retention/expiry cleanup, stronger access management and independent occupational validation.

Public source excerpts are kept short in the baseline catalogue and link to their original publishers. Live arXiv abstracts are retrieved for inspection; they are untrusted input. See source limitations in the UI and `docs/SOURCE_RESEARCH.md`.

## Authorship and competition use

Codex assisted with research, design, implementation and tests. The participant team must understand and own the final problem framing, design decisions and presentation, and accurately declare all AI/tool use. This repository does not represent the competition organisers and does not guarantee eligibility, sponsor compliance or a prize.

Original application code: Apache-2.0. Third-party dependencies and source material retain their respective licences and rights. Do not imply that the code licence relicenses source reports or course content.
