#!/usr/bin/env python3
"""Build a reproducible source-only release; never include local worker data.

Run --scan-only while preparing a release. After committing verified source,
pass --output PATH.zip. The archive contains files at its root for Replit import.
This scan is a precaution, not a certification that arbitrary files contain no secrets.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
import zipfile


ROOT = Path(__file__).resolve().parents[1]
ROOT_FILES = {
    ".env.example", ".gitignore", ".replit", ".dockerignore", "Dockerfile",
    "index.html", "LICENSE", "README.md", "package.json", "package-lock.json",
    "tsconfig.json", "vite.config.ts",
}
SOURCE_DIRS = {".github", "docs", "public", "runpod", "scripts", "src", "tests"}
EXCLUDED_PARTS = {
    ".git", ".data", "node_modules", "dist", "coverage", "test-results",
    "playwright-report", "__pycache__", ".venv", "venv", ".cache", "results",
    "private", "secrets", "uploads", "backups",
}
EXCLUDED_SUFFIXES = {
    ".pdf", ".ppt", ".pptx", ".doc", ".docx", ".xls", ".xlsx", ".zip",
    ".tar", ".gz", ".sqlite", ".sqlite3", ".db", ".dump", ".log", ".pyc",
    ".pem", ".key", ".p12", ".pfx", ".crt", ".bak", ".tmp",
}
TEXT_SUFFIXES = {
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".json",
    ".html", ".md", ".txt", ".csv", ".yml", ".yaml", ".py", ".toml",
    ".svg", ".xml", ".sh", ".ps1",
}
PUBLIC_BINARY_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".ico", ".woff", ".woff2"}
SECRET_PATTERNS = (
    ("private key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
    ("provider token", re.compile(r"(?<![A-Za-z0-9])(?:sk-[A-Za-z0-9_-]{24,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|rpa_[A-Za-z0-9_-]{24,})")),
    ("email address", re.compile(r"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b")),
    ("contact phone number", re.compile(r"(?<![\w.])\+?60[ -]?1[0-9](?:[ -]?[0-9]){7,8}(?![\w.])")),
)


def git(*args: str) -> bytes:
    return subprocess.check_output(["git", *args], cwd=ROOT, stderr=subprocess.PIPE)


def selected_files() -> tuple[list[str], list[str]]:
    candidates = sorted(set(filter(None, git("ls-files", "-z", "--cached", "--others", "--exclude-standard").decode("utf-8").split("\0"))))
    selected, excluded = [], []
    for name in candidates:
        relative = PurePosixPath(name)
        path = ROOT.joinpath(*relative.parts)
        parts_lower = {part.lower() for part in relative.parts}
        if not path.exists():
            continue  # A deleted tracked path is not silently resurrected.
        if path.is_symlink() or not path.resolve().is_relative_to(ROOT):
            raise ValueError(f"Refusing linked path outside the release source: {name}")
        permitted_root = name in ROOT_FILES or relative.parts[0] in SOURCE_DIRS
        excluded_name = relative.name.startswith(".env") and name != ".env.example"
        if (not permitted_root or parts_lower & EXCLUDED_PARTS or excluded_name
                or relative.suffix.lower() in EXCLUDED_SUFFIXES):
            excluded.append(name)
            continue
        if not path.is_file():
            raise ValueError(f"Expected an ordinary source file: {name}")
        selected.append(name)
    required = {"package.json", "package-lock.json", ".env.example", ".replit", "src/server/index.ts", "src/client/main.tsx", "runpod/Dockerfile"}
    if missing := required.difference(selected):
        raise ValueError("Required source files are missing: " + ", ".join(sorted(missing)))
    return selected, excluded


def scan(names: list[str]) -> tuple[dict[str, bytes], list[str]]:
    contents, failures = {}, []
    for name in names:
        relative = PurePosixPath(name)
        content = ROOT.joinpath(*relative.parts).read_bytes()
        contents[name] = content
        public_binary = relative.parts[0] == "public" and relative.suffix.lower() in PUBLIC_BINARY_SUFFIXES
        if public_binary:
            continue
        if (relative.suffix.lower() not in TEXT_SUFFIXES and name not in ROOT_FILES
                and relative.name not in {"Dockerfile", ".gitignore", ".dockerignore"}):
            failures.append(f"{name}: unrecognised source format; review before adding to the allowlist")
            continue
        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError:
            failures.append(f"{name}: unexpected binary content")
            continue
        for label, pattern in SECRET_PATTERNS:
            if pattern.search(text):
                failures.append(f"{name}: {label} pattern; remove or explicitly review outside this source package")
    return contents, failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scan-only", action="store_true", help="Scan current source, including new untracked files, without writing an archive")
    parser.add_argument("--output", type=Path, help="Output ZIP outside the application source directory; requires a clean checkout")
    args = parser.parse_args()
    if args.scan_only == bool(args.output):
        parser.error("Choose exactly one of --scan-only or --output PATH.zip")
    try:
        selected, excluded = selected_files()
        contents, failures = scan(selected)
        if failures:
            print(json.dumps({"status": "blocked", "files": failures}, indent=2))
            return 1
        print(json.dumps({"status": "source scan passed", "selected_files": len(selected), "excluded_files": excluded,
                          "limitation": "Heuristic text scan; public image/font metadata and unknown secret formats are not certified."}, indent=2))
        if args.scan_only:
            return 0
        if git("status", "--porcelain").strip():
            raise ValueError("Commit the verified source before creating a release archive; scan-only is available while editing.")
        target = args.output.resolve()
        if target.suffix.lower() != ".zip" or target.is_relative_to(ROOT):
            raise ValueError("Output must be a .zip outside the application source directory.")
        manifest_path = target.with_name(target.stem + ".manifest.json")
        if target.exists() or manifest_path.exists():
            raise ValueError("Output archive or manifest already exists. Choose a new release filename to preserve previous evidence.")
        if not target.parent.is_dir():
            raise ValueError("Output parent directory must already exist.")
        commit = git("rev-parse", "HEAD").decode().strip()
        with zipfile.ZipFile(target, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for name in selected:
                info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
                info.create_system = 3
                info.external_attr = 0o100644 << 16
                info.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(info, contents[name], compresslevel=9)
        with zipfile.ZipFile(target) as archive:
            if archive.testzip() is not None or archive.namelist() != selected:
                raise ValueError("Archive integrity check failed; do not distribute this archive.")
            for name in selected:
                if archive.read(name) != contents[name]:
                    raise ValueError(f"Archive content verification failed: {name}")
        manifest = {
            "format": 1,
            "source_commit": commit,
            "clean_checkout": True,
            "archive": target.name,
            "archive_bytes": target.stat().st_size,
            "archive_sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
            "file_count": len(selected),
            "files": [{"path": name, "bytes": len(contents[name]), "sha256": hashlib.sha256(contents[name]).hexdigest()} for name in selected],
            "checks": "Source selection, heuristic secret/contact scan and archive byte verification only. Application/GPU/deployment checks are not run by this script; consult docs/BUILD_STATUS.md.",
            "excluded_files": excluded,
        }
        with manifest_path.open("x", encoding="utf-8", newline="\n") as output:
            output.write(json.dumps(manifest, indent=2) + "\n")
        print(json.dumps({key: value for key, value in manifest.items() if key not in {"files", "excluded_files"}}, indent=2))
        print(f"Manifest: {manifest_path}")
        return 0
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        print(f"Release packaging stopped: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
