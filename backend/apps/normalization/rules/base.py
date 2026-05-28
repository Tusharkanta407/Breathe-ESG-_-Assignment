from dataclasses import dataclass


@dataclass
class RuleResult:
    issue_code: str
    message: str
    severity: str
    is_blocking: bool
