from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing marker: {old[:120]}")
    return text.replace(old, new, 1)


app_path = Path("src/App.tsx")
app = app_path.read_text()
old = """          <label>
            <span>{translate(locale, 'asrMethod')}</span>
            <select
              value={settings.asrConvention}
              onChange={(event) => {
                setSettings((current) => ({
                  ...current,
                  asrConvention: event.target.value as PersistedSettings['asrConvention'],
                }));
              }}
            >
              <option value=\"standard\">{translate(locale, 'asrStandard')}</option>
              <option value=\"hanafi\">{translate(locale, 'asrHanafi')}</option>
            </select>
          </label>
"""
new = """          <label>
            <span>{translate(locale, 'asrMethod')}</span>
            <select
              aria-describedby=\"asr-convention-help\"
              value={settings.asrConvention}
              onChange={(event) => {
                setSettings((current) => ({
                  ...current,
                  asrConvention: event.target.value as PersistedSettings['asrConvention'],
                }));
              }}
            >
              <option value=\"standard\">{translate(locale, 'asrStandard')}</option>
              <option value=\"hanafi\">{translate(locale, 'asrHanafi')}</option>
            </select>
            <small className=\"setting-help\" id=\"asr-convention-help\">
              {translate(locale, 'asrConventionExplanation')}
            </small>
          </label>
"""
if "id=\"asr-convention-help\"" not in app:
    app = replace_once(app, old, new)
app_path.write_text(app)

translations_path = Path("src/i18n/translations.ts")
translations = translations_path.read_text()
if "asrConventionExplanation:" not in translations:
    translations = replace_once(
        translations,
        "    asrHanafi: 'Hanafi',\n",
        "    asrHanafi: 'Hanafi',\n    asrConventionExplanation:\n      \"Standard (Shafi'i, Maliki and Hanbali) uses shadow factor 1; Hanafi uses shadow factor 2. Both include the noon shadow.\",\n",
    )
    translations = replace_once(
        translations,
        "    asrHanafi: 'الحنفي',\n",
        "    asrHanafi: 'الحنفي',\n    asrConventionExplanation:\n      'القياسي (الشافعي والمالكي والحنبلي) يستخدم معامل ظل 1؛ والحنفي يستخدم معامل ظل 2. ويُضاف ظل الزوال في الحالتين.',\n",
    )
translations_path.write_text(translations)

styles_path = Path("src/styles.css")
styles = styles_path.read_text().rstrip()
addition = """

.setting-help {
  color: var(--muted);
  font-size: 0.75rem;
  line-height: 1.45;
}
"""
if ".setting-help {" not in styles:
    styles_path.write_text(styles + addition + "\n")
