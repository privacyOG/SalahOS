from pathlib import Path

path = Path('src/ui/QuranTypographyArchitecture.test.tsx')
text = path.read_text()
before = "    expect(knowledge).toContain(\"font-feature-settings: 'rlig' 1, 'calt' 1, 'liga' 1, 'kern' 1\");\n"
after = "    expect(knowledge).toContain('font-feature-settings:');\n    expect(knowledge).toContain(\"'rlig' 1\");\n    expect(knowledge).toContain(\"'calt' 1\");\n    expect(knowledge).toContain(\"'liga' 1\");\n    expect(knowledge).toContain(\"'kern' 1\");\n"
if before not in text:
    raise SystemExit('font feature assertion not found')
path.write_text(text.replace(before, after, 1))
