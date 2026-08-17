from __future__ import annotations

from hashlib import sha256
from pathlib import Path
from textwrap import dedent

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'artwork' / 'salahos-icon-source.jpg'
TEAL = (7, 78, 92, 255)


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format='PNG', optimize=True)


def square(source: Image.Image, size: int) -> Image.Image:
    return source.resize((size, size), Image.Resampling.LANCZOS).convert('RGBA')


def maskable(source: Image.Image, size: int) -> Image.Image:
    canvas = Image.new('RGBA', (size, size), TEAL)
    mark_size = round(size * 0.82)
    mark = square(source, mark_size)
    offset = (size - mark_size) // 2
    canvas.alpha_composite(mark, (offset, offset))
    return canvas


def round_icon(source: Image.Image, size: int) -> Image.Image:
    image = square(source, size)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    image.putalpha(mask)
    return image


def adaptive_foreground(source: Image.Image, size: int) -> Image.Image:
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    mark_size = round(size * 0.72)
    mark = square(source, mark_size)
    offset = (size - mark_size) // 2
    canvas.alpha_composite(mark, (offset, offset))
    return canvas


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    if old not in text:
        raise RuntimeError(f'expected branding insertion point not found in {path.relative_to(ROOT)}')
    path.write_text(text.replace(old, new, 1))


def write_validator(assets: dict[Path, tuple[int, int]]) -> None:
    source_hash = sha256(SOURCE.read_bytes()).hexdigest()
    rows = []
    for path, dimensions in sorted(assets.items(), key=lambda item: item[0].as_posix()):
        rows.append(
            f"    {path.relative_to(ROOT).as_posix()!r}: ({dimensions[0]}, {dimensions[1]}, {sha256(path.read_bytes()).hexdigest()!r}),"
        )
    validator = dedent(
        f'''\
        from __future__ import annotations

        import argparse
        import hashlib
        import struct
        from pathlib import Path

        ROOT = Path(__file__).resolve().parents[1]
        SOURCE = ROOT / 'artwork' / 'salahos-icon-source.jpg'
        SOURCE_SHA256 = {source_hash!r}
        EXPECTED = {{
        {chr(10).join(rows)}
        }}

        def png_dimensions(data: bytes) -> tuple[int, int]:
            if data[:8] != b'\\x89PNG\\r\\n\\x1a\\n' or data[12:16] != b'IHDR':
                raise ValueError('not a PNG')
            return struct.unpack('>II', data[16:24])

        def verify() -> None:
            failures: list[str] = []
            if not SOURCE.exists() or hashlib.sha256(SOURCE.read_bytes()).hexdigest() != SOURCE_SHA256:
                failures.append('canonical SalahOS icon source')
            for relative, (width, height, digest) in EXPECTED.items():
                path = ROOT / relative
                if not path.exists():
                    failures.append(relative + ' missing')
                    continue
                data = path.read_bytes()
                try:
                    dimensions = png_dimensions(data)
                except ValueError:
                    failures.append(relative + ' invalid PNG')
                    continue
                if dimensions != (width, height):
                    failures.append(relative + ' wrong dimensions')
                if hashlib.sha256(data).hexdigest() != digest:
                    failures.append(relative + ' stale')
            if failures:
                raise SystemExit('SalahOS brand assets are missing or stale: ' + ', '.join(failures))
            print(f'SalahOS canonical brand asset check passed for {{len(EXPECTED)}} assets.')

        def main() -> None:
            parser = argparse.ArgumentParser(description='Verify canonical SalahOS brand assets.')
            parser.add_argument('--check', action='store_true', help='Verify the committed source-backed assets.')
            parser.parse_args()
            verify()

        if __name__ == '__main__':
            main()
        '''
    )
    (ROOT / 'scripts' / 'generate_pwa_icons.py').write_text(validator)


def main() -> None:
    source = Image.open(SOURCE).convert('RGB')
    if source.size != (512, 512):
        raise RuntimeError(f'canonical icon source must be 512x512, got {source.size}')

    assets: dict[Path, tuple[int, int]] = {}
    for size in (192, 512):
        path = ROOT / 'public' / 'icons' / f'salahos-{size}.png'
        save_png(square(source, size), path)
        assets[path] = (size, size)
        mask_path = ROOT / 'public' / 'icons' / f'salahos-maskable-{size}.png'
        save_png(maskable(source, size), mask_path)
        assets[mask_path] = (size, size)

    ios_path = ROOT / 'ios' / 'App' / 'App' / 'Assets.xcassets' / 'AppIcon.appiconset' / 'AppIcon-512@2x.png'
    save_png(square(source, 1024), ios_path)
    assets[ios_path] = (1024, 1024)

    density_sizes = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
    foreground_sizes = {'mdpi': 108, 'hdpi': 162, 'xhdpi': 216, 'xxhdpi': 324, 'xxxhdpi': 432}
    for density, size in density_sizes.items():
        directory = ROOT / 'android' / 'app' / 'src' / 'main' / 'res' / f'mipmap-{density}'
        launcher = directory / 'ic_launcher.png'
        round_path = directory / 'ic_launcher_round.png'
        save_png(square(source, size), launcher)
        save_png(round_icon(source, size), round_path)
        assets[launcher] = (size, size)
        assets[round_path] = (size, size)
        foreground_size = foreground_sizes[density]
        foreground = directory / 'ic_launcher_foreground.png'
        save_png(adaptive_foreground(source, foreground_size), foreground)
        assets[foreground] = (foreground_size, foreground_size)

    background_xml = ROOT / 'android' / 'app' / 'src' / 'main' / 'res' / 'values' / 'ic_launcher_background.xml'
    background_xml.write_text('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#074E5C</color>\n</resources>\n')

    manifest = ROOT / 'public' / 'manifest.webmanifest'
    manifest.write_text(dedent('''\
        {
          "name": "SalahOS",
          "short_name": "SalahOS",
          "description": "Privacy-focused local prayer times and smart display",
          "start_url": "/",
          "scope": "/",
          "display": "standalone",
          "background_color": "#074e5c",
          "theme_color": "#074e5c",
          "orientation": "any",
          "icons": [
            {"src":"/icons/salahos-192.png","sizes":"192x192","type":"image/png","purpose":"any"},
            {"src":"/icons/salahos-512.png","sizes":"512x512","type":"image/png","purpose":"any"},
            {"src":"/icons/salahos-maskable-192.png","sizes":"192x192","type":"image/png","purpose":"maskable"},
            {"src":"/icons/salahos-maskable-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}
          ]
        }
    '''))

    sw = ROOT / 'public' / 'sw.js'
    text = sw.read_text()
    text = text.replace("`${CACHE_PREFIX}v2`", "`${CACHE_PREFIX}v3`")
    text = text.replace("  '/icons/salahos.svg',\n  '/icons/salahos-maskable.svg',", "  '/icons/salahos-192.png',\n  '/icons/salahos-512.png',\n  '/icons/salahos-maskable-192.png',\n  '/icons/salahos-maskable-512.png',")
    sw.write_text(text)

    index = ROOT / 'index.html'
    text = index.read_text().replace('content="#101510"', 'content="#074e5c"')
    text = text.replace('<link rel="icon" href="/icons/salahos.svg" type="image/svg+xml" />', '<link rel="icon" href="/icons/salahos-192.png" type="image/png" />')
    index.write_text(text)

    app = ROOT / 'src' / 'App.tsx'
    replace_once(app, '<p className="eyebrow">{translate(locale, \'appName\')}</p>', '<div className="brand-title-row">\n              <img className="brand-icon" src="/icons/salahos-192.png" alt="" aria-hidden="true" />\n              <span className="brand-name">SalahOS</span>\n            </div>')

    smart = ROOT / 'src' / 'ui' / 'SmartDisplay.tsx'
    replace_once(smart, '<p className="eyebrow">{translate(locale, \'appName\')}</p>', '<div className="smart-display-brand">\n            <img src="/icons/salahos-192.png" alt="" aria-hidden="true" />\n            <span>SalahOS</span>\n          </div>')

    styles = ROOT / 'src' / 'styles.css'
    styles.write_text(styles.read_text() + dedent('''\

        .brand-title-row {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          margin-block-end: 0.45rem;
        }

        .brand-icon {
          width: clamp(2.4rem, 5vw, 3.6rem);
          height: clamp(2.4rem, 5vw, 3.6rem);
          border-radius: 22%;
          box-shadow: 0 0.35rem 1rem var(--shadow);
        }

        .brand-name {
          font-size: clamp(1rem, 2vw, 1.35rem);
          font-weight: 800;
          letter-spacing: 0.02em;
        }
    '''))

    display_css = ROOT / 'src' / 'smart-display.css'
    display_css.write_text(display_css.read_text() + dedent('''\

        .smart-display-brand {
          display: flex;
          align-items: center;
          gap: clamp(0.5rem, 1vw, 1rem);
          margin-block-end: 0.45rem;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .smart-display-brand img {
          width: clamp(2.8rem, 5vw, 5.5rem);
          height: clamp(2.8rem, 5vw, 5.5rem);
          border-radius: 22%;
        }
    '''))

    readme = ROOT / 'README.md'
    readme_text = readme.read_text()
    if '<img src="public/icons/salahos-512.png"' not in readme_text:
        readme_text = readme_text.replace('# SalahOS\n', '# SalahOS\n\n<p align="center"><img src="public/icons/salahos-512.png" width="180" alt="SalahOS logo" /></p>\n', 1)
    readme.write_text(readme_text)

    service_test = ROOT / 'scripts' / 'service-worker-validation.test.mjs'
    test_text = service_test.read_text()
    test_text = test_text.replace("'salahos-shell-v2'", "'salahos-shell-v3'")
    test_text = test_text.replace("it('removes only stale SalahOS shell caches during a v1 to v2 activation'", "it('removes only stale SalahOS shell caches during activation'")
    test_text = test_text.replace("      'salahos-shell-v1': [],\n      'salahos-shell-v3': [],", "      'salahos-shell-v1': [],\n      'salahos-shell-v2': [],\n      'salahos-shell-v3': [],")
    test_text = test_text.replace("expect(caches.deleted).toEqual(['salahos-shell-v1']);", "expect(caches.deleted).toEqual(['salahos-shell-v1', 'salahos-shell-v2']);")
    test_text = test_text.replace("expect(await shell.match('/icons/salahos.svg')).toBeInstanceOf(Response);\n    expect(await shell.match('/icons/salahos-maskable.svg')).toBeInstanceOf(Response);", "expect(await shell.match('/icons/salahos-192.png')).toBeInstanceOf(Response);\n    expect(await shell.match('/icons/salahos-512.png')).toBeInstanceOf(Response);\n    expect(await shell.match('/icons/salahos-maskable-192.png')).toBeInstanceOf(Response);\n    expect(await shell.match('/icons/salahos-maskable-512.png')).toBeInstanceOf(Response);")
    service_test.write_text(test_text)

    for obsolete in (ROOT / 'public' / 'icons' / 'salahos.svg', ROOT / 'public' / 'icons' / 'salahos-maskable.svg'):
        obsolete.unlink(missing_ok=True)

    write_validator(assets)


if __name__ == '__main__':
    main()
