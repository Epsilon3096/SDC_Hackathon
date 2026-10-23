import json
from pathlib import Path
import unittest

from contract import CONTRACT, result_for
from evaluate import comparison, make_input, valid_output


class EvaluationTests(unittest.TestCase):
    def test_all_six_declared_fixtures_produce_bounded_valid_inputs(self):
        corpus = json.loads(Path(__file__).with_name("evaluation-cases.json").read_text(encoding="utf-8"))
        cases = corpus["cases"]
        self.assertEqual(len(cases), 6)
        self.assertEqual(len({case["id"] for case in cases}), 6)
        self.assertEqual(sorted(case["group"] for case in cases), ["ambiguous", "ambiguous", "relevant", "relevant", "unrelated", "unrelated"])
        for case in cases:
            value = make_input(case, CONTRACT["defaultRevision"])
            self.assertLessEqual(len(value["text"]), 2000)
            self.assertIn("synthetic", case["text"].lower())

    def test_mock_outputs_are_accepted_only_with_matching_provenance(self):
        case = {"id": "fixture", "text": "Synthetic evaluation public text."}
        value = make_input(case, CONTRACT["defaultRevision"])
        result = result_for(value, 0.2, "cuda")
        self.assertTrue(valid_output(result, value))
        for change in ({"device": "cpu"}, {"score": True}, {"score": float("nan")}, {"text_hash": "wrong"}, {"revision": "wrong"}):
            self.assertFalse(valid_output(result | change, value))
        self.assertFalse(valid_output(None, value))

    def test_partial_or_dry_runs_do_not_create_a_performance_result(self):
        self.assertEqual(comparison([])["status"], "not-evaluated")
        partial = [{"group": group, "status": "not-run", "score": None} for group in ["relevant", "relevant", "unrelated", "unrelated"]]
        self.assertEqual(comparison(partial)["status"], "not-evaluated")

    def test_comparison_reports_missed_hypothesis_and_never_promotes_ambiguous_cases(self):
        rows = [{"group": group, "status": "completed", "score": score} for group, score in [
            ("relevant", .7), ("relevant", .6), ("unrelated", .5), ("unrelated", .8), ("ambiguous", .99)]]
        result = comparison(rows)
        self.assertEqual(result["relevantAboveUnrelatedPairs"], 2)
        self.assertEqual(result["pairs"], 4)
        self.assertFalse(result["hypothesisMetOnTheseFixtures"])
        self.assertIn("not classification accuracy", result["limitation"])


if __name__ == "__main__":
    unittest.main()
