# ShiftBridge

A workforce learning planner for Malaysian manufacturing quality inspectors, built for SDC Domain 1. Review dated evidence, compare explainable skill gaps and choose a practical learning plan.

The HTML produced during ideation is a separate design reference. This directory is the actual application.

[Live prototype](https://shift-bridge-kingyang3096.replit.app) · [Public source repository](https://github.com/Epsilon3096/SDC_Hackathon) · [Verified CI run](https://github.com/Epsilon3096/SDC_Hackathon/actions/runs/39945030875)

[![Verify ShiftBridge](https://github.com/Epsilon3096/SDC_Hackathon/actions/workflows/verify.yml/badge.svg)](https://github.com/Epsilon3096/SDC_Hackathon/actions/workflows/verify.yml)

Published commit `45bfed5` (r4) passed 24 independent HTTPS checks, including matching assets, managed PostgreSQL, save/read-back, visitor isolation and denied anonymous GPU requests. All seven CI jobs passed at `45bfed5`. The patched v3 GPU worker completed a hosted TalentCorp-passage request with all nine provenance checks passing; the app displayed the accepted result. Earlier v2 jobs remain separately labelled historical evidence.

## Competition submission - Console

| Team | Details |
| --- | --- |
| Team / size | Console / Solo |
| Leader / university | Tan King Yang / Universiti Tunku Abdul Rahman (UTAR) |
| Domain | Domain 1 - AIVERSECITY |
| SDG alignment | SDG 4: learning; SDG 8: workforce adaptation; SDG 9: industrial capability |

### Start here, judges

| Deliverable | Link |
| --- | --- |
| **Pitch and working demo (6:41)** | **[Watch on YouTube](https://youtu.be/zyS30NtQKsg)** - unlisted, accessible by link |
| **Live prototype** | **[Open ShiftBridge](https://shift-bridge-kingyang3096.replit.app)** - choose **Guided demo**, no API key needed |
| Signed proposal | [SDC2026_Console_Preliminary.pdf](submission/SDC2026_Console_Preliminary.pdf) |
| Signed technical declaration | [SDC2026_Console_TechDeclaration.pdf](submission/SDC2026_Console_TechDeclaration.pdf) |
| Pitch slides | [Download the eight-slide PowerPoint](submission/ShiftBridge_Console_Pitch.pptx) |
| Replit proof of use | [SDC2026_Console_Replit_POU.pdf](submission/SDC2026_Console_Replit_POU.pdf) |
| RunPod proof of use | [SDC2026_Console_Runpod_POU.pdf](submission/SDC2026_Console_Runpod_POU.pdf) |
| Replit project | [ShiftBridge workspace](https://replit.com/@kingyang3096/ShiftBridge) |
| RunPod integration | Endpoint `0qcgjcclf6fln9`; [execution and provenance records](docs/RUNPOD_VERIFICATION.md). Authenticated endpoint; credentials are intentionally excluded. |

Final documents use the organiser's original templates. A dated publication update preserves the signed pages and replaces earlier video-upload-pending statements. Draft working notes under `docs/submission/` are historical; the PDFs above are the final documents. [Artifact checksums](submission/CHECKSUMS.json).

## Three-minute judge orientation

Open the live prototype above, or run `npm ci` then `npm run dev` and open `http://127.0.0.1:5173`. No API key is needed for the synthetic planning walkthrough. Start **Guided demo** for the constructed Farid case, inspect the Intel passage, and follow the review, publication and explicit adoption milestones.

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

`npm run verify` runs the test suite, production build and built-app smoke check. All seven jobs in the linked CI run passed: four Windows/Linux and Node 22/24 jobs, worker contract tests, real PostgreSQL integration, and strict worker/PyTorch dependency audits. Individual counts were not extracted from these CI logs; the recorded local/Replit counts are separate. See `docs/OPERATIONS.md` for the exact checks and real-data pilot gates.

## Submission materials

The final signed forms, slide deck, video and provider proof PDFs are linked above and collected in [`submission/`](submission/). The participant explicitly authorised publication of the signed forms and their required contact fields. Earlier drafting notes are retained for traceability; they do not supersede the final PDFs.

Gemini provided ideas-only reviews on 21 and 23 October. Three intervening attempts on 22 October failed. The successful follow-up led to voluntary practice-to-plan navigation and a clearer warning about negated or vocabulary-matching passages; no code was requested. Accepted changes and rejected overclaims are documented in `docs/GEMINI_REVIEW.md`. This remains a synthetic demonstration, with a hosted application-accepted v3 GPU result and a repeated six-case synthetic triage smoke evaluation; no commercial deployment is claimed.

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
- RunPod relevance triage is separate from deterministic planning. Under the earlier v2 contract, the worker container built successfully, the app accepted a completed Intel-passage GPU result, and six declared synthetic cases completed. The patched v3 worker completed a TalentCorp request accepted by the hosted app and six synthetic cases with matching provenance. These establish execution and a tiny ranking smoke result, not general accuracy. Failed, unavailable and uncertain requests are visible; no simulated score is presented as live inference.

## How we use Replit

Replit hosts the React/Fastify application with managed PostgreSQL and was used for workspace verification, security scanning and deployment. [Replit proof PDF](submission/SDC2026_Console_Replit_POU.pdf).

Development and platform setup are proceeding within the participant's existing US$20 Replit and US$25 RunPod credits. Replit commit `f056cef` passed 257 tests with three optional PostgreSQL tests skipped, the production build and built-app smoke. Its security scan reported zero active and zero dismissed findings, and publication succeeded. A RunPod queue endpoint was created from the private worker repository and its container built successfully. A completed Intel-passage GPU result was accepted by the app and six synthetic triage jobs completed. The live application passed 24 HTTPS checks. Patched v3 GPU execution and hosted application acceptance are recorded separately in `docs/RUNPOD_VERIFICATION.md`. Keeping source in Replit is not, by itself, verified competition proof of use.

The 23 October local checkpoint passed 257 application tests, with three optional real-PostgreSQL tests skipped, plus TypeScript checking, the production build, built-app smoke test and 13 offline Python worker tests. See `docs/BUILD_STATUS.md` for dated evidence and remaining release gates. Scan source with `python scripts/package-release.py --scan-only`; after committing verified source, create a new archive with `python scripts/package-release.py --output ../ShiftBridge_Replit_Source_23Oct.zip`.

See `docs/DEPLOYMENT.md`. Hosted environments require a real PostgreSQL `DATABASE_URL`; the app deliberately refuses ephemeral disk-only hosting. The Replit commands enable isolated demonstration review for judges. Configure an `ADMIN_TOKEN` for controlled review or future paid inference; demo mode never authorises paid inference. Never commit keys, database URLs, voucher codes or runtime data.

## How we use RunPod

The application sends bounded public passages to a RunPod serverless GPU worker running the pinned BGE embedding model. It returns relevance triage with model and input provenance. Human review controls publication; deterministic application code controls planning. The worker is part of the actual application integration, rather than a placeholder API. [RunPod proof PDF](submission/SDC2026_Console_Runpod_POU.pdf) and [v3 execution evidence](docs/RUNPOD_VERIFICATION.md). Historical v2 dashboard screenshots are explicitly labelled and are not presented as current v3 metrics.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/` | React UI and client code |
| `src/server/` | Fastify API, persistence and source connectors |
| `runpod/` | GPU worker, dependency locks and offline contract tests |
| `scripts/` | Verification, packaging and operational checks |
| `docs/` | Architecture, deployment, evidence and historical working notes |
| `submission/` | Final signed PDFs, slides and proof of use |

## Implementation choices

The preliminary application stores one versioned JSONB workspace aggregate per browser session in PostgreSQL, with row locks for atomic changes. This is an intentionally small, inspectable implementation. The earlier multi-table/Drizzle design remains a scaling option, not a claim about this build. The aggregate includes immutable evidence snapshots and versioned profiles; API validation enforces publication and progression rules.

The prototype has synthetic sessions rather than personal accounts. Each session's catalogue, review and plans are isolated, including on the hosted demo. Before a real pilot, add organisational accounts, shared evidence publication, retention/expiry cleanup, stronger access management and independent occupational validation.

Public source excerpts are kept short in the baseline catalogue and link to their original publishers. Live arXiv abstracts are retrieved for inspection; they are untrusted input. See source limitations in the UI and `docs/SOURCE_RESEARCH.md`.

## Authorship and competition use

Codex assisted with research, design, implementation and tests. The participant team must understand and own the final problem framing, design decisions and presentation, and accurately declare all AI/tool use. This repository does not represent the competition organisers and does not guarantee eligibility, sponsor compliance or a prize.

Original application code: Apache-2.0. Third-party dependencies and source material retain their respective licences and rights. Do not imply that the code licence relicenses source reports or course content.

[Third-party notices](public/THIRD_PARTY_NOTICES.txt) include the browser libraries' full copyright and permission texts, with a pointer retained in the built JavaScript. The same file is served at `/THIRD_PARTY_NOTICES.txt`. [Worker notices](runpod/THIRD_PARTY_NOTICES.txt) retain the pinned BGE model's upstream MIT notice and identify installed library licences.
