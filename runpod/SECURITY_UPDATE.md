# Worker dependency update — 23 October 2026

Replit's pre-deployment scan identified vulnerable Python worker dependencies. Although inference runs separately on RunPod, the worker also needed remediation; no findings were ignored and the deployment scan was not disabled.

## Changes and evidence

- `transformers` 4.57.6 → **5.20.2**. [GHSA-fgcw-684q-jj6r](https://github.com/advisories/GHSA-fgcw-684q-jj6r) describes a LightGlue nested configuration path that can override `trust_remote_code=False`; it lists 5.5.0 as patched. [PYSEC-2026-2290](https://osv.dev/vulnerability/PYSEC-2026-2290) instead records a last-affected event at 5.2.0, which explains a scanner displaying no fixed version. GitHub's official compare API confirmed that [the upstream fix](https://github.com/huggingface/transformers/commit/676559d5022b74aaa0cee1cee0842b7f27c5320e) is an ancestor of v5.20.2. BGE uses BERT, but that narrower application path is not a reason to retain the vulnerable package.
- Compatible direct pins: **huggingface-hub 1.31.0** and **safetensors 0.8.0**. These satisfy [Transformers 5.20.2's published requirements](https://pypi.org/pypi/transformers/5.20.2/json). Python 3.10+ and PyTorch 2.6+ are required.
- **certifi 2026.10.19** removes the affected certificate trust entry; [GHSA-6q48-6c7w-9gw2](https://github.com/advisories/GHSA-6q48-6c7w-9gw2) identifies this release as patched. **httpx2 2.16.0** and **httpcore2 2.16.0** are explicitly pinned because earlier transitive versions were reported by the deployment scan.
- PyTorch **2.9.1 → 2.13.0**, using the official Linux/amd64 CUDA 12.6/cuDNN 9 runtime at digest `sha256:6acf597eeb8e376a96580dde4952f37cc017fef732bb40bfc73f28f25e3f64b4`. The official Docker Hub tag and registry manifest digest were independently checked. The older version had known loading, JIT and LSTM advisories; [PyPI's 2.13.0 record](https://pypi.org/pypi/torch/2.13.0/json) had none at this check. Select a RunPod GPU host compatible with CUDA 12.6 and validate the actual container before treating it as ready.
- The shared preprocessing identifier is now **`bge-cls-l2-512-bounded2000-v3`**. Model weights, query, token bound and pooling stay the same, but scores from the older library runtime are not reused or compared as current results.
- Container build checks exposed incompatible package ranges in the base's development tooling: `spin` 0.18 requires Click `<8.4`, while the pinned RunPod and Hugging Face Hub packages require `>=8.4.2`. No Click version can satisfy both. The worker now uses a fully isolated venv, installing exact `torch==2.13.0+cu126` from the [official PyTorch CUDA 12.6 index](https://download.pytorch.org/whl/cu126/torch/). The base digest and security pins remain unchanged; system packages are not modified, and `pip check` remains mandatory. The build asserts the Torch/CUDA versions and verifies Torch is loaded from the venv.

## Verification completed locally

- `pip-audit 2.10.1 --strict -r runpod/requirements.txt`: **109 resolved packages, zero known vulnerabilities**, including transitives. No ignore flags. [Saved report](verification/requirements-audit-2026-10-23.json).
- A separate pinned PyTorch 2.13.0 audit: **zero known vulnerabilities**. [Saved report](verification/torch-audit-2026-10-23.json). This checks the published Python package version, not every component of its container.
- An isolated Windows/Python 3.12 environment installed all worker requirements and PyTorch 2.13.0+cpu. `pip check` found no broken requirements. The real, pinned BGE safetensors checkpoint loaded as `BertModel`; tokenization, 512-token truncation, CLS pooling, L2 normalization and a finite cosine completed successfully. The model file SHA-256 matched the publisher's revision metadata: `45e1954914e29bd74080e6c1510165274ff5279421c89f76c418878732f64ae7`. [CPU compatibility report](verification/cpu-compatibility-2026-10-23.json).
- The production handler still refused CPU fallback. This local check does **not** supply a RunPod job, CUDA evidence, accuracy estimate or factory validation.
- CI now performs a strict worker dependency audit and a separate base PyTorch version audit. A contract test keeps the audited PyTorch version aligned with the Dockerfile. The image build also runs `pip check`.

Reproduce the model compatibility check in an isolated environment with the pinned worker dependencies and PyTorch 2.13.0 CPU installed:

```console
python runpod/verify_compatibility.py --download --model-dir /path/to/model --output /path/to/new-cpu-report.json
```

The script downloads the pinned public model only when `--download` is supplied and refuses to overwrite a previous report.

## Remaining deployment checks

Rebuild the image, verify its actual package versions and run a genuine CUDA request before enabling the new app/worker contract together. Keep older v2 job records as historical evidence. A package advisory check is point-in-time evidence; direct pins do not freeze the entire transitive environment. The Linux image's OS, CUDA/cuDNN and other preinstalled packages still require a separate container scan. Future CI findings must be investigated, not automatically suppressed.
