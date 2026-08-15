from pathlib import Path


app_path = Path("src/App.tsx")
app = app_path.read_text()
block = """        <div className=\"source-detail\">\n          <p className=\"label\">{translate(locale, 'method')}</p>\n          <p className=\"value\">{dashboard?.method.name ?? translate(locale, 'notConfigured')}</p>\n        </div>\n"""
if block not in app:
    raise RuntimeError("Missing duplicated source-detail block")
app_path.write_text(app.replace(block, "", 1))

styles_path = Path("src/styles.css")
styles = styles_path.read_text().rstrip()
addition = """

.prayer-times {
  display: grid;
  gap: 0.2rem;
  margin-block-start: 0.75rem;
}

.prayer-time-label {
  color: #9eae9b;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

[dir='rtl'] .prayer-time-label {
  letter-spacing: 0;
  text-transform: none;
}

.iqamah-time {
  color: #c5e0be;
}

.jumuah-panel {
  margin-block-start: 1.25rem;
  padding-block-start: 1.25rem;
  border-block-start: 1px solid rgba(255, 255, 255, 0.08);
}

.jumuah-panel h3 {
  margin: 0 0 0.85rem;
  font-size: 1.2rem;
}

.jumuah-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.75rem;
}

.jumuah-grid article {
  display: grid;
  gap: 0.35rem;
  padding: 0.9rem;
  border-radius: 0.85rem;
  background: rgba(197, 224, 190, 0.07);
}
"""
if ".jumuah-panel {" not in styles:
    styles_path.write_text(styles + addition + "\n")
