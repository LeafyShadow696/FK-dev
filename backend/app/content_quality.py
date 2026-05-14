from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class ContentQualityIssue:
    severity: str
    code: str
    message: str


@dataclass(frozen=True)
class ContentQualityResult:
    status: str
    issues: list[ContentQualityIssue]


BLOCKED_CLAIMS = [
    "garantovan",
    "zaručen",
    "100%",
    "nejlepší na trhu",
    "bez rizika",
    "okamžitě vyděl",
]


def check_content_quality(value: str) -> ContentQualityResult:
    text = value.strip()
    issues: list[ContentQualityIssue] = []

    if len(text) < 40:
        issues.append(
            ContentQualityIssue(
                severity="blocker",
                code="too_short",
                message="Text je příliš krátký pro samostatně publikovaný blok.",
            ),
        )

    if len(text) > 900:
        issues.append(
            ContentQualityIssue(
                severity="blocker",
                code="too_long",
                message="Text je příliš dlouhý pro tento typ landing-page bloku.",
            ),
        )

    normalized = text.lower()

    for claim in BLOCKED_CLAIMS:
        if claim in normalized:
            issues.append(
                ContentQualityIssue(
                    severity="blocker",
                    code="unsupported_claim",
                    message="Text obsahuje absolutní nebo těžko doložitelný slib.",
                ),
            )
            break

    if re.search(r"\s{2,}", text):
        issues.append(
            ContentQualityIssue(
                severity="warning",
                code="extra_spacing",
                message="Text obsahuje opakované mezery nebo nestandardní odsazení.",
            ),
        )

    if text and text[-1] not in ".!?":
        issues.append(
            ContentQualityIssue(
                severity="warning",
                code="missing_terminal_punctuation",
                message="Text by měl končit tečkou, otazníkem nebo vykřičníkem.",
            ),
        )

    if len(text.split()) > 45:
        issues.append(
            ContentQualityIssue(
                severity="warning",
                code="dense_sentence",
                message="Text je delší; zvažte kratší větu nebo rozdělení na dva bloky.",
            ),
        )

    if any(issue.severity == "blocker" for issue in issues):
        status = "blocked"
    elif issues:
        status = "warning"
    else:
        status = "passed"

    return ContentQualityResult(status=status, issues=issues)
