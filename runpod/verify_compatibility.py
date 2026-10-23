"""Explicit local CPU compatibility check; never produces a provider/GPU result."""
import argparse
import hashlib
import importlib.metadata
import json
import math
from pathlib import Path

from contract import CONTRACT


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--download", action="store_true", help="Download the pinned public model for this local check")
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit("Refusing to overwrite a previous verification report")

    import torch
    from huggingface_hub import snapshot_download
    from transformers import AutoConfig, AutoModel, AutoTokenizer

    files = ["config.json", "model.safetensors", "tokenizer.json", "tokenizer_config.json", "special_tokens_map.json", "vocab.txt"]
    if args.download:
        snapshot_download(repo_id=CONTRACT["model"], revision=CONTRACT["defaultRevision"],
                          local_dir=args.model_dir, allow_patterns=files, token=False)
    options = {"revision": CONTRACT["defaultRevision"], "trust_remote_code": False, "local_files_only": True}
    config = AutoConfig.from_pretrained(args.model_dir, **options)
    if config.model_type != "bert":
        raise RuntimeError("The pinned BGE checkpoint must resolve to BERT")
    tokenizer = AutoTokenizer.from_pretrained(args.model_dir, **options)
    model = AutoModel.from_pretrained(args.model_dir, use_safetensors=True, **options).to("cpu").eval()
    torch.set_num_threads(min(4, torch.get_num_threads()))
    # Same inputs and pooling operations as the production handler, explicitly on CPU.
    text = "Synthetic compatibility check: automated optical inspection flags manufacturing surface defects for human quality review."
    encoded = tokenizer([CONTRACT["queryInstruction"] + CONTRACT["query"], text],
                        padding=True, truncation=True, max_length=CONTRACT["maxTokens"], return_tensors="pt")
    with torch.inference_mode():
        pooled = model(**encoded).last_hidden_state[:, 0]
        embeddings = torch.nn.functional.normalize(pooled, p=2, dim=1)
        score = float((embeddings[0] @ embeddings[1]).item())
    if embeddings.device.type != "cpu" or not math.isfinite(score) or not -1.000001 <= score <= 1.000001:
        raise RuntimeError("CPU compatibility computation failed")
    if not torch.allclose(embeddings.norm(dim=1), torch.ones(2), atol=1e-5):
        raise RuntimeError("Embedding normalization no longer matches the contract")
    bounded = tokenizer([text * 100], truncation=True, max_length=CONTRACT["maxTokens"], return_tensors="pt")
    if bounded["input_ids"].shape[1] != CONTRACT["maxTokens"]:
        raise RuntimeError("Tokenizer truncation no longer matches the contract")
    from handler import load_runtime
    cuda_guard = "not checked on a CUDA host"
    if not torch.cuda.is_available():
        try:
            load_runtime()
        except RuntimeError as error:
            if "requires a CUDA GPU" not in str(error):
                raise
            cuda_guard = "production handler refused CPU fallback"
        else:
            raise RuntimeError("Production worker unexpectedly accepted CPU fallback")
    model_hash = hashlib.sha256()
    with (args.model_dir / "model.safetensors").open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            model_hash.update(chunk)
    report = {
        "mode": "local-cpu-compatibility-only", "device": "cpu", "gpuValidated": False,
        "model": CONTRACT["model"], "revision": CONTRACT["defaultRevision"], "preprocessing": CONTRACT["preprocessing"],
        "modelClass": type(model).__name__, "tokenizerClass": type(tokenizer).__name__,
        "embeddingShape": list(embeddings.shape), "normalized": bool(torch.allclose(embeddings.norm(dim=1), torch.ones(2), atol=1e-5)),
        "syntheticCosine": score, "boundedTokens": bounded["input_ids"].shape[1], "cudaGuard": cuda_guard,
        "modelSafetensorsSha256": model_hash.hexdigest(),
        "versions": {name: importlib.metadata.version(name) for name in ("torch", "transformers", "huggingface-hub", "safetensors", "certifi", "runpod")},
        "limits": "API/model compatibility smoke only. No RunPod job, CUDA result, accuracy or security certification.",
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
