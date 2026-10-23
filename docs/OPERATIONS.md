# Release verification and pilot operations

Status as of 23 October 2026: local synthetic demonstration release, not a commercially launched service. The participant has ended the earlier Replit/RunPod deferral and authorised setup within the existing US$20 Replit and US$25 RunPod credit budgets. No new subscription or top-up is authorised. Commit `b9e1365` passed Replit verification (257 tests, three optional PostgreSQL tests skipped, production build and built-app smoke); later UI refinements need an updated upload; the remote container build, an application-accepted Intel-passage GPU result and six synthetic triage cases are verified. A new public app deployment remains unverified. Do not treat a prepared workflow, guide, private repository or local test as evidence it ran on an external platform. See [DEPLOYMENT.md](DEPLOYMENT.md) and [runpod/README.md](../runpod/README.md).

## Reproduce a release

1. Use a clean checkout and a supported Node version. Run `npm ci`.
2. Run `npm run verify`. This runs the automated suite, TypeScript/production build and a smoke check against the built assets served by Fastify.
3. Run `npm audit --omit=dev`. Record the date and result; this is known-dependency screening, not a security certification.
4. Start `npm run dev` for local viewing, or `npm start` after building for the combined local server. Walk through the isolated rehearsal, rejection cases, adoption, download and exit to the normal workspace. Check the Sources & triage queue separately from mapping review and publication. Exercise the in-app synthetic QA answers and confirm that checking them does not change saved progress or proficiency.
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
- No third-party analytics or background model calls are configured. Explicit source refresh sends a public research query, not a worker profile. The prepared inference path sends only bounded public source text, the fixed inspection query and provenance. A team reviewer must explicitly request it; public demo review and rehearsal cannot spend GPU credits. Its executable worker and request safeguards are locally prepared, not live execution proof.
- The in-app 20-case QA exercise uses the authored synthetic CSV and deterministic answer checking. Its answers remain temporary page state and reset when leaving the page. It does not call a model or write proficiency, saved learning progress or review decisions. Practice feedback is not an assessment of workplace competence.
- There is no self-service export/import of the entire workspace, account deletion or recovery. The decision brief is a human-readable record, not a database backup. Do not promise restore from it.
- Accepted plan history is bounded at fifty plans per workspace. A fifty-first distinct adoption is rejected with an explanation; prior plans and progress remain intact. Re-adopting an identical recorded decision stays idempotent.
- Source ingestion and inference failure preserve published snapshots. Never bypass review to repair an unavailable source feed. An ambiguous inference submission must not be retried as though no job was created; follow the recovery process below.

## Inference spending and recovery

Current integration state: the worker source is in the private [Epsilon3096/shiftbridge-inference](https://github.com/Epsilon3096/shiftbridge-inference) repository at commit `5ddfef5b7f553d6e1d1b9618fcaf9f6e4f007598`. The participant approved repository-only access and an endpoint-restricted GET/POST API key. Queue endpoint `0qcgjcclf6fln9` has been created and its container built successfully. The first real Intel-passage job completed and was accepted by the application. Six declared synthetic triage jobs also completed. `RUNPOD_VERIFICATION.md` records provenance, timings and the narrow ranking observation; none is a general accuracy claim. The selected 16 GB GPU family showed US$0.58/hour runtime, with maximum workers 1, active workers 0, idle timeout 5 seconds and execution timeout 120 seconds. A quoted rate is not measured usage or a hard credit cap. This repository is not a public submission link.

Check the provider's actual remaining credit and usage before the first request, after the first completed request, and before any additional evaluation. The existing budgets are US$20 for Replit and US$25 for RunPod; no subscription, top-up or charge beyond those amounts is authorised. Start RunPod with zero active workers and a maximum of one worker, then follow the model, GPU and timeout settings in [runpod/README.md](../runpod/README.md). These settings limit concurrency and idle exposure; they do not enforce an account spending ceiling.

| Recorded state | Meaning and permitted next step |
| --- | --- |
| `unconfigured` | No endpoint connection was configured; no GPU call occurred. Complete private configuration and verify it before requesting a job. |
| `submitting` | A database reservation was committed before the provider request. The request may be in flight or its outcome may be unconfirmed. Another request reuses the reservation, including across server instances. |
| `unknown` | The provider may have accepted the request, but the application could not verify the outcome. Automatic resubmission is blocked. Inspect provider history; do not infer that it was unbilled. |
| `pending` | A provider job ID is known. Check that existing job's status; do not create another job. |
| `completed` | The returned score passed source, exact-text, model, revision, query, preprocessing and CUDA-output checks. Reuse the result. This is application provenance, not hardware attestation, accuracy validation or a workforce claim. |
| `failed` | The known provider job returned a terminal failure status. Inspect its reason and actual usage before choosing whether a new request is justified within budget. |

Unknown or submitting requests can be reconciled using a known completed job ID. The recovery endpoint reads provider status and accepts only a completed result with matching provenance. Pending, failed and mismatched job results do not release the reservation. If no matching completed job can be established, retain the unresolved record; there is no automatic destructive reset or assumption of no charge. A model/endpoint configuration change must not redirect a pending job to another endpoint.

The ledger keeps up to 100 inference records and rejects a new record at capacity instead of silently removing active or uncertain requests. Delayed polling responses cannot move a completed result back to pending. Source-level similarity can order a reviewer's reading queue, but never approves a mapping, publishes a snapshot, replaces an accepted plan or raises a worker's skill level. Source ingestion and inference remain separate from human review and explicit publication.

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
