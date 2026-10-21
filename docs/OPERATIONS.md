# Release verification and pilot operations

Status: local synthetic demonstration release, not a commercially launched service. Replit and RunPod are deferred by the participant. Do not treat a prepared workflow, guide or test as evidence it ran on an external platform.

## Reproduce a release

1. Use a clean checkout and a supported Node version. Run `npm ci`.
2. Run `npm run verify`. This runs the automated suite, TypeScript/production build and a smoke check against the built assets served by Fastify.
3. Run `npm audit --omit=dev`. Record the date and result; this is known-dependency screening, not a security certification.
4. Start `npm run dev` for local viewing, or `npm start` after building for the combined local server. Walk through the isolated rehearsal, rejection cases, adoption, download and exit to the normal workspace.
5. Review `git diff --check`, source attribution and submission claims. Package only tracked source; exclude `.env`, `.data`, logs, dependency directories and local state. Keep `.env.example` without credentials.
6. Record the source commit, package SHA-256, runtime version and actual checks performed. A release ZIP is not a deployment, and a source commit is not a public repository.

The built-app smoke check uses disposable in-memory PostgreSQL and no external APIs. It verifies production asset references and delivery, practice CSV availability, API JSON errors, secure/no-store session responses, captured plan persistence, independent visitor state and denied cross-origin writes. It does not exercise a real TLS proxy or commercial database backup.

## Prepared continuous verification

`.github/workflows/verify.yml` runs Node 22/24 on Linux/Windows, with dependency installation from the lockfile, the release verification command and a production dependency audit. A separate job runs PostgreSQL 17 transaction checks against an isolated disposable service.

The PostgreSQL suite is skipped unless `SHIFTBRIDGE_TEST_DATABASE_URL` is explicitly set. It requires a loopback database named `shiftbridge_ci`, creates a random test-only schema, and removes only that schema after closing its pools. Never point it at a production database. The suite checks independent-pool locking, rollback, reconnect persistence and stale rehearsal generations. Local PGlite checks do not substitute for a successful run of this job.

The workflow is prepared locally. Until a public repository contains the source and GitHub reports completed checks, do not claim CI passed. References: [GitHub Node workflow documentation](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs), [PostgreSQL service containers](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers).

## Current data and recovery behaviour

- The session cookie is a 256-bit random browser credential, HttpOnly, SameSite Strict and Secure in hosted mode. The database uses a hash of it as the workspace key. Do not log or share the raw cookie.
- The browser cookie lasts fourteen days. This is **not** server-side expiry, automatic database deletion or an account-recovery policy. A copied cookie is a bearer credential; clearing or losing the cookie loses access to that workspace.
- Profiles, accepted plans, evidence decisions and snapshots persist in PostgreSQL. The synthetic rehearsal has a separate workspace and restart generation. Restart does not reset a normal workspace.
- No third-party analytics or background model calls are configured. Explicit source refresh sends a public research query, not a worker profile. The deferred inference adapter is designed to send bounded public source text and provenance; it must be re-reviewed before enabling.
- There is no self-service export/import of the entire workspace, account deletion or recovery. The decision brief is a human-readable record, not a database backup. Do not promise restore from it.
- Accepted plan history is bounded at fifty plans per workspace. A fifty-first distinct adoption is rejected with an explanation; prior plans and progress remain intact. Re-adopting an identical recorded decision stays idempotent.
- Source ingestion and inference failure preserve published snapshots. A failed operation should be retried only after inspecting its recorded result. Never bypass review to repair an unavailable source feed.

## Before any real-data pilot

These are release gates, not implemented features or completed approvals.

| Gate | Required evidence |
| --- | --- |
| Identity and access | Named user accounts, organisation boundaries, named reviewers, least privilege, server-side session expiry/revocation, and negative access tests. A shared reviewer token is insufficient for a commercial service. |
| Data lifecycle | Document collected fields and purposes, participant consent, defined retention and deletion handling, recovery process, and rights/access-request contact. Confirm appropriate obligations for the actual deployment. |
| Database continuity | Encrypted managed backups with a stated recovery-point/recovery-time objective; restore into an isolated environment and verify profiles, plan capture, review decisions and historical snapshot references. Do not overwrite the running database during a restore drill. |
| Service operations | HTTPS/origin configuration, key rotation, health and database failure monitoring, structured redacted error logging, alert owner, incident triage and rollback drill. Current health endpoint is liveness only. |
| Occupational validity | Independent QA reviewers evaluate role scope, prerequisites, numerical assumptions and practice outputs; record disagreements and version approved changes. |
| User validity | Obtain consent and run the published protocol; distinguish assisted from unaided completion, actual study time from estimates, and comprehension from proficiency. |
| Commercial fit | Interview the proposed buyer, verify the training workflow, budget owner and willingness to pilot. No price, cost saving or customer commitment is established. |

## Failure and rollback checklist

For a suspected correctness issue, stop publishing evidence and preserve a copy of the affected decision brief and version IDs. A valid correction is an explicit retirement/replacement with a reason; do not edit an old snapshot to make history look correct. For unavailable external feeds, keep reviewed evidence and show its original date. For authentication or exposure concerns, stop real-data use and investigate with the operator; the current prototype is not an incident-response system.

Before changing production code, take a verified backup, record the source version and confirm schema compatibility. Restore an earlier application version only if its data contract is compatible; otherwise restore a tested application/database pair into a separate environment and reconcile writes before switching traffic. These are planned operating procedures and have not been exercised against a production deployment.
