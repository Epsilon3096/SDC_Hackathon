"""Small, dependency-free validation shared by the worker and offline tests."""
import hashlib
import json
import math
import re
from pathlib import Path

CONTRACT = json.loads(Path(__file__).with_name("contract.json").read_text(encoding="utf-8"))


def validate_input(value, revision):
    if not isinstance(revision, str) or not re.fullmatch(r"[0-9a-f]{40}", revision):
        raise ValueError("The worker needs a pinned lowercase model revision")
    expected = {"source_hash", "text_hash", "text", "query", "model", "revision", "preprocessing"}
    if not isinstance(value, dict) or set(value) != expected:
        raise ValueError("Expected only the bounded public evidence fields")
    for key in ("model", "query", "preprocessing"):
        if value[key] != CONTRACT[key]:
            raise ValueError("Unsupported " + key)
    if value["revision"] != revision:
        raise ValueError("Input revision differs from the deployed worker")
    for key in ("source_hash", "text_hash"):
        if not isinstance(value[key], str) or not re.fullmatch(r"[0-9a-f]{64}", value[key]):
            raise ValueError("Invalid " + key)
    text = value["text"]
    if not isinstance(text, str) or len(text.strip()) < CONTRACT["minCharacters"] or len(text) > CONTRACT["maxCharacters"]:
        raise ValueError("Evidence text must contain 12 to 2000 Unicode characters")
    try:
        actual_hash = hashlib.sha256(text.encode("utf-8", errors="strict")).hexdigest()
    except UnicodeEncodeError as exc:
        raise ValueError("Evidence text contains an invalid Unicode surrogate") from exc
    if actual_hash != value["text_hash"]:
        raise ValueError("Evidence text does not match its content hash")
    return dict(value)


def result_for(value, score, device):
    # Never report a CPU or invented result as RunPod GPU execution.
    if device != "cuda":
        raise ValueError("CUDA execution is required")
    if isinstance(score, bool) or not isinstance(score, (float, int)) or not math.isfinite(score) or not -1 <= score <= 1:
        raise ValueError("Model returned an invalid cosine similarity")
    return {key: value[key] for key in ("source_hash", "text_hash", "query", "model", "revision", "preprocessing")} | {
        "score": float(score), "device": device,
    }
