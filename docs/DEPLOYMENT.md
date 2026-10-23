# Replit and RunPod deployment

Updated 23 October 2026. The participant has authorised development and setup using the existing **US$20 Replit credit and US$25 RunPod credit**. No new subscription, top-up or spending beyond those existing balances is authorised. Check the actual account balance and applicable charges before enabling a paid operation; these are budget limits, not verified current balances or a guarantee that either platform will enforce a hard cap.

**Current status:** The earlier platform deferral has ended. Replit received commit `b9e1365`; all 96 package files and the prior-source backup were verified. Its `npm run verify` passed with 257 tests, three optional PostgreSQL tests skipped, TypeScript/Vite build and built-app smoke. Later practice-navigation/warning refinements are locally verified and await the next upload. RunPod queue endpoint `0qcgjcclf6fln9` has been created from the private worker repository; its container built successfully. The first real Intel-passage job completed and was accepted by the app; six declared synthetic triage jobs also completed. The participant approved repository-only code/metadata access and an endpoint-restricted GET/POST API key. Configuration is stored privately in the local ignored `.env` and Replit Secrets. The image build and initial inference are verified; a new public application deployment remains unverified. See `RUNPOD_VERIFICATION.md` for exact provenance and the limited smoke results. A workspace import or prepared integration is not a verified sponsor-compliance conclusion.

The worker source was pushed to the **private** repository [Epsilon3096/shiftbridge-inference](https://github.com/Epsilon3096/shiftbridge-inference), commit `5ddfef5b7f553d6e1d1b9618fcaf9f6e4f007598`. This is the endpoint build-input repository, not the full app public judge-access source link. Build and execution observations are recorded separately in `RUNPOD_VERIFICATION.md`. The container and first live validation procedure are in [runpod/README.md](../runpod/README.md).

Workspace created: https://replit.com/@kingyang3096/ShiftBridge. The Replit runtime uses `nodejs-22` with Nix channel `stable-24_11`; runtime tools became responsive after this change from the imported Node 24 configuration. Local verification uses Node 24. Hosted checks are recorded separately.

## Import and first run

1. Import the source ZIP into Replit. It includes code, dependency lockfile, tests and `.replit`, but excludes secrets, runtime data and node_modules.
2. Install dependencies with `npm ci`.
3. Add a Replit PostgreSQL database. Confirm its `DATABASE_URL` is available to the application through Secrets. Do not copy it into a tracked file or chat.
4. Run `npm run replit`. This builds the client and starts Fastify on port 3001, listening on all interfaces for Replit's proxy. The server creates its workspace table automatically.
5. Open the preview **in a separate browser tab** using Replit's open-in-new-tab control. Select a synthetic worker, save a profile and adopt a plan. Reload and verify the saved state remains. Embedded frames are deliberately blocked; the separate tab is required for the app's frame policy and first-party session cookie.

The local PGlite database is for development. Hosted startup requires PostgreSQL rather than pretending that deployment disk is durable. Replit development and published production databases may differ; verify both environments explicitly.

## Reviewer access

The local loopback server permits review for development. The included Replit commands enable `DEMO_REVIEW=true`: visitors can review and publish evidence only in their own isolated synthetic workspace. This is labelled demonstration review, not authenticated professional validation. It never grants access to another workspace or to paid inference. Disable this flag for a controlled service and configure a strong `ADMIN_TOKEN` in Secrets. That token unlocks a session for one hour; keep it out of screenshots, repositories, recordings and public links.

An evidence review in this prototype affects only the current browser's synthetic workspace. It is not an organisation-wide publication service. Losing the session cookie loses access to that workspace; personal accounts and recovery are outside this preliminary build.

The guided rehearsal uses a separate workspace derived from that same session. Its mode is selected per request, and its current round has a generation token checked inside database transactions. Restarting replaces only rehearsal data; another tab cannot commit stale changes into the new round. Rehearsal review is permitted only within that isolated synthetic workspace. GPU submission, polling and reconciliation are disabled there. The normal workspace's reviewer protections are unchanged.

Evidence Studio now has a **Sources & triage** stage before Review, Publish and History. A new public source can be inspected and checked for relevance without first proposing a skill mapping. Sorting the reading queue by recorded similarity does not approve a source or change a recommendation; unscored and ambiguous records remain available. Review and explicit publication remain separate.

The QA learning page also includes the existing 20 synthetic inspection cases as an in-app exercise. It checks confusion-table counts, missed-defect selections and the incomplete-measurement response against the authored reference. Answers are temporary page state and reset when leaving; they do not write saved progress, proficiency, evidence decisions or model evaluation results. This exercise does not call RunPod.

## Publish

As of 23 October, the public deployment is configured but **not yet published**: Autoscale, one CPU, 1 GiB RAM, maximum one instance, Asia, and a fresh production database without copying development data. The exact planned origin is `https://shift-bridge-kingyang3096.replit.app`, saved as `PUBLIC_ORIGIN`. Do not treat that planned address as a working judge link until publication and new-session checks succeed. The reviewer secret and all three RunPod connection settings were saved privately. Existing Core showed expiry 22 November 2026, US$20 usage credit was confirmed, and credit auto-reload was off; no new subscription or top-up was purchased.

Use a server-capable Replit deployment. Build command: `npm ci && npm run build`. Start command: `NODE_ENV=production HOST=0.0.0.0 DEMO_REVIEW=true npm start`. Set port 3001. Configure the production database. A reviewer token is optional for the isolated demonstration and required before enabling paid inference or a controlled review service.

Once the public address exists, set `PUBLIC_ORIGIN` to its exact HTTPS origin without a trailing slash in that deployment's environment. Do not apply the published origin to an editor preview with a different hostname; leave the preview value unset or use the preview's own HTTPS origin. Cookies are HttpOnly and SameSite=Strict; both Replit editor preview and production use Secure cookies and HTTPS origin checks. Evidence writes require either explicit isolated demo mode or reviewer access, and reject cross-origin mutations.

Test the published address in a new browser session: all eight screens, source links, save/reload, evidence review protection, active snapshot stability and the live refresh. A working editor preview is not proof that the published URL works for judges.

Historical account observation: the earlier Replit voucher was rejected by checkout as expired on 21 October 2026. On 22 October the participant separately reported existing platform credits and authorised their use within the limits above. Do not infer a subscription entitlement, deployment allowance or current balance from the older checkout result or the reported credit alone. If publishing requires a new subscription or exceeds the available authorised credit, stop that paid step rather than purchasing it.

## RunPod worker and bounded activation

The 23 October endpoint configuration selects one 16 GB GPU family, a quoted runtime rate of US$0.58/hour, maximum workers **1**, active workers **0**, idle timeout **5 seconds** and execution timeout **120 seconds**. The rate is a dated UI quote, not measured total usage or a hard account spending ceiling. The approved API key is restricted to endpoint GET/POST access, without account-management access. Do not print or redistribute it. Check build completion and current usage before the first request.

The server adapter accepts an asynchronous queue endpoint through `RUNPOD_API_KEY`, `RUNPOD_ENDPOINT_ID` and `RUNPOD_MODEL_REVISION` (a pinned lowercase 40-character model commit). The prepared worker uses `BAAI/bge-large-en-v1.5`. Follow [runpod/README.md](../runpod/README.md) for the exact model revision, image/build recipe, worker limits and offline/live evaluation distinction. Keep credentials in platform Secrets, never in the source archive or browser client.

The prepared handler accepts only bounded public text, the fixed inspection query and provenance fields. The API validates the source hash, exact-input text hash, model, revision, query, preprocessing version and `device: cuda` on a completed result. The shared contract bounds input to 2,000 Unicode code points and the model to 512 tokens. Empty/short text and synthetic catalogue sources are rejected before a paid request. These code and mocked-transport checks do not prove a remote build or live GPU execution.

Before the paid POST, the API commits a `submitting` reservation in PostgreSQL. Other tabs or server instances reuse that reservation. A transport failure with an ambiguous outcome becomes `unknown` and blocks automatic resubmission; pending and completed results are also reused. A stale reservation is not evidence that the provider did no work. Check the RunPod job history instead of submitting again.

For a known completed provider job, an authenticated reviewer can use **Recover an existing provider result**, or `POST /api/inference-reconcile/:id` with `{ "jobId": "..." }`. This performs a status read only. It resolves the reservation only if the completed output matches the source, exact text, model and GPU contract. An unfinished, failed or mismatched job cannot clear the reservation. Never invent a result or remove a reservation merely to make retry possible. The ledger rejects a new record at 100 rather than silently evicting pending or uncertain jobs; a delayed pending poll cannot overwrite an already completed result.

Similarity does not approve an implication or change a recommendation. Do not use an uncalibrated 0.65 threshold or present an embedding score as a probability. Existing published snapshots remain usable if the provider is unavailable.

Before making a sponsor-compliance claim, revisit the competition's RunPod wording and retain genuine proof of use if required. Credit authorisation, a private source repository and a prepared worker do not establish successful platform use or resolve the rule ambiguity documented in the earlier strategy report.

## Operating limits

- One live source adapter, bounded responses, timeouts and source-version deduplication.
- Six source records maximum per refresh; no recursive crawling.
- Per-workspace catalogue limits and API request throttling.
- No automatic paid inference or background polling on page load.
- Paid inference is restricted to a team reviewer session in the normal workspace. Public demonstration review grants no GPU spending access.
- Durable submission reservations, verified-result reconciliation and preserved inference records reduce duplicate-request risk. They are not an account-level spending cap.
- No in-memory scheduler presented as reliable periodic ingestion. Refresh is explicit.
- Database rows contain synthetic user state and review history. Add retention cleanup and organisation authentication before a real pilot.

Relevant platform documentation: [Replit deployment types](https://docs.replit.com/features/publishing/deployment-types), [RunPod queue requests](https://docs.runpod.io/serverless/endpoints/send-requests).
