# Strategic review and decisions

Review record updated 23 October 2026. On 21 October Gemini was consulted through the participant's opened chat, at their explicit request, for suggestions and ideas only. It was not asked to code, implement, access project files or operate development tools. Codex provided a non-secret product brief, challenged unsupported claims and retained implementation responsibility as an assistant to the participant. The interface displayed Argon; the underlying model version was not independently verified.

Conversation: https://gemini.google.com/app/9b4e31273e002e09 (account access may be required; not a public evidence link).

## Follow-up attempt on 22 October

Three Gemini attempts failed on 22 October: two in the existing chat and one in a fresh chat. Those attempts supplied no recommendations. A later ideas-only review succeeded on 23 October, recorded below; the failed attempts must not be presented as that review or as an endorsement that improvement is exhausted.

The independent code and product review found useful further work: source-level triage before an interpretation is proposed, safer paid-request handling, and a QA exercise that can be completed inside the app. These are concrete improvements, not evidence that the product is complete or likely to win. The participant authorised existing US$20 Replit/US$25 RunPod credits; new subscriptions and top-ups remain unauthorised. Subsequent genuine GPU execution and platform checks are recorded in [RUNPOD_VERIFICATION.md](RUNPOD_VERIFICATION.md) and [DEPLOYMENT.md](DEPLOYMENT.md).

## Successful follow-up — 23 October

[Gemini review conversation](https://gemini.google.com/app/9e884f5bcae87e2c) (account access may be required). Gemini received a non-secret product brief and was asked only for suggestions and ideas. No code, private worker data or credentials were supplied, and it was not asked to develop the application.

| Suggestion | Decision and evidence |
| --- | --- |
| Ambiguous passages can have high similarity | Applied an explicit warning that matching vocabulary and negated claims require inspection; semantic similarity does not establish deployment or workforce impact. The live smoke case with negated inspection keywords scored above the real Intel passage, illustrating this limit. Rejected an unvalidated confidence threshold and keyword/domain prefilter. |
| Connect practice feedback to the learning pathway | Added an optional action from practice feedback to the actual learning steps. Browser verification confirmed focus moved to “Your learning steps” on `#pathway`, while the accepted plan stayed at 25% / one of four steps. It does not adopt a plan, save proficiency or award competence. |
| Demonstrate another verifiable source | Retained as a demo improvement to verify separately. Use only an actual supported source with its real date and bounded claim. Gemini's proposed IPC/NOSS additions require primary-source verification; no broader subsector validation is claimed. |

Gemini incorrectly named **bge-base**; the executed model is **BAAI/bge-large-en-v1.5**. Its “17/20 classifications” and “Module 3” examples were invented illustrations, not results from this project. They were not adopted. “Diagnostic readiness” would overstate this teaching exercise and was also rejected. The review is useful input, not prize prediction, certification or an assertion that there is no remaining room to improve.

The four-file UI follow-through passed 56 relevant tests and the production build. Its voluntary navigation was browser-checked. The full local suite then passed, and Replit commit `423bf15`, including these UI changes, passed 257 tests/build/smoke. The subsequent Replit `f056cef` build and live public HTTPS checks passed. The patched v3 GPU runtime subsequently completed a hosted TalentCorp-passage request with matching provenance and application acceptance; see `RUNPOD_VERIFICATION.md`.

## Earlier 21 October suggestions accepted and adapted

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
- Runtime planning is deterministic; source review is human-curated. AI-assisted development is separate from actual inference. A completed Intel-passage result was accepted by the app and six declared synthetic jobs completed on RunPod; exact evidence is in `RUNPOD_VERIFICATION.md`. These narrow results do not establish general model accuracy or occupational validity.
- Organisation-wide evidence sharing is proposed future work. Current publication is isolated to the visitor's synthetic workspace. It must not be described as an existing multi-tenant service.
- Gemini's hypothetical judge scores and guesses about buyer behaviour are not evidence. The reviewer cannot establish prize likelihood or competition eligibility.
- Short educational practice does not certify proficiency, machine-operation permission, hiring eligibility or readiness for unsupervised industrial work.

## Revised demonstration language

Opening: “Farid has four hours a week to learn. Which QA skills should come first as inspection technology changes? ShiftBridge connects dated sources to visible planning assumptions. In this synthetic case, we review one historical industry signal, reject two weak cases, compare the resulting learning order, and let Farid choose whether to adopt it.”

Closing: “The old plan remains available. Farid can inspect the reason for the new order, adopt it deliberately, and download the recorded decision. Next we need independent QA review and real-user testing; the demo does not prove employment outcomes.”

If showing Sources & triage, describe recorded similarity as help deciding what to read. Keep a research abstract distinct from deployment evidence, and show that a relevance result cannot publish a rule. Show the actual completed result and its provenance, not an invented score or universal cutoff. The synthetic QA exercise is a separate authored teaching example; its hypothetical AI flags must never be described as predictions produced by the RunPod relevance model. After feedback, use the optional plan action to show how the learner can return to their accepted next steps without changing progress automatically.

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
