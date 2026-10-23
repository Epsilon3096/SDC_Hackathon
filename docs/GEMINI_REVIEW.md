# Strategic review and decisions

Review record updated 23 October 2026. On 21 October Gemini was consulted through the participant's opened chat, at their explicit request, for suggestions and ideas only. It was not asked to code, implement, access project files or operate development tools. Codex provided a non-secret product brief, challenged unsupported claims and retained implementation responsibility as an assistant to the participant. The interface displayed Argon; the underlying model version was not independently verified.

Conversation: https://gemini.google.com/app/9b4e31273e002e09 (account access may be required; not a public evidence link).

## Follow-up attempt on 22 October

The participant requested another discussion about remaining improvements. Three Gemini attempts failed: two in the existing chat and one in a fresh chat. No usable new recommendations were obtained, so this release does not claim a new Gemini review, endorsement or assessment that improvement is exhausted. The accepted critique below is the earlier 21 October review. Subsequent implementation decisions came from direct inspection and development review.

The independent code and product review found useful further work: source-level triage before an interpretation is proposed, safer paid-request handling, and a QA exercise that can be completed inside the app. These are concrete improvements, not evidence that the product is complete or likely to win. The participant also authorised the existing US$20 Replit/US$25 RunPod credits; new subscriptions and top-ups remain unauthorised. Integration preparation is described in [DEPLOYMENT.md](DEPLOYMENT.md) and [runpod/README.md](../runpod/README.md), without claiming an already deployed GPU worker.

## Accepted and adapted

| Suggestion | Decision and evidence |
| --- | --- |
| Make reviewer and worker actions distinct | Add perspective labels to the existing guided rehearsal. These describe the walkthrough actor, not authenticated commercial accounts or permission roles. |
| Show the consequence of an evidence decision | Demonstrate the existing before/after order comparison and explicit adoption. Farid's constructed case moves AI inspection from step 3 to step 1. Show the source date and team-authored weight assumption alongside it. |
| Show practical QA learning, not generic course links | Foreground the 20-case synthetic QA CSV, confusion-table task, missed-defect/false-alarm case IDs and missing-measurement escalation explanation. The 22 October implementation adds an in-app exercise using the same cases, avoiding a spreadsheet requirement for this task. Its answers are temporary page state; checking them does not save progress, update proficiency or certify competence. This is a development follow-through on the earlier critique, not a new Gemini suggestion or proof of real-user usability. |
| Make rejection visible | Use the existing state-verified rejection milestone for both weak cases. It is a demonstration of restraint, not a statistical accuracy, harm-prevention or job-retention metric. |
| Test a narrow commercial use case | Propose a small supervised training-planning study. Measure comprehension, curator effort and agreement with independently recorded reviewer priorities. Thresholds are proposed stop/go criteria; no results or customer commitments exist. |

## Rejected or corrected

- No claim of audit certification, ISO compliance, empirically calibrated or expert-authored weights, five-minute monthly review effort, a 200-worker deployment, or prevented displacement.
- A historical Intel source is not proof of a current Malaysian deployment. A reviewed passage does not validate the numerical rule or the entire learning pathway.
- Runtime planning is deterministic; source review is human-curated. AI-assisted development does not mean a live AI model runs in the application. A bounded executable relevance worker and source-level triage UI are now prepared, but no remote GPU build, deployed endpoint or live inference result is established. Credit authorisation and a private build-input repository do not supply that proof.
- Organisation-wide evidence sharing is proposed future work. Current publication is isolated to the visitor's synthetic workspace. It must not be described as an existing multi-tenant service.
- Gemini's hypothetical judge scores and guesses about buyer behaviour are not evidence. The reviewer cannot establish prize likelihood or competition eligibility.
- Short educational practice does not certify proficiency, machine-operation permission, hiring eligibility or readiness for unsupervised industrial work.

## Revised demonstration language

Opening: “Farid has four hours a week to learn. Which QA skills should come first as inspection technology changes? ShiftBridge connects dated sources to visible planning assumptions. In this synthetic case, we review one historical industry signal, reject two weak cases, compare the resulting learning order, and let Farid choose whether to adopt it.”

Closing: “The old plan remains available. Farid can inspect the reason for the new order, adopt it deliberately, and download the recorded decision. Next we need independent QA review and real-user testing; the demo does not prove employment outcomes.”

If showing Sources & triage, describe recorded similarity as help deciding what to read. Keep a research abstract distinct from deployment evidence, and show that a relevance result cannot publish a rule. Until a real GPU job is verified, describe its actual configuration/build status honestly; do not substitute a synthetic score or describe an endpoint as proven inference. The synthetic QA exercise is a separate authored teaching example; its hypothetical AI flags must never be described as predictions produced by the RunPod relevance model.

## Commercial pilot hypothesis — not a launch claim

Potential buyer: a manufacturing training lead or technical training centre. User: a QA inspector with a reviewer facilitating the initial study. Neither willingness to pay nor procurement fit has been established. Do not name organisations as partners without an agreement.

Hypothesis: a visible evidence-to-plan comparison helps workers explain and discuss a proposed learning priority with a reviewer. Start with synthetic cases and public sources; do not import internal factory documents or personal worker records into this prototype.

Proposed study: ten consenting adult participants and two independent QA/training reviewers over two weeks. Counterbalance case order and record unaided attempts separately from facilitator help. Reviewers independently record a preferred order before seeing the application's answer. Record disagreements, not just aggregate approval. This is a small usability study, not evidence of labour-market impact.

Proposed go criteria for a larger supervised study (all required):

1. At least 8/10 participants correctly distinguish a source claim, a team-authored rule and a personal plan, and identify that adoption is optional.
2. At least 7/10 complete the practice task on their chosen devices without facilitator intervention; all critical misconceptions about missed defects or missing data are recorded and reviewed.
3. Both reviewers agree that at least 8/10 resulting briefs give a defensible learning priority, after independently recording their own judgment. Report inter-reviewer disagreement explicitly.
4. Two reviewers can assess five candidate passages within a predeclared 45-minute session, including an insufficient case, without developer intervention. This is a proposed feasibility threshold, not a promised review duration.
5. No silent plan replacement, cross-session exposure, unsupported eligibility claim or lost accepted decision occurs. Any such event stops the study until repaired and rechecked.

Before using real worker or internal organisational data: complete the operational gates in OPERATIONS.md, obtain appropriate consent, establish named reviewer responsibility and validate the occupation/learning content. A passed synthetic study alone does not authorise a commercial launch.
