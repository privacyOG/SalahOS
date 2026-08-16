from pathlib import Path


path = Path("src/styles.css")
css = path.read_text()
replacements = {
    "  color: #9eae9b;": "  color: var(--muted);",
    "  color: #c5e0be;": "  color: var(--accent);",
    "  border-block-start: 1px solid rgba(255, 255, 255, 0.08);": "  border-block-start: 1px solid var(--divider);",
    "  background: rgba(197, 224, 190, 0.07);": "  background: color-mix(in srgb, var(--accent) 7%, transparent);",
    "  color: #c2cdc0;": "  color: var(--muted);",
    "  border: 1px solid rgba(255, 255, 255, 0.08);": "  border: 1px solid var(--card-border);",
    "  background: rgba(255, 255, 255, 0.025);": "  background: color-mix(in srgb, var(--text) 2.5%, transparent);",
    "  color: #aeb9ac;": "  color: var(--muted);",
}
for old, new in replacements.items():
    if old not in css:
        raise RuntimeError(f"Missing readability token marker: {old}")
    css = css.replace(old, new)
path.write_text(css)
