# ShiftBridge

A focused workforce planning prototype for Malaysian manufacturing quality inspectors. Built for SDC Domain 1. React + TypeScript, Fastify and PostgreSQL; optional RunPod relevance inference.

The HTML produced during ideation is a separate design reference. This directory is the actual application.

## Try the guided demonstration

Choose **Guided demo** in the app header. It opens a separate database workspace with a clearly constructed Farid inspection case. Follow five milestones: save the baseline, review the passage, publish a version, reject weak signals, and compare/adopt the new plan. The guide checks saved application state; it does not approve or publish evidence for you. Exit returns to the regular workspace. Restart replaces only the rehearsal data, and stale tabs cannot write into a restarted round. Paid GPU requests are disabled in this mode.

The comparison shows actual old/new learning-step positions, including an honest unchanged-order result when appropriate. Saved plans provide a downloadable text decision brief with the captured profile, assessment, evidence version and study sequence.

## Start locally

Requires Node.js 22.12+ or 24 and npm. Local verification uses Node 24; the Replit workspace uses Node 22.22. Run `npm ci`, then `npm run dev`, and open `http://127.0.0.1:5173`.

No key or external database is required locally. PGlite runs embedded PostgreSQL and saves data under `.data/postgres`. Each browser receives its own synthetic workspace. Reloading preserves profiles, evidence decisions and learning plans. A local reviewer mode is enabled only on a loopback host outside Replit/production.

`npm test` runs domain, API and connector tests. `npm run build` checks TypeScript and builds the client. `npm start` serves the built client and API together. `npm run ingest` performs a real read-only arXiv fetch/validation probe; use Evidence Studio to save fetched articles in a workspace.

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
- RunPod is optional in this build and currently deferred. Its absence is visible. No simulated GPU score is presented as a live result.

## Replit

Development and testing currently continue locally. Replit setup and publishing are on hold at the participant's request; the workspace contains an earlier working version. Upload and verification of the final source will follow later. Keeping source in Replit is not, by itself, a verified interpretation of the competition's proof-of-use requirement.

See `docs/DEPLOYMENT.md`. Hosted environments require a real PostgreSQL `DATABASE_URL`; the app deliberately refuses ephemeral disk-only hosting. The Replit commands enable isolated demonstration review for judges. Configure an `ADMIN_TOKEN` for controlled review or future paid inference; demo mode never authorises paid inference. Never commit keys, database URLs, voucher codes or runtime data.

## Implementation choices

The preliminary application stores one versioned JSONB workspace aggregate per browser session in PostgreSQL, with row locks for atomic changes. This is an intentionally small, inspectable implementation. The earlier multi-table/Drizzle design remains a scaling option, not a claim about this build. The aggregate includes immutable evidence snapshots and versioned profiles; API validation enforces publication and progression rules.

The prototype has synthetic sessions rather than personal accounts. Each session's catalogue, review and plans are isolated, including on the hosted demo. Before a real pilot, add organisational accounts, shared evidence publication, retention/expiry cleanup, stronger access management and independent occupational validation.

Public source excerpts are kept short in the baseline catalogue and link to their original publishers. Live arXiv abstracts are retrieved for inspection; they are untrusted input. See source limitations in the UI and `docs/SOURCE_RESEARCH.md`.

## Authorship and competition use

Codex assisted with research, design, implementation and tests. The participant team must understand and own the final problem framing, design decisions and presentation, and accurately declare all AI/tool use. This repository does not represent the competition organisers and does not guarantee eligibility, sponsor compliance or a prize.

Original application code: Apache-2.0. Third-party dependencies and source material retain their respective licences and rights. Do not imply that the code licence relicenses source reports or course content.
