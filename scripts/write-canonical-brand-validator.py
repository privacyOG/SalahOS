from __future__ import annotations

from hashlib import sha256
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'artwork' / 'salahos-icon-source.jpg'

ASSET_DIMENSIONS = {
    'public/icons/salahos-192.png': (192, 192),
    'public/icons/salahos-512.png': (512, 512),
    'public/icons/salahos-maskable-192.png': (192, 192),
    'public/icons/salahos-maskable-512.png': (512, 512),
    'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png': (1024, 1024),
    'android/app/src/main/res/mipmap-mdpi/ic_launcher.png': (48, 48),
    'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png': (48, 48),
    'android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png': (108, 108),
    'android/app/src/main/res/mipmap-hdpi/ic_launcher.png': (72, 72),
    'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png': (72, 72),
    'android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png': (162, 162),
    'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png': (96, 96),
    'android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png': (96, 96),
    'android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png': (216, 216),
    'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png': (144, 144),
    'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png': (144, 144),
    'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png': (324, 324),
    'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png': (192, 192),
    'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png': (192, 192),
    'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png': (432, 432),
}


def main() -> None:
    expected = {
        relative: (*dimensions, sha256((ROOT / relative).read_bytes()).hexdigest())
        for relative, dimensions in ASSET_DIMENSIONS.items()
    }
    source_digest = sha256(SOURCE.read_bytes()).hexdigest()
    validator = f'''from __future__ import annotations

import argparse
import hashlib
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "artwork" / "salahos-icon-source.jpg"
SOURCE_SHA256 = {source_digest!r}
EXPECTED = {expected!r}


def png_dimensions(data: bytes) -> tuple[int, int]:
    if data[:8] != b"\\x89PNG\\r\\n\\x1a\\n" or data[12:16] != b"IHDR":
        raise ValueError("not a PNG")
    return struct.unpack(">II", data[16:24])


def verify() -> None:
    failures: list[str] = []
    if not SOURCE.exists() or hashlib.sha256(SOURCE.read_bytes()).hexdigest() != SOURCE_SHA256:
        failures.append("canonical SalahOS icon source")
    for relative, (width, height, digest) in EXPECTED.items():
        path = ROOT / relative
        if not path.exists():
            failures.append(relative + " missing")
            continue
        data = path.read_bytes()
        try:
            dimensions = png_dimensions(data)
        except ValueError:
            failures.append(relative + " invalid PNG")
            continue
        if dimensions != (width, height):
            failures.append(relative + " wrong dimensions")
        if hashlib.sha256(data).hexdigest() != digest:
            failures.append(relative + " stale")
    if failures:
        raise SystemExit("SalahOS brand assets are missing or stale: " + ", ".join(failures))
    print(f"SalahOS canonical brand asset check passed for {{len(EXPECTED)}} assets.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Verify canonical SalahOS brand assets.")
    parser.add_argument("--check", action="store_true", help="Verify the committed source-backed assets.")
    parser.parse_args()
    verify()


if __name__ == "__main__":
    main()
'''
    (ROOT / 'scripts' / 'generate_pwa_icons.py').write_text(validator)


if __name__ == '__main__':
    main()
