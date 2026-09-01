from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

# Source-level guard: Sunrise is supplementary and must never inherit current/next row state.
path = Path('src/ui/TodayScreen.tsx')
text = path.read_text(encoding='utf-8')
old = """                    className={`today-prayer-row${prayer.isCurrent ? ' is-current' : ''}${
                      prayer.isNext ? ' is-next' : ''
                    }${isSunrise ? ' today-prayer-row--sunrise' : ''}`}"""
new = """                    className={`today-prayer-row${!isSunrise && prayer.isCurrent ? ' is-current' : ''}${
                      !isSunrise && prayer.isNext ? ' is-next' : ''
                    }${isSunrise ? ' today-prayer-row--sunrise' : ''}`}"""
text = replace_once(text, old, new, 'Sunrise current/next suppression')
path.write_text(text, encoding='utf-8')

# Token-only, theme-adaptive Sunrise presentation with logical properties.
path = Path('src/today-screen.css')
text = path.read_text(encoding='utf-8')
anchor = """.today-prayer-row.is-next {
  background: color-mix(in srgb, var(--salah-fg-accent) 7%, var(--salah-bg-surface));
}

"""
addition = """.today-prayer-row--sunrise {
  border-block-start-color: var(--salah-border-default);
  color: var(--salah-fg-secondary);
  background: color-mix(in srgb, var(--salah-fg-primary) 2%, var(--salah-bg-surface));
}

.today-prayer-row.today-prayer-row--sunrise.is-current {
  box-shadow: none;
}

.today-prayer-row.today-prayer-row--sunrise.is-next {
  background: color-mix(in srgb, var(--salah-fg-primary) 2%, var(--salah-bg-surface));
}

.today-prayer-row--sunrise .today-prayer-row__name > strong,
.today-prayer-row--sunrise .today-prayer-row__time {
  color: var(--salah-fg-secondary);
  font-weight: 600;
}

.today-prayer-row--sunrise .today-prayer-row__iqamah {
  color: var(--salah-fg-tertiary);
  font-size: var(--salah-text-xs);
  font-weight: 600;
}

"""
text = replace_once(text, anchor, anchor + addition, 'Sunrise CSS insertion')
path.write_text(text, encoding='utf-8')

# Regression coverage for the architectural contract rather than pixel-specific styling.
Path('src/ui/SunriseRowV153.test.ts').write_text("""import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const todayScreen = readFileSync(new URL('./TodayScreen.tsx', import.meta.url), 'utf8');
const todayCss = readFileSync(new URL('../today-screen.css', import.meta.url), 'utf8');

describe('v1.5.3 Sunrise row presentation', () => {
  it('never assigns current or next highlight state to Sunrise', () => {
    expect(todayScreen).toContain("!isSunrise && prayer.isCurrent ? ' is-current' : ''");
    expect(todayScreen).toContain("!isSunrise && prayer.isNext ? ' is-next' : ''");
  });

  it('uses token-only logical styling with reduced Sunrise hierarchy', () => {
    const start = todayCss.indexOf('.today-prayer-row--sunrise {');
    const end = todayCss.indexOf('.today-prayer-row.is-supplementary', start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const sunriseCss = todayCss.slice(start, end);

    expect(sunriseCss).toContain('border-block-start-color: var(--salah-border-default)');
    expect(sunriseCss).toContain('color: var(--salah-fg-secondary)');
    expect(sunriseCss).toContain('color: var(--salah-fg-tertiary)');
    expect(sunriseCss).toContain('font-size: var(--salah-text-xs)');
    expect(sunriseCss).toContain('font-weight: 600');
    expect(sunriseCss).toContain('box-shadow: none');
    expect(sunriseCss).not.toMatch(/#[0-9a-f]{3,8}/iu);
    expect(sunriseCss).not.toMatch(/(?:margin|padding|border)-(?:left|right)\s*:/u);
  });
});
""", encoding='utf-8')

# Tracker is published only if validation succeeds.
path = Path('TEMP_TODO_V1.5.3.md')
text = path.read_text(encoding='utf-8')
old_tracker = """## Work Item 9 — Style the sunrise row

- [ ] Define `today-prayer-row--sunrise` using design tokens only.
- [ ] Reduce name/time weight and use secondary foreground; render \"Not applicable\" at tertiary/xs styling.
- [ ] Add boundary/hairline treatment and defensively suppress current/next highlighting.
- [ ] Verify dark/light themes and logical properties; do not touch mobile-prayer theme or smart-display overrides.
- [ ] Gate: `npm run ui:theme-contrast && npm run ui:theme-architecture && npm run ui:design-system-ownership && npm run format:check`."""
new_tracker = """## Work Item 9 — Style the sunrise row — COMPLETE

- [x] Define `today-prayer-row--sunrise` using design tokens only.
- [x] Reduce name/time weight and use secondary foreground; render \"Not applicable\" at tertiary/xs styling.
- [x] Add boundary/hairline treatment and defensively suppress current/next highlighting.
- [x] Verify dark/light themes and logical properties; do not touch mobile-prayer theme or smart-display overrides.
- [x] Gate: `npm run ui:theme-contrast && npm run ui:theme-architecture && npm run ui:design-system-ownership && npm run format:check`."""
text = replace_once(text, old_tracker, new_tracker, 'Item 9 tracker')
path.write_text(text, encoding='utf-8')
