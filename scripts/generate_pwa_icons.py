from __future__ import annotations

import argparse
import hashlib
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "artwork" / "salahos-icon-source.jpg"
SOURCE_SHA256 = '42eae9b1613b64b51a283926faa4d302c6a88ee965c751078b76982722a02276'
EXPECTED = {'public/icons/salahos-192.png': (192, 192, 'caa9c840f83ed7ece84ca82be98970d5160e746bb3afa6013a4d5a1a57fa2c94'), 'public/icons/salahos-512.png': (512, 512, 'b5b27a4ccf71f1aca0bcd89d968c01f06186645ce2f189a6168e5d2c19d12240'), 'public/icons/salahos-maskable-192.png': (192, 192, 'de163deb6e5b4bf36abf8779ada2a446cabef8991d3a3f0ddd160fb9b5443f30'), 'public/icons/salahos-maskable-512.png': (512, 512, 'e1174bf0203c35e0aa7a91ece6644a6977b2164641621b8fa35c75b455b42275'), 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png': (1024, 1024, '4a959253b216e575bf42a5e5d297555266c55e55180a013f1315e362a23fe9f0'), 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png': (48, 48, '120cdeaf05d36dbedb1e3850c35236bc2515a9869dcec31087ca056185eca857'), 'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png': (48, 48, 'f94944a0f08484fa2e9ea818e0c04fce325f66bd6dd030f07b67a36d6a7e89b6'), 'android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png': (108, 108, '39056ef67f421eecd1699cdcb795e763149b5c44363d7a1973588683d6e7ba83'), 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png': (72, 72, 'c1747570c2b43e2239f16ea79db194705f1853a47eb6b28603d50f11c3c8a5d5'), 'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png': (72, 72, 'f8e4ed75611f9f774bb95fe0db5fc751920808f7376fee699d70b3cbb0d3d096'), 'android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png': (162, 162, 'b4ab1d56375bfc1a36f87d2a9ae55e50374d3e0de82ff2cad139ece72d8f97bb'), 'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png': (96, 96, '27e8a1f337c9bd8ec3b620e075f050c17783de0539dd9ab4e04d537e7f575a28'), 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png': (96, 96, '07179cf0d40c8c904297316dd657d6d1a8de79c66e79cecddfdb11b6e17b8feb'), 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png': (216, 216, 'cba4ecf13d7f74a288f5e91d59fe5d20065db069e3b6ebbcd4187e15387a0551'), 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png': (144, 144, '315d163d0debf1eb895de3798298bd7213abbdb1f3454b8f85a579143ce75fd8'), 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png': (144, 144, '5263efd170954ad2835257f8da555f71541c8894f8ccaf3271fca0d070655828'), 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png': (324, 324, '7e756a8b6cfc81dbb96e2923624ac6df13149cd0c0f7895f14d3cb24accbb706'), 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png': (192, 192, 'caa9c840f83ed7ece84ca82be98970d5160e746bb3afa6013a4d5a1a57fa2c94'), 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png': (192, 192, '9ae4a75ba8ae3e51d12eac812c8d2ce5d9c5221caf80c22d4ba8e48bc50b656e'), 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png': (432, 432, '68269ef75213b3c790ad1957883d3ca00220678bacc8a5e59e18ebc9d2857078')}


def png_dimensions(data: bytes) -> tuple[int, int]:
    if data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
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
    print(f"SalahOS canonical brand asset check passed for {len(EXPECTED)} assets.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Verify canonical SalahOS brand assets.")
    parser.add_argument("--check", action="store_true", help="Verify the committed source-backed assets.")
    parser.parse_args()
    verify()


if __name__ == "__main__":
    main()
