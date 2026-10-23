# ShiftBridge submission draft pack — Console

Draft text updated 23 October 2026 for Domain 1 AIVERSECITY. Existing rendered PDF/deck artifacts remain the earlier unsigned drafts until regenerated. Participant: **Tan King Yang**, **UTAR**, **solo team Console**. Email and phone are intentionally absent from these repository documents; they belong only in the private official PDFs where required.

This pack contains complete draft responses to the supplied template sections, plus evidence mapping and presentation copy. It is not an uploaded submission or a claim that the unresolved declarations have been confirmed. Codex assists the participant; it is not the competition host or entrant.

## Files

| File | Purpose |
| --- | --- |
| [01_PRELIMINARY_PROPOSAL.md](01_PRELIMINARY_PROPOSAL.md) | Exact numbered proposal fields, three bounded prose responses, impact framework, originality/eligibility declarations and source appendix. |
| [02_TECHNICAL_TOOLS_DECLARATION.md](02_TECHNICAL_TOOLS_DECLARATION.md) | Exact numbered technical declaration, five bounded prose responses, actual tool/platform/model status and major AI-assistance disclosure. |
| [WORD_LIMITS.md](WORD_LIMITS.md) | Reproducible counts for all eight limited responses. |
| [03_REQUIREMENTS_TO_PROOF.md](03_REQUIREMENTS_TO_PROOF.md) | All six must-haves, observable decision changes, code/test evidence and outstanding submission obligations. |
| [04_RECORDING_SHOT_LIST.md](04_RECORDING_SHOT_LIST.md) | A 6:40 preliminary pitch/demo sequence, truthful narration, backup shots and Q&A. |
| [05_PITCH_DECK_COPY.md](05_PITCH_DECK_COPY.md) | Copy accompanying the completed editable eight-slide draft deck. Local output: `outputs/ShiftBridge_Console_Pitch_DRAFT.pptx`, outside the app repository. |
| [DEPENDENCIES.md](DEPENDENCIES.md) | Main packages with actual resolved versions, purpose and declared licences. |
| [dependency-licenses.csv](dependency-licenses.csv) | Full lockfile package inventory, including transitive/optional entries. |
| [pilot_results.csv](pilot_results.csv) | Empty measurement sheet. No invented participant records or timings. |

Required PDF names: **SDC2026_Console_Preliminary.pdf** and **SDC2026_Console_TechDeclaration.pdf**. Use the official templates/sections and inspect every rendered page. A Markdown draft does not replace either required PDF.

## Confirmed versus unfinished

**Confirmed in context:** team name, participant name, university and solo count. The app is a working local prototype. Evidence review, deterministic planning, role scopes, actual step reordering, saved decisions, practice data and isolated rehearsal are implemented.

**Still needing participant confirmation or independent evidence:** workshop completion; exact assistant model labels; completeness of tool/sponsor/mentoring use; pre-existing work; employment-related IP; ownership review; signatures; intended-user validation; and a numeric planning-task baseline. These fields are visibly marked in the drafts. Do not convert them into checked declarations without evidence.

**Editable deck prepared:** the eight-slide PowerPoint draft includes actual application screenshots, editable comparison/practice tables and source notes. All eight slides were rendered from the exported file and visually inspected. Structural, font, slide-count and layout checks passed. Native Microsoft PowerPoint behavior was not tested; the participant should rehearse in the intended presentation app and approve the final content.

**External deliverables still needed:** maintain the now-verified public source access throughout judging; final participant review of the deck; 5–7 minute recorded YouTube pitch/demo; final signed PDFs; final video access and patched GPU proof. Public prototype access is already verified. Platform setup has resumed within the existing credits. The RunPod container built successfully, the app accepted a live Intel-passage result, and six synthetic triage jobs completed. Replit `f056cef` passed tests/build/smoke and its scan reported zero active/zero dismissed findings. [The public app](https://shift-bridge-kingyang3096.replit.app) passed 24 independent HTTPS checks. The patched v3 GPU worker still requires genuine CUDA verification; original v2 jobs remain historical evidence. The draft does not claim an official exemption.

**Repository access requirement:** the supplied Participant Handbook, physical page 29, sections 10.2–10.5, requires a public GitHub repository, an Apache-2.0 `LICENSE` file and accessibility throughout judging. The Technical Tools Declaration's “public / access granted to judges” field is broader; private judge access alone does not satisfy the stricter handbook requirement. The public [Epsilon3096/SDC_Hackathon repository](https://github.com/Epsilon3096/SDC_Hackathon) was verified without owner credentials, with original history preserved through `f056cef`. [All seven CI jobs passed](https://github.com/Epsilon3096/SDC_Hackathon/actions/runs/39942612991), including PostgreSQL integration and strict worker/PyTorch audits. Job outcomes are verified; individual test counts were not extracted from this run.

**Live relevance inference verified on limited cases:** current matching/planning is deterministic and interpretations are human-reviewed. Codex/Gemini assistance in development is separately declared. One real public-passage result and six synthetic triage results completed with matching provenance. This is execution evidence and a tiny smoke evaluation, not a representative model benchmark. No measured worker, employment, planning-time, compliance-certification or model-accuracy result is asserted.

## Baseline study sheet

Use anonymous participant codes and synthetic task cases only. Do not record names, contact details, CVs or actual employment records in the CSV. Use a locally held evaluator sheet if necessary; publish only appropriately anonymized aggregate results and non-identifying observations.

Columns record task version, static-catalogue/app condition, order, actual timing, success, source correctness, prerequisite mistakes and help. Keep an explicit internal-rehearsal versus independent-participant label. Time begins at task presentation and ends at a justified next-step decision. Record unsuccessful tasks too; explain the stopping rule. Counterbalance equivalent tasks to reduce learning effects. Report sample size and individual observations with any median; never manufacture the missing baseline to fill a template cell.

## Check and regenerate

From the application directory:

```text
node docs/submission/check-word-limits.mjs
node docs/submission/prepare-inventory.mjs
```

The first checks the marked answer bodies against the original limits and writes WORD_LIMITS.md. The second reads the current lockfile and writes the two dependency inventories. Neither script submits, signs, changes application code or contacts an external service.

After final code changes, record actual test/build output and update the proof matrix’s checkpoint. After final text changes, repeat word checks and inspect the PDFs. After obtaining links, test them without owner credentials. Keep keys, vouchers, contact details and runtime database files out of the public source package.

## Source of obligations

The supplied original proposal/technical-declaration templates and `work/template_audit.md` control the field order and limits used here. The reviewed Domain 1 brief supplies the six must-haves. The reviewed participant handbook requires six preliminary deliverables, including a pitch deck and 5–7 minute YouTube pitch/demo.

The reviewed materials give conflicting times on 25 October 2026. This pack does not resolve them or check new organizer announcements. The conservative internal completion date is 24 October until an authoritative update is confirmed. Unanswered workshop and sponsor-rule questions remain marked; no organizer message was sent.
