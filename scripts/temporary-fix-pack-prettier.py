from pathlib import Path

path = Path('scripts/generate-mosque-directory-packs.mjs')
text = path.read_text()
old_import = "import { format } from 'prettier';"
new_import = "import { format, resolveConfig } from 'prettier';"
if old_import not in text:
    raise SystemExit('Expected Prettier import not found')
text = text.replace(old_import, new_import, 1)
old_writer = """async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const formatted = await format(JSON.stringify(value), { parser: 'json' });
  await writeFile(filePath, formatted, 'utf8');
}"""
new_writer = """async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const prettierConfig = (await resolveConfig(filePath)) ?? {};
  const formatted = await format(JSON.stringify(value), {
    ...prettierConfig,
    filepath: filePath,
  });
  await writeFile(filePath, formatted, 'utf8');
}"""
if old_writer not in text:
    raise SystemExit('Expected JSON writer not found')
path.write_text(text.replace(old_writer, new_writer, 1))
