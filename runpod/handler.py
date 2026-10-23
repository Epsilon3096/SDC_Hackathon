"""RunPod queue handler: public-text relevance only, never a career decision."""
import os
from functools import lru_cache
from pathlib import Path

from contract import CONTRACT, result_for, validate_input

REVISION = os.environ.get("RUNPOD_MODEL_REVISION", CONTRACT["defaultRevision"])


def model_location(cache_root=Path("/runpod-volume/huggingface-cache/hub"), baked_root=Path("/worker/models")):
    # Never select the first arbitrary snapshot: it could be a different revision.
    cached = cache_root / ("models--" + CONTRACT["model"].replace("/", "--")) / "snapshots" / REVISION
    for exact in (baked_root / REVISION, cached):
        if all((exact / name).is_file() for name in ("config.json", "model.safetensors", "tokenizer_config.json", "vocab.txt")):
            return str(exact)
    raise RuntimeError("Pinned model assets are absent; rebuild the image or configure its exact model cache. Runtime downloads are disabled.")


@lru_cache(maxsize=1)
def load_runtime():
    import torch
    from transformers import AutoModel, AutoTokenizer

    if not torch.cuda.is_available():
        raise RuntimeError("This worker requires a CUDA GPU; CPU fallback is disabled")
    # Fixed repository/revision and safetensors. No user-supplied model or remote code.
    location = model_location()
    options = {"revision": REVISION, "trust_remote_code": False, "local_files_only": True}
    tokenizer = AutoTokenizer.from_pretrained(location, **options)
    model = AutoModel.from_pretrained(location, use_safetensors=True, **options).to("cuda").eval()
    return torch, tokenizer, model


def handler(job):
    value = validate_input(job.get("input") if isinstance(job, dict) else None, REVISION)
    torch, tokenizer, model = load_runtime()
    # BGE recommends an instruction on the query only; documents stay untouched.
    encoded = tokenizer([CONTRACT["queryInstruction"] + value["query"], value["text"]],
                        padding=True, truncation=True, max_length=CONTRACT["maxTokens"], return_tensors="pt")
    encoded = {key: tensor.to("cuda") for key, tensor in encoded.items()}
    with torch.inference_mode():
        pooled = model(**encoded).last_hidden_state[:, 0]
        embeddings = torch.nn.functional.normalize(pooled, p=2, dim=1)
        score = float((embeddings[0] @ embeddings[1]).item())
    # Floating-point rounding can exceed the cosine bounds by a few ulps.
    if -1.000001 <= score <= 1.000001:
        score = min(1.0, max(-1.0, score))
    return result_for(value, score, embeddings.device.type)


if __name__ == "__main__":
    import runpod
    runpod.serverless.start({"handler": handler})
