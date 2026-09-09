#!/usr/bin/env python3
"""Validate repository-local agent skill provenance metadata."""

from __future__ import annotations

import re
import sys
from pathlib import Path


START_MARKER = "<!-- agent-sources:start -->"
END_MARKER = "<!-- agent-sources:end -->"
HEADERS = [
    "Skill",
    "Classification",
    "Source repository",
    "Source path",
    "Source revision",
    "License",
    "Local adaptations",
    "Distribution",
    "Update policy",
]
CLASSIFICATIONS = {"upstream-adapted", "internal-adapted", "local"}
SHA_PATTERN = re.compile(r"^[0-9a-f]{40}$")


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    errors: list[str] = []

    records = parse_manifest(root, errors)
    actual_skills = discover_skills(root)
    recorded_skills = [record["Skill"] for record in records]

    find_duplicate_records(recorded_skills, errors)
    compare_inventory(actual_skills, set(recorded_skills), errors)
    validate_records(records, errors)
    validate_notices(root, records, errors)
    validate_agents_routing(root, actual_skills, errors)
    validate_policy_text(root, errors)

    if errors:
        for error in errors:
            print(f"Agent source validation failed: {error}", file=sys.stderr)
        return 1

    print(
        f"Validated {len(records)} agent skill provenance record(s) under {root}."
    )
    return 0


def parse_manifest(root: Path, errors: list[str]) -> list[dict[str, str]]:
    manifest = root / ".agents" / "SOURCES.md"
    if not manifest.is_file() or manifest.stat().st_size == 0:
        errors.append(".agents/SOURCES.md is missing or empty")
        return []

    text = manifest.read_text(encoding="utf-8")
    if START_MARKER not in text or END_MARKER not in text:
        errors.append(".agents/SOURCES.md is missing provenance table markers")
        return []

    table_text = text.split(START_MARKER, 1)[1].split(END_MARKER, 1)[0]
    rows = [parse_table_row(line) for line in table_text.splitlines()]
    rows = [row for row in rows if row]

    if len(rows) < 2:
        errors.append(".agents/SOURCES.md provenance table has no records")
        return []

    if rows[0] != HEADERS:
        errors.append(
            f".agents/SOURCES.md provenance table headers are {rows[0]}, expected {HEADERS}"
        )

    records: list[dict[str, str]] = []
    for row in rows[2:]:
        if len(row) != len(HEADERS):
            errors.append(f"Malformed provenance row: {' | '.join(row)}")
            continue

        records.append(dict(zip(HEADERS, row)))

    return records


def parse_table_row(line: str) -> list[str] | None:
    stripped = line.strip()
    if not stripped.startswith("|") or not stripped.endswith("|"):
        return None

    return [cell.strip() for cell in stripped.strip("|").split("|")]


def discover_skills(root: Path) -> set[str]:
    skills_root = root / ".agents" / "skills"
    if not skills_root.is_dir():
        return set()

    return {
        path.parent.name
        for path in skills_root.glob("*/SKILL.md")
        if path.is_file() and path.stat().st_size > 0
    }


def find_duplicate_records(recorded_skills: list[str], errors: list[str]) -> None:
    seen: set[str] = set()
    for skill in recorded_skills:
        if skill in seen:
            errors.append(f"Duplicate provenance record for skill: {skill}")
        seen.add(skill)


def compare_inventory(
    actual_skills: set[str],
    recorded_skills: set[str],
    errors: list[str],
) -> None:
    missing = actual_skills - recorded_skills
    stale = recorded_skills - actual_skills

    for skill in sorted(missing):
        errors.append(f"Missing provenance record for local skill: {skill}")

    for skill in sorted(stale):
        errors.append(f"Stale provenance record references nonexistent skill: {skill}")


def validate_records(records: list[dict[str, str]], errors: list[str]) -> None:
    for record in records:
        skill = record["Skill"]
        classification = record["Classification"]
        source_repository = record["Source repository"]
        source_path = record["Source path"]
        source_revision = record["Source revision"]
        distribution = record["Distribution"]

        if classification not in CLASSIFICATIONS:
            errors.append(f"{skill} has invalid classification: {classification}")

        if distribution != "emitted":
            errors.append(f"{skill} distribution must be 'emitted'")

        if classification != "local":
            require_established_source(skill, source_repository, source_path, errors)

        if source_revision != "not established" and not SHA_PATTERN.match(source_revision):
            errors.append(
                f"{skill} source revision must be a 40-character SHA or 'not established'"
            )

        if classification == "local" and source_repository != "this repository":
            errors.append(f"{skill} is local but source repository is not this repository")


def require_established_source(
    skill: str,
    source_repository: str,
    source_path: str,
    errors: list[str],
) -> None:
    if source_repository in {"unknown", "not established", ""}:
        errors.append(f"{skill} adapted source repository is not established")

    if source_path in {"unknown", "not established", ""}:
        errors.append(f"{skill} adapted source path is not established")


def validate_notices(
    root: Path,
    records: list[dict[str, str]],
    errors: list[str],
) -> None:
    notices = root / ".agents" / "THIRD-PARTY-NOTICES.md"
    if not notices.is_file() or notices.stat().st_size == 0:
        errors.append(".agents/THIRD-PARTY-NOTICES.md is missing or empty")
        return

    text = notices.read_text(encoding="utf-8")
    upstream_skills = [
        record["Skill"]
        for record in records
        if record["Classification"] == "upstream-adapted"
    ]

    for skill in upstream_skills:
        if f"`{skill}`" not in text:
            errors.append(f"Third-party notices do not mention upstream skill: {skill}")

    local_or_internal_skills = [
        record["Skill"]
        for record in records
        if record["Classification"] != "upstream-adapted"
    ]
    for skill in local_or_internal_skills:
        if f"`{skill}`" in text:
            errors.append(
                f"Third-party notices incorrectly attribute non-upstream skill: {skill}"
            )

    if upstream_skills and "The MIT License (MIT)" not in text:
        errors.append("Third-party notices must include the MIT license text")

    if upstream_skills and ".NET Foundation and Contributors" not in text:
        errors.append("Third-party notices must attribute .NET Foundation material")


def validate_agents_routing(
    root: Path,
    actual_skills: set[str],
    errors: list[str],
) -> None:
    agents = root / "AGENTS.md"
    if not agents.is_file() or agents.stat().st_size == 0:
        errors.append("AGENTS.md is missing or empty")
        return

    text = agents.read_text(encoding="utf-8")
    for skill in sorted(actual_skills):
        if skill not in text:
            errors.append(f"AGENTS.md does not route local skill: {skill}")

    if ".agents/SOURCES.md" not in text:
        errors.append("AGENTS.md does not link to .agents/SOURCES.md")


def validate_policy_text(root: Path, errors: list[str]) -> None:
    manifest_path = root / ".agents" / "SOURCES.md"
    if not manifest_path.is_file():
        return

    manifest = manifest_path.read_text(encoding="utf-8")
    required_phrases = [
        "repository-local skills are authoritative",
        "immutable commit SHAs",
        "manual review",
        "no unattended upstream synchronization",
        "external plugins are optional",
    ]

    for phrase in required_phrases:
        if phrase not in manifest:
            errors.append(f".agents/SOURCES.md is missing policy phrase: {phrase}")


if __name__ == "__main__":
    raise SystemExit(main())
