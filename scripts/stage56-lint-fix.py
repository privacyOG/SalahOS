#!/usr/bin/env python3
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}: {old!r}")
    target.write_text(text.replace(old, new, 1))


replace_once(
    "src/domain/islamicKnowledgeStage7.test.ts",
    "(entry): entry is QaKnowledgeEntry => entry.module === 'qa' && entry.contentType === 'fiqh',",
    "(entry): entry is QaKnowledgeEntry => entry.module === 'qa',",
)
replace_once(
    "src/ui/KnowledgeStage7Details.tsx",
    "onClick={() => onSearchTopic(topic)}",
    "onClick={() => { onSearchTopic(topic); }}",
)
replace_once(
    "src/ui/KnowledgeStage7Details.tsx",
    "onClick={() => onNavigateHadith(relatedEntry.id)}",
    "onClick={() => { onNavigateHadith(relatedEntry.id); }}",
)
