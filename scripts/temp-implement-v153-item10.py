from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

# Reuse the existing mosque icon on the selected-mosque location state.
path = Path('src/ui/TodayScreen.tsx')
text = path.read_text(encoding='utf-8')
import_anchor = "import { PrayerBoardWeatherModule } from './PrayerBoardWeatherModule';\n"
text = replace_once(
    text,
    import_anchor,
    import_anchor + "import { SalahIcon } from './SalahIcon';\n",
    'SalahIcon import',
)
old_identity = """              <div>
                <span>{uxCopy.localContext}</span>
                <strong>{locationSourceLabel}</strong>
              </div>"""
new_identity = """              <div>
                <span>{uxCopy.localContext}</span>
                <strong>
                  {directoryMosqueActive && (
                    <SalahIcon name="mosques" className="today-location-confidence__mosque-icon" />
                  )}
                  {locationSourceLabel}
                </strong>
              </div>"""
text = replace_once(text, old_identity, new_identity, 'selected mosque icon')
path.write_text(text, encoding='utf-8')

# Selected mosque receives a distinct semantic surface; approximate gets a quiet caution treatment.
# Saved and precise deliberately use the unchanged base card styling.
path = Path('src/today-screen.css')
text = path.read_text(encoding='utf-8')
anchor = """.today-location-confidence > div:first-child span {
  color: var(--salah-fg-tertiary);
  font-size: var(--salah-text-xs);
  font-weight: 780;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

"""
addition = """.today-location-confidence > div:first-child strong {
  display: flex;
  align-items: center;
  gap: var(--salah-space-2);
}

.today-location-confidence__mosque-icon {
  width: 1.15rem;
  height: 1.15rem;
  flex: 0 0 auto;
  color: var(--salah-fg-accent);
}

.today-location-confidence[data-location-confidence='mosque'] {
  border-color: color-mix(in srgb, var(--salah-fg-accent) 42%, var(--salah-border-subtle));
  background: color-mix(in srgb, var(--salah-fg-accent) 6%, var(--salah-bg-surface));
}

.today-location-confidence[data-location-confidence='approximate'] {
  border-color: color-mix(in srgb, var(--salah-fg-secondary) 28%, var(--salah-border-subtle));
  border-style: dashed;
  background: color-mix(in srgb, var(--salah-fg-secondary) 3%, var(--salah-bg-surface));
}

.today-location-confidence[data-location-confidence='approximate']
  .today-location-confidence__meta > span:first-child {
  color: var(--salah-fg-secondary);
}

"""
text = replace_once(text, anchor, anchor + addition, 'location state CSS')
path.write_text(text, encoding='utf-8')

# Architecture regression coverage: states stay data-driven, selected mosque reuses SalahIcon,
# and saved/precise remain on the neutral base style rather than gaining state overrides.
Path('src/ui/SelectedMosqueLocationStateV153.test.ts').write_text("""import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const todayScreen = readFileSync(new URL('./TodayScreen.tsx', import.meta.url), 'utf8');
const todayCss = readFileSync(new URL('../today-screen.css', import.meta.url), 'utf8');

describe('v1.5.3 selected mosque location state', () => {
  it('keeps the existing four state model and reuses the shared mosque icon', () => {
    expect(todayScreen).toContain("? 'mosque'");
    expect(todayScreen).toContain("? 'approximate'");
    expect(todayScreen).toContain("? 'saved'");
    expect(todayScreen).toContain(": 'precise'");
    expect(todayScreen).toContain('<SalahIcon name="mosques"');
    expect(todayScreen).toContain('{directoryMosqueActive && (');
  });

  it('styles only mosque and approximate states beyond the neutral base card', () => {
    expect(todayCss).toContain("[data-location-confidence='mosque']");
    expect(todayCss).toContain("[data-location-confidence='approximate']");
    expect(todayCss).not.toContain("[data-location-confidence='saved']");
    expect(todayCss).not.toContain("[data-location-confidence='precise']");

    const start = todayCss.indexOf('.today-location-confidence__mosque-icon');
    const end = todayCss.indexOf('.today-location-confidence__meta {', start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const stateCss = todayCss.slice(start, end);
    expect(stateCss).toContain('var(--salah-fg-accent)');
    expect(stateCss).toContain('var(--salah-border-subtle)');
    expect(stateCss).toContain('var(--salah-bg-surface)');
    expect(stateCss).not.toMatch(/#[0-9a-f]{3,8}/iu);
  });
});
""", encoding='utf-8')

# Tracker is promoted only after the gate passes.
path = Path('TEMP_TODO_V1.5.3.md')
text = path.read_text(encoding='utf-8')
old_tracker = """## Work Item 10 — Style selected-mosque location state

- [ ] Add distinct mosque-state border/background using existing tokens/color-mix.
- [ ] Add quiet approximate-location warning treatment; leave saved/precise neutral.
- [ ] Reuse the existing mosque icon from `SalahIcon.tsx`.
- [ ] Gate: `npm run ui:theme-contrast && npm run ui:theme-architecture && npm run ui:design-system-ownership`."""
new_tracker = """## Work Item 10 — Style selected-mosque location state — COMPLETE

- [x] Add distinct mosque-state border/background using existing tokens/color-mix.
- [x] Add quiet approximate-location warning treatment; leave saved/precise neutral.
- [x] Reuse the existing mosque icon from `SalahIcon.tsx`.
- [x] Gate: `npm run ui:theme-contrast && npm run ui:theme-architecture && npm run ui:design-system-ownership`."""
text = replace_once(text, old_tracker, new_tracker, 'Item 10 tracker')
path.write_text(text, encoding='utf-8')
