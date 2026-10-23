# First completed GPU request — 23 October 2026

The RunPod worker container built successfully from private repository `Epsilon3096/shiftbridge-inference`, commit `5ddfef5b7f553d6e1d1b9618fcaf9f6e4f007598`. Endpoint `0qcgjcclf6fln9` reached Ready. The first request used a bounded public Intel inspection passage; it did not send a worker profile, qualification, plan or employer record.

| Observed provider field | Value |
| --- | --- |
| Job ID | `72c6de36-e807-4a4b-a87c-9dfee79dd4b8-e2` |
| Provider status | `COMPLETED` |
| Output device | `cuda` |
| Model | `BAAI/bge-large-en-v1.5` |
| Model revision | `d4aa6901d3a41ba39fb536a557fa166f842b0e09` |
| Preprocessing | `bge-cls-l2-512-bounded2000-v2` |
| Cosine similarity | `0.6027023196220398` |
| Provider delay time | `61,368 ms` |
| Provider execution time | `3,314 ms` |
| Source hash | `2d4c135ea6b00a4fe7b66f02186efefc443180b5082373504ca61e633068bffe` |
| Exact bounded text hash | `7ad805e9be8acb289c7a25777fe2c89d5c7850c283a9afd2054639fbb64f6fc6` |

The fixed query was: “Industrial manufacturing quality inspection: visual defect detection, automated optical inspection, inspection records, measurement and root cause analysis.” The exact non-secret provider JSON is retained in [runpod-first-job-2026-10-23.json](evidence/runpod-first-job-2026-10-23.json). No API key is included.

This establishes one completed provider request and the returned model provenance. Application polling accepted the matching result and displayed similarity 0.603 for the current model context. The timings describe this single request and do not establish typical latency or measured total charge. `cuda` is returned software provenance, not independent hardware attestation. Provider usage/balance inspection remains outstanding. The six-case evaluation completed as recorded below.

The score is **not accuracy, probability, evidence strength, workforce readiness or employment likelihood**. There is no universal 0.65 acceptance threshold. A relevant passage can receive a score below that arbitrary value. Similarity only helps organise a reviewer's reading; the source passage, human interpretation, role scope, approval and separate publication are still required. This request did not itself change a published snapshot or accepted plan.

The selected configuration is one 16 GB GPU family, maximum one worker, zero active workers, five-second idle timeout and 120-second execution timeout. Its quoted runtime rate was US$0.58/hour at setup. The quote is not a measured bill or hard budget cap. The endpoint key is restricted to GET/POST and stored privately. Existing credits remain the authorised budget; no extra subscription or top-up is implied.

A completed job is progress toward genuine platform proof. It does not establish a final Replit deployment, judge access, general model quality, sponsor-rule compliance or commercial readiness.

## Six declared synthetic cases

All six jobs completed on CUDA with the same model revision and preprocessing. The exact request texts, source/text hashes, provider job IDs and timings are retained in [runpod-six-cases-2026-10-23.json](evidence/runpod-six-cases-2026-10-23.json). These hand-authored examples were declared before execution and were not inserted as real sources.

| Case | Intended group | Observed similarity |
| --- | --- | --- |
| relevant-aoi | Relevant | 0.788420 |
| relevant-quality-records | Relevant | 0.693163 |
| ambiguous-research | Ambiguous | 0.579404 |
| ambiguous-keyword-negation | Ambiguous | 0.621195 |
| unrelated-retail | Unrelated | 0.458225 |
| unrelated-garden | Unrelated | 0.375392 |

Both direct inspection cases ranked above both unrelated cases: **4 of 4 declared pair comparisons**. The hypothesis held on these fixtures only. This is not 100% classification accuracy, expert labelling, threshold calibration or a representative benchmark. The ambiguous keyword-negation case scored higher than the real Intel passage, illustrating why similarity cannot establish deployment or workforce impact. Every case still requires human interpretation; no automatic approval threshold was introduced.

The first synthetic job recorded 11,460 ms delay and 3,156 ms execution. The remaining five recorded 89–93 ms delay and 203–253 ms execution. These are six observations in one run, not a service-level promise or billing calculation.
