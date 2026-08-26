from pathlib import Path
import re
import subprocess
import textwrap


def apply_proven_transformation() -> None:
    workflow = Path('.github/workflows/stage57-ux-builder-v2.yml').read_text()
    match = re.search(
        r"      - name: Apply Stage 57 UX refinement robustly\n        shell: bash\n        run: \|\n(?P<body>.*?)(?=\n      - name: Fix Stage 57 validation issues)",
        workflow,
        flags=re.S,
    )
    if match is None:
        raise SystemExit('Unable to extract proven Stage 57 transformation')
    script = Path('/tmp/stage57-proven.sh')
    script.write_text(textwrap.dedent(match.group('body')))
    subprocess.run(['bash', str(script)], check=True)


def fix_today_location_accuracy() -> None:
    path = Path('src/ui/TodayScreen.tsx')
    text = path.read_text()
    pattern = re.compile(
        r"(?m)^\s*const locationAccuracyLabel =\s*\n"
        r"\s*recentLocation\?\.accuracyMeters === null \|\| recentLocation\?\.accuracyMeters === undefined\s*\n"
        r"\s*\? null\s*\n"
        r"\s*: recentLocation\.accuracyMeters < 1_000\s*\n"
        r"\s*\? `±\$\{String\(Math\.round\(recentLocation\.accuracyMeters\)\)\} m`\s*\n"
        r"\s*: `±\$\{\(recentLocation\.accuracyMeters / 1_000\)\.toFixed\(1\)\} km`;"
    )
    replacement = """  const locationAccuracyMeters =
    recentLocation === null ? null : recentLocation.accuracyMeters;
  const locationAccuracyLabel =
    locationAccuracyMeters === null
      ? null
      : locationAccuracyMeters < 1_000
        ? `±${String(Math.round(locationAccuracyMeters))} m`
        : `±${(locationAccuracyMeters / 1_000).toFixed(1)} km`;"""
    text, count = pattern.subn(replacement, text, count=1)
    if count != 1:
        raise SystemExit(f'Location accuracy structural fix count={count}')
    path.write_text(text)


def fix_settings_route_contract() -> None:
    path = Path('src/ui/applicationRoute.test.ts')
    text = path.read_text()
    test_name = 'writes canonical Settings category links without dropping requested category intent'
    start = text.find(test_name)
    if start < 0:
        raise SystemExit('Canonical Settings route test missing')
    next_test = text.find("\n  it(", start + len(test_name))
    end = len(text) if next_test < 0 else next_test
    block = text[start:end]
    pattern = re.compile(
        r"(const\s+fromAdmin\s*=\s*withSettingsCategory\(.*?,\s*)"
        r"(['\"])[^'\"]+\2"
        r"(\s*,?\s*\);)",
        flags=re.S,
    )
    block, count = pattern.subn(lambda m: m.group(1) + "'display'" + m.group(3), block, count=1)
    if count != 1:
        raise SystemExit('Unable to set canonical Settings test category to display')
    text = text[:start] + block + text[end:]
    path.write_text(text)


def fix_primary_navigation() -> None:
    path = Path('src/ui/CongregationShell.tsx')
    text = path.read_text()
    pattern = re.compile(
        r"\s*<PrimaryNavigation\s+ariaLabel=\{labels\.navigation\}\s+items=\{\[.*?\]\}\s+overflowLabel=\{labels\.more\}\s+overflowItems=\{\[.*?\]\}\s*/>",
        flags=re.S,
    )
    replacement = """
      <PrimaryNavigation
        ariaLabel={labels.navigation}
        items={[
          {
            id: 'today',
            icon: 'today',
            label: labels.today,
            current: destination === 'today',
            onSelect: () => {
              navigate('today');
            },
          },
          {
            id: 'mosques',
            icon: 'mosques',
            label: labels.mosques,
            current: destination === 'mosques',
            onSelect: () => {
              navigate('mosques');
            },
          },
          {
            id: 'qiblah',
            icon: 'qiblah',
            label: labels.qiblah,
            current: destination === 'qiblah',
            onSelect: () => {
              navigate('qiblah');
            },
          },
          {
            id: 'knowledge',
            icon: 'knowledge',
            label: labels.knowledge,
            current: destination === 'knowledge',
            onSelect: () => {
              navigate('knowledge');
            },
          },
          {
            id: 'settings',
            icon: 'settings',
            label: labels.settings,
            current: destination === 'settings',
            onSelect: () => {
              navigate('settings');
            },
          },
        ]}
      />"""
    text, count = pattern.subn(replacement, text, count=1)
    if count != 1:
        raise SystemExit(f'Primary navigation replacement count={count}')
    path.write_text(text)


def fix_visual_navigation_acceptance() -> None:
    path = Path('scripts/visual-product-ux-stage8.mjs')
    text = path.read_text()
    pattern = re.compile(
        r"\s*await page\.locator\('\.congregation-nav-item--more'\)\.click\(\);\s*"
        r"const overflowMenu = page\.locator\('\.congregation-nav-overflow-menu'\);\s*"
        r"await overflowMenu\.waitFor\(\{ state: 'visible' \}\);\s*"
        r"if \(\(await overflowMenu\.getByRole\('menuitem'\)\.count\(\)\) !== 2\) \{\s*"
        r"throw new Error\('Mobile More menu must expose exactly Community and Settings'\);\s*\}",
        flags=re.S,
    )
    replacement = """
    const primaryNavItems = page.locator('.congregation-nav > .congregation-nav-item');
    if ((await primaryNavItems.count()) !== 5) {
      throw new Error('Mobile primary navigation must expose exactly five destinations');
    }
    const primaryNavLabels = await primaryNavItems
      .locator('.congregation-nav-label')
      .allTextContents();
    const expectedPrimaryNavLabels = ['Today', 'Mosques', 'Qiblah', 'Knowledge', 'Settings'];
    if (JSON.stringify(primaryNavLabels) !== JSON.stringify(expectedPrimaryNavLabels)) {
      throw new Error(`Unexpected mobile primary navigation: ${primaryNavLabels.join(', ')}`);
    }
"""
    text, count = pattern.subn(replacement, text, count=1)
    if count != 1:
        raise SystemExit(f'Mobile navigation acceptance replacement count={count}')
    path.write_text(text)


apply_proven_transformation()
fix_today_location_accuracy()
fix_settings_route_contract()
fix_primary_navigation()
fix_visual_navigation_acceptance()
