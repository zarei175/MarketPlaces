#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""اعتبارسنج ساختار brain پروژه — فقط‌خواندنی؛ بدون شبکه و بدون وابستگی بیرونی.

منبع: اسکیل سراسری brain-init (بومی‌سازی ایده validate_brain.py از قالب
AiTooltip/company-brain — تصمیم 2026-10-08). چرخه اجرا: بعد از هر تغییر در
AGENTS.md یا هر فایل .brain/ (بخش ۳ OPERATING-SYSTEM.md و قاعده ۵ AGENTS.md).

اجرا:  python .brain/validate_brain.py
خروجی: 0 = سالم (هشدارها جدا گزارش می‌شوند) | 2 = خطای ساختاری (اصلاح لازم)

حریم خصوصی: هیچ محتوایی از فایل‌های داده چاپ نمی‌شود — فقط نام فایل،
شماره خط و شمارنده‌ها.
"""
from __future__ import annotations

import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRAIN = ROOT / ".brain"
WORKFLOWS_DIR = BRAIN / "WORKFLOWS"
INBOX_DIR = ROOT / "00-INBOX"

CORE_FILES = [
    ROOT / "AGENTS.md",
    BRAIN / "OPERATING-SYSTEM.md",
    BRAIN / "DECISIONS.md",
    BRAIN / "FACTS.md",
    BRAIN / "WORKFLOWS" / "README.md",
    INBOX_DIR / "README.md",
]

WORKFLOW_REF = re.compile(r"WORKFLOWS/([A-Za-z0-9_-]+)\.md")
ROW_DATE = re.compile(r"^- \[\d{4}-\d{2}-\d{2}\]")
STATUS_MARK = re.compile(r"^[\s\-*]*وضعیت[\s\-*]*:")
OPEN_MARKS = ("باید تکمیل",)
DECISIONS_PLACEHOLDER = "تصمیم بعدی اینجا"

errors: list[str] = []
warns: list[str] = []


def read(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def scan_targets() -> list[Path]:
    files = [ROOT / "AGENTS.md", *BRAIN.glob("*.md"), *BRAIN.glob("WORKFLOWS/*.md"), *BRAIN.glob("TEMPLATES/*.md")]
    return [p for p in files if p.is_file()]


def check_core() -> None:
    missing = [p for p in CORE_FILES if not p.is_file()]
    for p in missing:
        errors.append(f"فایل هسته غایب: {p.relative_to(ROOT)}")
    if WORKFLOWS_DIR.is_dir():
        print("ok  پوشه WORKFLOWS موجود است")
    else:
        errors.append("پوشه .brain/WORKFLOWS/ وجود ندارد")
    state = "همه موجودند" if not missing else f"{len(missing)} مورد غایب"
    print(f"{'ok' if not missing else '!!'}  {len(CORE_FILES)} فایل هسته: {state}")


def check_references() -> None:
    wf_refs: dict[str, set[str]] = {}
    for p in scan_targets():
        rel = str(p.relative_to(ROOT))
        for m in WORKFLOW_REF.finditer(read(p)):
            wf_refs.setdefault(m.group(1), set()).add(rel)
    bad = [n for n in sorted(wf_refs) if not (WORKFLOWS_DIR / f"{n}.md").is_file()]
    if bad:
        for n in bad:
            errors.append(f"ورک‌فلوی ارجاع‌شده WORKFLOWS/{n}.md وجود ندارد (ارجاع در: {'، '.join(sorted(wf_refs[n]))})")
    print(f"{'ok' if not bad else '!!'}  {len(wf_refs)} ارجاع WORKFLOWS بررسی شد ({len(bad)} شکسته)")


def check_decisions() -> None:
    lines = read(BRAIN / "DECISIONS.md").splitlines()
    rows = [(i, ln) for i, ln in enumerate(lines, 1) if ln.startswith("- [")]
    bad = [i for i, ln in rows if not ROW_DATE.match(ln)]
    if bad:
        errors.append(f"DECISIONS.md: ردیف با فرمت تاریخ نامعتبر در خط‌های {', '.join(map(str, bad))}")
    non_empty = [ln for ln in lines if ln.strip()]
    tail_ok = bool(non_empty) and DECISIONS_PLACEHOLDER in non_empty[-1]
    if not tail_ok:
        warns.append(f"DECISIONS.md: نشانگر «{DECISIONS_PLACEHOLDER}…» آخرین خط نیست")
    print(f"{'ok' if not bad else '!!'}  {len(rows)} ردیف DECISIONS بررسی شد (فرمت {'درست' if not bad else 'نادرست'})")
    print(f"{'ok' if tail_ok else '??'}  نشانگر انتهای لاگ DECISIONS: {'سر جای خودش' if tail_ok else 'غایب از انتها'}")


def check_inbox() -> None:
    no_status = [p.name for p in sorted(INBOX_DIR.glob("*.md")) if p.name != "README.md" and not any(STATUS_MARK.match(ln) for ln in read(p).splitlines())]
    if no_status:
        warns.append(f"{len(no_status)} فایل INBOX خط وضعیت استاندارد ندارند: {'، '.join(no_status)}")
    total = max(0, len(list(INBOX_DIR.glob('*.md'))) - 1)
    print(f"{'ok' if not no_status else '??'}  فایل‌های INBOX: {total} مورد بررسی شد ({len(no_status)} بدون وضعیت)")


def check_facts() -> None:
    lines = read(BRAIN / "FACTS.md").splitlines()
    open_lines = [i for i, ln in enumerate(lines, 1) if any(mk in ln for mk in OPEN_MARKS)]
    if open_lines:
        warns.append(f"FACTS.md: {len(open_lines)} جای‌نگهدات باز («باید تکمیل») در خط‌های {', '.join(map(str, open_lines))}")
    print(f"{'ok' if not open_lines else '??'}  FACTS.md: {len(open_lines)} مورد باز")


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    print(f"اعتبارسنج brain — {date.today().isoformat()} | ریشه: {ROOT}")
    print("-" * 62)
    check_core()
    check_references()
    check_decisions()
    check_inbox()
    check_facts()
    print("-" * 62)
    for e in errors:
        print(f"[خطا] {e}")
    for w in warns:
        print(f"[هشدار] {w}")
    print("-" * 62)
    print(f"جمع‌بندی: {len(CORE_FILES) + len(scan_targets())} فایل بررسی شد | {len(errors)} خطا | {len(warns)} هشدار")
    if errors:
        print("خروجی ۲ — اصلاح ساختاری لازم است (تغییر فکت/قاعده فقط با تأیید کاربر).")
        return 2
    print("خروجی ۰ — ساختار brain سالم است.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
