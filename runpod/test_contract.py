"""Offline protocol checks. These do not download or execute the model."""
import hashlib
import unittest
import tempfile
from pathlib import Path
from unittest.mock import patch

from contract import CONTRACT, result_for, validate_input
from handler import handler, model_location


def sample():
    text = "Synthetic fixture: automated optical inspection flags a manufacturing defect."
    return {"model": CONTRACT["model"], "query": CONTRACT["query"], "preprocessing": CONTRACT["preprocessing"],
            "revision": CONTRACT["defaultRevision"], "source_hash": "a" * 64, "text": text,
            "text_hash": hashlib.sha256(text.encode("utf-8")).hexdigest()}


class ContractTests(unittest.TestCase):
    def test_accepts_matching_input_and_preserves_exact_text(self):
        value = sample()
        self.assertEqual(validate_input(value, value["revision"]), value)

    def test_rejects_bad_or_additional_fields_before_loading_model(self):
        bad_values = [None, [], {}, sample() | {"worker_profile": {"name": "Do not send"}},
                      sample() | {"model": "another/model"}, sample() | {"revision": "main"},
                      sample() | {"query": "Another task"}, sample() | {"preprocessing": "v1"},
                      sample() | {"source_hash": "bad"}, sample() | {"text_hash": "b" * 64},
                      sample() | {"text": ""}, sample() | {"text": " "}, sample() | {"text": "a" * 2001},
                      sample() | {"text": 42}, sample() | {"text": "\ud800"}]
        with patch("handler.load_runtime") as runtime:
            for value in bad_values:
                with self.subTest(value=value), self.assertRaises(ValueError):
                    handler({"input": value})
            runtime.assert_not_called()

    def test_revision_must_be_a_commit(self):
        for revision in (None, "main", "A" * 40, "abc"):
            with self.subTest(revision=revision), self.assertRaises(ValueError):
                validate_input(sample(), revision)

    def test_cached_model_must_match_the_exact_pinned_revision(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            snapshots = root / ("models--" + CONTRACT["model"].replace("/", "--")) / "snapshots"
            wrong = snapshots / ("b" * 40)
            wrong.mkdir(parents=True)
            (wrong / "config.json").write_text("{}", encoding="utf-8")
            (wrong / "model.safetensors").write_bytes(b"fixture")
            with self.assertRaises(RuntimeError):
                model_location(root, root / "baked")
            exact = snapshots / CONTRACT["defaultRevision"]
            exact.mkdir()
            (exact / "config.json").write_text("{}", encoding="utf-8")
            with self.assertRaises(RuntimeError):
                model_location(root, root / "baked")
            (exact / "model.safetensors").write_bytes(b"fixture")
            (exact / "tokenizer_config.json").write_text("{}", encoding="utf-8")
            (exact / "vocab.txt").write_text("fixture", encoding="utf-8")
            self.assertEqual(model_location(root, root / "baked"), str(exact))

    def test_unicode_characters_have_the_same_bound_and_hash_as_node(self):
        value = sample()
        value["text"] = "工😀" * 1000
        value["text_hash"] = hashlib.sha256(value["text"].encode("utf-8")).hexdigest()
        self.assertEqual(len(validate_input(value, value["revision"])["text"]), 2000)

    def test_result_provenance_contains_no_source_text_or_verdict(self):
        value = sample()
        result = result_for(value, 0.72, "cuda")
        self.assertEqual(result["text_hash"], value["text_hash"])
        self.assertEqual(result["score"], 0.72)
        self.assertNotIn("text", result)
        self.assertNotIn("approved", result)

    def test_invalid_scores_or_devices_cannot_be_claimed_as_gpu_results(self):
        for score in (float("nan"), float("inf"), True, "0.72", 1.01, -1.01):
            with self.subTest(score=score), self.assertRaises(ValueError):
                result_for(sample(), score, "cuda")
        for device in ("cpu", "mps", None):
            with self.subTest(device=device), self.assertRaises(ValueError):
                result_for(sample(), 0.72, device)


if __name__ == "__main__":
    unittest.main()
