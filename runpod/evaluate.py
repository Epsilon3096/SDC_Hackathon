"""Explicit, bounded live smoke evaluation; stdlib only and no automatic POST retry."""
import argparse
import datetime
import hashlib
import json
import math
import os
from pathlib import Path
import re
import time
import urllib.error
import urllib.request

from contract import CONTRACT, validate_input


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        raise urllib.error.HTTPError(request.full_url, code, "Redirect refused", headers, fp)


def stamp():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def make_input(case, revision):
    text = case["text"][:CONTRACT["maxCharacters"]]
    return validate_input({"model": CONTRACT["model"], "revision": revision, "query": CONTRACT["query"],
        "preprocessing": CONTRACT["preprocessing"], "text": text,
        "text_hash": hashlib.sha256(text.encode("utf-8")).hexdigest(),
        "source_hash": hashlib.sha256(("synthetic-evaluation:" + case["id"] + ":" + text).encode("utf-8")).hexdigest()}, revision)


def valid_output(output, value):
    if not isinstance(output, dict):
        return False
    keys = ("source_hash", "text_hash", "query", "model", "revision", "preprocessing")
    score = output.get("score")
    return all(output.get(key) == value[key] for key in keys) and output.get("device") == "cuda" \
        and type(score) in (float, int) and math.isfinite(score) and -1 <= score <= 1


def comparison(results):
    relevant = [row for row in results if row["group"] == "relevant"]
    unrelated = [row for row in results if row["group"] == "unrelated"]
    if len(relevant) != 2 or len(unrelated) != 2 or any(row["status"] != "completed" for row in relevant + unrelated):
        return {"status": "not-evaluated", "reason": "All four direct relevant/unrelated cases need verified live results."}
    pairs = [a["score"] > b["score"] for a in relevant for b in unrelated]
    return {"status": "observed", "relevantAboveUnrelatedPairs": sum(pairs), "pairs": len(pairs),
            "hypothesisMetOnTheseFixtures": all(pairs),
            "limitation": "Constructed smoke cases only. This is not classification accuracy, calibration, worker readiness, or a production benchmark."}


def request_json(opener, key, url, body=None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    request = urllib.request.Request(url, data=data, headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
    with opener.open(request, timeout=20) as response:
        raw = response.read(50001)
        if len(raw) > 50000:
            raise ValueError("Provider response exceeded bound")
        result = json.loads(raw)
        if not isinstance(result, dict):
            raise ValueError("Provider returned a non-object response")
        return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--confirm-paid", action="store_true", help="Submit at most six sequential jobs using configured RunPod credits.")
    parser.add_argument("--max-cases", type=int, default=6, choices=range(1, 7))
    parser.add_argument("--output", required=True, type=Path, help="New JSON report path; existing reports are never overwritten.")
    args = parser.parse_args()
    if args.output.exists():
        parser.error("Report already exists. Inspect its recorded job IDs; do not blindly resubmit.")
    revision = os.environ.get("RUNPOD_MODEL_REVISION", CONTRACT["defaultRevision"])
    corpus = json.loads(Path(__file__).with_name("evaluation-cases.json").read_text(encoding="utf-8"))
    cases = corpus["cases"][:args.max_cases]
    inputs = [make_input(case, revision) for case in cases]
    report = {"schema": "shiftbridge-synthetic-triage-smoke-v1", "startedAt": stamp(), "mode": "live" if args.confirm_paid else "dry-run",
              "purpose": corpus["purpose"], "hypothesis": corpus["hypothesis"], "model": CONTRACT["model"], "revision": revision,
              "preprocessing": CONTRACT["preprocessing"], "query": CONTRACT["query"], "results": [], "billing": "Read actual usage in RunPod; this report does not estimate or certify billed cost."}
    args.output.parent.mkdir(parents=True, exist_ok=True)

    def save():
        report["updatedAt"] = stamp()
        report["comparison"] = comparison(report["results"])
        temp = args.output.with_suffix(args.output.suffix + ".tmp")
        temp.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        temp.replace(args.output)

    endpoint = os.environ.get("RUNPOD_ENDPOINT_ID", "")
    key = os.environ.get("RUNPOD_API_KEY", "").strip()
    if args.confirm_paid and (not key or not re.fullmatch(r"[a-zA-Z0-9-]{1,100}", endpoint)):
        parser.error("Set RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID in the private environment.")
    opener = urllib.request.build_opener(NoRedirect())
    for case, value in zip(cases, inputs):
        row = {"caseId": case["id"], "group": case["group"], "text": case["text"], "textHash": value["text_hash"], "sourceHash": value["source_hash"],
               "status": "submitting" if args.confirm_paid else "not-run", "jobId": None, "score": None,
               "reviewRequired": True}
        report["results"].append(row)
        save()  # Persist intent before a potentially billable network operation.
        if not args.confirm_paid:
            continue
        try:
            response = request_json(opener, key, "https://api.runpod.ai/v2/" + endpoint + "/run", {
                "input": value, "policy": {"executionTimeout": 120000, "ttl": 600000}})
            job_id = response.get("id")
            if not isinstance(job_id, str) or not re.fullmatch(r"[\w-]{1,200}", job_id, flags=re.ASCII):
                raise ValueError("Provider did not acknowledge a valid job ID")
            row.update({"jobId": job_id, "status": "pending"})
            save()
            # Poll a known job only. Never retry POST after an uncertain outcome.
            for _ in range(24):
                time.sleep(5)
                response = request_json(opener, key, "https://api.runpod.ai/v2/" + endpoint + "/status/" + job_id)
                if response.get("id") != job_id:
                    raise ValueError("Provider returned a different job")
                if response.get("status") == "COMPLETED":
                    if not valid_output(response.get("output"), value):
                        raise ValueError("Completed result failed provenance validation")
                    row.update({"status": "completed", "score": response["output"]["score"], "device": "cuda", "completedAt": stamp()})
                    for field in ("delayTime", "executionTime"):
                        duration = response.get(field)
                        if type(duration) in (int, float) and math.isfinite(duration) and duration >= 0:
                            row[field + "Ms"] = duration
                    break
                if response.get("status") in ("FAILED", "CANCELLED", "TIMED_OUT"):
                    row.update({"status": "failed", "providerStatus": response["status"]})
                    break
                if response.get("status") not in ("IN_QUEUE", "IN_PROGRESS"):
                    raise ValueError("Unknown provider status")
            save()
            if row["status"] != "completed":
                break
        except Exception as exc:
            row["status"] = "pending-unverified" if row["jobId"] else "submission-unknown"
            row["error"] = type(exc).__name__ + ": provider outcome must be inspected; no automatic resubmission was attempted."
            save()
            break
    save()
    print(json.dumps({"report": str(args.output), "mode": report["mode"], "cases": len(report["results"]), "completed": sum(row["status"] == "completed" for row in report["results"])}))


if __name__ == "__main__":
    main()
