# Bounded evidence relevance worker

Prepared 22 October 2026. This directory contains an executable RunPod queue handler, deployment recipe and a deliberately small synthetic smoke evaluation. Local contract tests do **not** establish a built container, deployed endpoint or live GPU result. Record those separately after execution.

## Responsibility

The worker embeds one bounded public passage and a fixed inspection query with `BAAI/bge-large-en-v1.5`. It returns a cosine similarity plus source, exact-text, model and preprocessing provenance. It has no worker profile, qualification, role, recommendation, database or publishing access. A score never approves a mapping, adjusts a skill weight or changes a plan. Role ranking remains deterministic and evidence publication requires review.

The protocol is defined once in `contract.json`, read by both the TypeScript adapter and Python handler. It limits input to 12–2000 Unicode characters and tokenisation to 512 tokens. BGE query instructions, CLS pooling and L2 normalization are explicit; the passage is not instructed. Source text beyond these limits is not assessed. Cosine similarity is not a probability, truth score or occupational-readiness score. No universal 0.65 cutoff is used.

The worker accepts only the specified public evidence fields, requires matching SHA-256 text integrity and model revision, rejects nonfinite scores and refuses CPU fallback. `device: cuda` is checked from the output tensor. This is software provenance, not hardware attestation; retain the actual provider job record as additional execution evidence.

## Offline checks

From the repository root, run:

```console
python -m unittest discover -s runpod -p "test_*.py" -v
python runpod/evaluate.py --output runpod/results/dry-run.json
```

These commands use the Python standard library. They do not install a model, contact RunPod or spend credits. The dry-run report has `mode: dry-run`, `score: null` and no performance conclusion.

## Deploy using RunPod's GitHub build

RunPod supports building and storing the container directly from a connected GitHub repository; a local Docker installation or personal Docker Hub registry is unnecessary. Connect only the repository needed for this project. Select its branch and **Dockerfile path `runpod/Dockerfile`**, with the **repository root as the build context**. Use a **Queue** endpoint. See the [official GitHub integration guide](https://docs.runpod.io/serverless/workers/github-integration).

The Dockerfile pins the official PyTorch 2.13.0/CUDA 12.6 image by digest. See [the 23 October security update](SECURITY_UPDATE.md) for the dependency remediation, local compatibility evidence and remaining container checks. Direct Python worker dependencies are version-pinned in `requirements.txt`; transitive dependency hashes are not yet frozen. The checked model revision is `d4aa6901d3a41ba39fb536a557fa166f842b0e09`, retrieved from the model publisher's API on 22 October 2026. This is the worker's default; use the same value in the app's `RUNPOD_MODEL_REVISION` secret setting. Set it explicitly on the endpoint as well. Never set `main` or load arbitrary remote model code. The build downloads only this revision's config, tokenizer and safetensors into the image, so model downloads do not consume the GPU request window. A model revision change requires a new reviewed image build.

The base uses Ubuntu's externally managed Python 3.12. Worker dependencies install into the fully isolated `/opt/shiftbridge-venv`. The build installs exact Torch `2.13.0+cu126` from the [official CUDA 12.6 wheel index](https://download.pytorch.org/whl/cu126/torch/), verifies that Torch is inside the venv, checks CUDA `12.6` and every direct dependency pin, then prints the installed versions. This avoids the incompatible Click requirement of the base image's `spin` development tool without changing protected system packages or disabling `pip check`. The extra Torch download happens during the image build, not a GPU request. See the [official PyTorch image recipe](https://github.com/pytorch/pytorch/blob/v2.13.0/Dockerfile) and [Python virtual-environment documentation](https://docs.python.org/3/library/venv.html).

For a small demonstration, start with active workers **0**, maximum workers **1**, one **16 GB GPU**, idle timeout **5 seconds**, execution timeout **120 seconds** and job TTL **600 seconds**. Inspect the account's current GPU price and remaining credit before creating the endpoint. The concurrency cap is **not** an account spending cap. Active workers above zero incur continuous idle charges. Do not add a paid network volume, automatic top-up or higher-priced GPU fallback without checking the available budget. See [endpoint settings](https://docs.runpod.io/serverless/endpoints/endpoint-configurations).

The handler prefers the baked model. Optionally select `BAAI/bge-large-en-v1.5` in the endpoint's Model field to use the provider's cached model, but that cache is accepted only when its **exact pinned revision**, safetensors and tokenizer exist. It never silently switches to the latest cached revision. If neither exact baked nor exact cached files exist, the worker fails with an explicit configuration error; **runtime downloads are disabled**. Image loading can still cause a cold start; inspect it instead of repeatedly resubmitting. This trades a larger image/build for predictable request behavior on the small demonstration budget. See [cached models](https://docs.runpod.io/serverless/endpoints/model-caching).

Use a restricted RunPod API key for the application where account controls allow it. Store the key only in private environment/Secrets settings, never in the repository, screenshots, browser client or this directory. Configure the app's `RUNPOD_API_KEY`, `RUNPOD_ENDPOINT_ID`, `RUNPOD_MODEL_REVISION` and team `ADMIN_TOKEN`. An isolated public demonstration session does not authorise GPU spending. Actual inference runs from an authenticated team session in the normal workspace; rehearsal keeps GPU calls disabled.

## First live validation

1. Confirm the container build succeeded and the endpoint settings match the small-budget configuration. A configuration screen alone does not prove inference works.
2. Run one small public-source request from the app. Poll the returned job; do not submit a second job while the first outcome is uncertain. The API only accepts a matching model/revision/query/preprocessing/source hash/text hash/CUDA result. It displays provider failure honestly and leaves published plans unchanged.
3. Check the actual usage charged. If the single result succeeds within budget, run the six declared synthetic cases below. Inspect failed or uncertain jobs in the RunPod Requests tab before continuing.
4. Capture the endpoint job ID, genuine completed provider status, model revision, elapsed times, GPU result and application review flow. Do not expose the API key. Check that leaving the page and returning does not launch a new paid job.
5. Confirm maximum workers is still one and active workers remains zero when the demonstration ends.

## Synthetic triage smoke evaluation

`evaluation-cases.json` contains six hand-authored examples: two directly relevant, two ambiguous and two unrelated. They are clearly synthetic and are never inserted as real sources. The proposed ranking check is that both directly relevant examples score above both unrelated examples. Ambiguous passages always require human review. This tiny authored set cannot establish accuracy, a production threshold, generalisation or worker outcomes.

Set the same three RunPod environment variables privately. Then, only when ready to spend a bounded amount of the authorised credits:

```console
python runpod/evaluate.py --confirm-paid --max-cases 1 --output runpod/results/first-live.json
python runpod/evaluate.py --confirm-paid --max-cases 6 --output runpod/results/six-live.json
```

The second command is optional after inspecting the first job and balance. Each invocation submits **at most** the requested number of sequential jobs; it never retries a POST. The runner persists submission intent before requesting, stores known job IDs immediately, checks provenance on every completed output, stops after a failure/uncertain result and refuses to overwrite an existing report. A known job still pending after its poll window must be inspected in RunPod; do not treat a timeout as proof that it was never billed. No scores are fabricated for unfinished cases. Actual cost comes from provider usage, not the report. See [request lifecycle and duplicate-job cautions](https://docs.runpod.io/serverless/endpoints/send-requests).

Retain the report even if the hypothesis fails. That is useful evidence for improving triage and for explaining why review remains necessary. A successful result on these fixtures remains a smoke result, not a general performance claim. The [model publisher's card](https://huggingface.co/BAAI/bge-large-en-v1.5) recommends task-specific calibration instead of interpreting absolute similarity as semantic truth.

## Remaining proof

- Successful remote container build and availability of the pinned model on the selected GPU.
- Real completed job and matching output accepted by the app.
- Authentic tiny-corpus results and actual provider usage.
- Review of dependencies/container and stronger identity, retention and operational controls before commercial use.

Neither this worker nor AI assistance during development proves the competition's sponsor requirements were met; use the organiser's current rules and retain actual platform evidence.
