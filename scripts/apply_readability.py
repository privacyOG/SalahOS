from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing {label} marker")
    return text.replace(old, new, 1)


path = Path("src/styles.css")
css = path.read_text()
css = replace_once(css, "  font-size: 0.78rem;\n  font-weight: 700;", "  font-size: 0.875rem;\n  font-weight: 750;\n  line-height: 1.4;", "eyebrow label typography")
css = css.replace("  font-size: 0.85rem;", "  font-size: 0.9rem;\n  line-height: 1.4;")
css = replace_once(css, "  font-size: 0.7rem;\n  font-weight: 700;", "  font-size: 0.875rem;\n  font-weight: 750;\n  line-height: 1.35;", "prayer time label")
css = replace_once(css, "  font-size: 0.82rem;\n}", "  font-size: 0.9rem;\n  line-height: 1.4;\n}", "notification label")
css = replace_once(css, "  font-size: 0.8rem;\n  line-height: 1.45;", "  font-size: 0.9rem;\n  line-height: 1.55;", "settings note")
css = replace_once(css, "  font-size: 0.72rem;\n  font-weight: 700;", "  font-size: 0.85rem;\n  font-weight: 750;", "adjustment badge")
anchor = "@media (prefers-reduced-motion: reduce) {\n"
contrast = """@media (prefers-contrast: more) {
  :root {
    --muted: #e4ece1;
    --label: #e4ece1;
    --control-border: rgba(255, 255, 255, 0.62);
    --card-border: rgba(255, 255, 255, 0.5);
    --divider: rgba(255, 255, 255, 0.42);
    --provenance: #f2e4b9;
  }

  :root[data-theme='light'] {
    --muted: #26352a;
    --label: #26352a;
    --control-border: rgba(23, 32, 25, 0.62);
    --card-border: rgba(23, 32, 25, 0.5);
    --divider: rgba(23, 32, 25, 0.42);
    --provenance: #46340e;
  }

  .prayer-card-supplementary {
    opacity: 1;
  }

  .location-panel,
  .settings-panel,
  .status-card,
  .prayer-panel,
  .manual-mosque-fieldset,
  .offsets-fieldset,
  .mosque-library-controls,
  .notification-fieldset {
    border-width: 2px;
  }
}

@media (forced-colors: active) {
  :root {
    --page: Canvas;
    --text: CanvasText;
    --muted: CanvasText;
    --label: CanvasText;
    --card: Canvas;
    --control: Canvas;
    --control-border: ButtonText;
    --card-border: CanvasText;
    --divider: CanvasText;
    --accent: Highlight;
    --next-card: Canvas;
    --warning: Mark;
    --warning-bg: Canvas;
    --provenance: CanvasText;
    --shadow: transparent;
  }

  .prayer-card-supplementary {
    opacity: 1;
  }

  .prayer-card-next,
  .prayer-card-current,
  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible,
  summary:focus-visible {
    forced-color-adjust: auto;
  }
}

"""
css = replace_once(css, anchor, contrast + anchor, "contrast media anchor")
path.write_text(css)
