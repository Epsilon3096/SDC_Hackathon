"""Fetch only the pinned model assets during image build, before paid GPU jobs."""
from pathlib import Path

from huggingface_hub import snapshot_download

from contract import CONTRACT


if __name__ == "__main__":
    target = Path("/worker/models") / CONTRACT["defaultRevision"]
    snapshot_download(repo_id=CONTRACT["model"], revision=CONTRACT["defaultRevision"], local_dir=target,
                      allow_patterns=["config.json", "model.safetensors", "tokenizer.json", "tokenizer_config.json", "special_tokens_map.json", "vocab.txt"])
    for required in ("config.json", "model.safetensors", "tokenizer_config.json", "vocab.txt"):
        if not (target / required).is_file():
            raise RuntimeError("Pinned model build is incomplete: " + required)
