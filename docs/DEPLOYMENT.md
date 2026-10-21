# Replit deployment

Prepared 21 October 2026. RunPod setup is deferred at the participant's request. This application remains usable without it and clearly reports that inference is not connected.

**Current status:** Replit setup and publishing are on hold while development continues locally. The existing workspace contains an earlier version, not the latest local fixes. Later, upload the final source and verify it again. No subscription purchase is authorised or performed. A workspace import alone is not a verified sponsor-compliance conclusion.

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

## Publish

Use a server-capable Replit deployment. Build command: `npm ci && npm run build`. Start command: `NODE_ENV=production HOST=0.0.0.0 DEMO_REVIEW=true npm start`. Set port 3001. Configure the production database. A reviewer token is optional for the isolated demonstration and required before enabling paid inference or a controlled review service.

Once the public address exists, set `PUBLIC_ORIGIN` to its exact HTTPS origin without a trailing slash in that deployment's environment. Do not apply the published origin to an editor preview with a different hostname; leave the preview value unset or use the preview's own HTTPS origin. Cookies are HttpOnly and SameSite=Strict; both Replit editor preview and production use Secure cookies and HTTPS origin checks. Evidence writes require either explicit isolated demo mode or reviewer access, and reject cross-origin mutations.

Test the published address in a new browser session: all eight screens, source links, save/reload, evidence review protection, active snapshot stability and the live refresh. A working editor preview is not proof that the published URL works for judges.

The provided Replit voucher was rejected by checkout as expired on 21 October 2026. No subscription purchase is included in the application or required by this source package. Account pricing and deployment allowances must be checked in the actual account before enabling a paid option.

## Optional RunPod later

The server adapter accepts an asynchronous queue endpoint through `RUNPOD_API_KEY`, `RUNPOD_ENDPOINT_ID` and `RUNPOD_MODEL_REVISION` (a pinned 40-character model commit). The planned model is `BAAI/bge-large-en-v1.5`.

No worker has been deployed or live GPU execution verified in this build. Connecting an arbitrary endpoint is insufficient: its handler must accept the app's bounded text/query/source hash and return a score with matching source hash, model, revision, query, preprocessing version and `device: cuda`. The backend rejects mismatched provenance. The API code and mocked transport tests specify this contract.

Similarity does not approve an implication or change a recommendation. Do not use an uncalibrated 0.65 threshold or present an embedding score as a probability. Existing published snapshots remain usable if the provider is unavailable.

Before making a sponsor-compliance claim, revisit the competition's RunPod wording and retain genuine proof of use if required. Deferral for development does not resolve the rule ambiguity documented in the earlier strategy report.

## Operating limits

- One live source adapter, bounded responses, timeouts and source-version deduplication.
- Six source records maximum per refresh; no recursive crawling.
- Per-workspace catalogue limits and API request throttling.
- No automatic paid inference or background polling on page load.
- No in-memory scheduler presented as reliable periodic ingestion. Refresh is explicit.
- Database rows contain synthetic user state and review history. Add retention cleanup and organisation authentication before a real pilot.

Relevant platform documentation: [Replit deployment types](https://docs.replit.com/features/publishing/deployment-types), [RunPod queue requests](https://docs.runpod.io/serverless/endpoints/send-requests).
