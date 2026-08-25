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
    "  type HadithKnowledgeEntry,\n  type QaKnowledgeEntry,",
    "  type HadithKnowledgeEntry,\n  type IslamicKnowledgeEntry,\n  type QaKnowledgeEntry,",
)
replace_once(
    "src/domain/islamicKnowledgeStage7.test.ts",
    "const requiredMadhhabs = ['hanafi', 'maliki', 'shafii', 'hanbali'] as const;",
    "const catalogue: readonly IslamicKnowledgeEntry[] = islamicKnowledgeEntries;\nconst requiredMadhhabs = ['hanafi', 'maliki', 'shafii', 'hanbali'] as const;",
)
replace_once(
    "src/domain/islamicKnowledgeStage7.test.ts",
    "const hadithEntries = islamicKnowledgeEntries.filter(",
    "const hadithEntries = catalogue.filter(",
)
replace_once(
    "src/domain/islamicKnowledgeStage7.test.ts",
    "const fiqhEntries = islamicKnowledgeEntries.filter(",
    "const fiqhEntries = catalogue.filter(",
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
