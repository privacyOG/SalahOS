from __future__ import annotations

import argparse
import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "public" / "icons"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"
IOS_ICON = ROOT / "ios" / "App" / "App" / "Assets.xcassets" / "AppIcon.appiconset" / "AppIcon-512@2x.png"
DESIGN_SIZE = 512
SUPERSAMPLE = 3

# Brand colours sampled/adapted from the maintainer-supplied SalahOS logo artwork.
GREEN = (0, 84, 62, 255)
GOLD = (224, 166, 52, 255)
TRANSPARENT = (0, 0, 0, 0)

ANDROID_ICON_SIZES = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
}
ANDROID_FOREGROUND_SIZES = {
    "mdpi": 108,
    "hdpi": 162,
    "xhdpi": 216,
    "xxhdpi": 324,
    "xxxhdpi": 432,
}


def set_pixel(canvas, width, x, y, color):
    if x < 0 or y < 0 or x >= width or y >= width:
        return
    offset = (y * width + x) * 4
    canvas[offset : offset + 4] = bytes(color)


def fill_rect(canvas, width, left, top, right, bottom, color):
    left = max(0, math.floor(left))
    top = max(0, math.floor(top))
    right = min(width, math.ceil(right))
    bottom = min(width, math.ceil(bottom))
    for y in range(top, bottom):
        for x in range(left, right):
            set_pixel(canvas, width, x, y, color)


def fill_circle(canvas, width, cx, cy, radius, color):
    radius_squared = radius * radius
    min_y = max(0, math.floor(cy - radius))
    max_y = min(width - 1, math.ceil(cy + radius))
    for y in range(min_y, max_y + 1):
        dy = y + 0.5 - cy
        remaining = radius_squared - dy * dy
        if remaining < 0:
            continue
        dx = math.sqrt(remaining)
        start = max(0, math.ceil(cx - dx - 0.5))
        end = min(width - 1, math.floor(cx + dx - 0.5))
        for x in range(start, end + 1):
            set_pixel(canvas, width, x, y, color)


def fill_polygon(canvas, width, points, color):
    min_y = max(0, math.floor(min(y for _, y in points)))
    max_y = min(width - 1, math.ceil(max(y for _, y in points)))
    for y in range(min_y, max_y + 1):
        scan_y = y + 0.5
        intersections = []
        for index, first in enumerate(points):
            second = points[(index + 1) % len(points)]
            x1, y1 = first
            x2, y2 = second
            if y1 == y2:
                continue
            if (y1 <= scan_y < y2) or (y2 <= scan_y < y1):
                ratio = (scan_y - y1) / (y2 - y1)
                intersections.append(x1 + ratio * (x2 - x1))
        intersections.sort()
        for index in range(0, len(intersections) - 1, 2):
            start = max(0, math.ceil(intersections[index] - 0.5))
            end = min(width - 1, math.floor(intersections[index + 1] - 0.5))
            for x in range(start, end + 1):
                set_pixel(canvas, width, x, y, color)


def fill_rounded_rect(canvas, width, radius, color):
    r2 = radius * radius
    for y in range(width):
        py = y + 0.5
        for x in range(width):
            px = x + 0.5
            inside = radius <= px <= width - radius or radius <= py <= width - radius
            if not inside:
                cx = radius if px < radius else width - radius
                cy = radius if py < radius else width - radius
                inside = (px - cx) ** 2 + (py - cy) ** 2 <= r2
            if inside:
                set_pixel(canvas, width, x, y, color)


def downsample(canvas, source_size, factor):
    target_size = source_size // factor
    output = bytearray(target_size * target_size * 4)
    area = factor * factor
    for target_y in range(target_size):
        for target_x in range(target_size):
            sums = [0, 0, 0, 0]
            for dy in range(factor):
                for dx in range(factor):
                    source_x = target_x * factor + dx
                    source_y = target_y * factor + dy
                    offset = (source_y * source_size + source_x) * 4
                    for channel in range(4):
                        sums[channel] += canvas[offset + channel]
            target_offset = (target_y * target_size + target_x) * 4
            output[target_offset : target_offset + 4] = bytes(round(value / area) for value in sums)
    return bytes(output)


def png_chunk(kind, payload):
    return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)


def encode_png(width, height, rgba):
    rows = []
    stride = width * 4
    for y in range(height):
        rows.append(b"\x00" + rgba[y * stride : (y + 1) * stride])
    header = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", header)
        + png_chunk(b"IDAT", zlib.compress(b"".join(rows), 9))
        + png_chunk(b"IEND", b"")
    )


def transform(points, scale, offset_x=0.0, offset_y=0.0):
    return [((x + offset_x) * scale, (y + offset_y) * scale) for x, y in points]


def draw_brand_mark(canvas, source_size, *, background_color, scale_factor=1.0):
    """Draw the supplied SalahOS minaret/crescent mark centred in a 512-unit design box."""
    unit = source_size / DESIGN_SIZE
    centre = 256.0
    local_scale = unit * scale_factor
    offset = centre * unit - centre * local_scale

    def sx(value):
        return value * local_scale + offset

    # Crescent behind the minaret.
    fill_circle(canvas, source_size, sx(320), sx(170), 88 * local_scale, GOLD)
    fill_circle(canvas, source_size, sx(350), sx(142), 72 * local_scale, background_color)

    # Minaret spire and pointed cap.
    fill_rect(canvas, source_size, sx(250), sx(94), sx(262), sx(155), GOLD)
    fill_polygon(
        canvas,
        source_size,
        [(sx(216), sx(172)), (sx(256), sx(128)), (sx(296), sx(172))],
        GOLD,
    )

    # Upper tower and gallery shoulders.
    fill_rect(canvas, source_size, sx(229), sx(166), sx(283), sx(278), GOLD)
    fill_rect(canvas, source_size, sx(200), sx(212), sx(312), sx(240), GOLD)
    fill_rect(canvas, source_size, sx(210), sx(238), sx(302), sx(258), GOLD)

    # Narrow tower below gallery.
    fill_rect(canvas, source_size, sx(238), sx(250), sx(274), sx(358), GOLD)

    # Mosque/base silhouette with stepped shoulders.
    fill_polygon(
        canvas,
        source_size,
        [
            (sx(176), sx(338)),
            (sx(208), sx(338)),
            (sx(208), sx(318)),
            (sx(232), sx(318)),
            (sx(232), sx(342)),
            (sx(280), sx(342)),
            (sx(280), sx(318)),
            (sx(304), sx(318)),
            (sx(304), sx(338)),
            (sx(336), sx(338)),
            (sx(336), sx(416)),
            (sx(176), sx(416)),
        ],
        GOLD,
    )

    # Three arch voids in the base.
    for cx in (208, 256, 304):
        fill_circle(canvas, source_size, sx(cx), sx(382), 16 * local_scale, background_color)
        fill_rect(canvas, source_size, sx(cx - 16), sx(382), sx(cx + 16), sx(418), background_color)


def render_icon(size, *, rounded=True, circle=False, foreground=False, maskable=False):
    source_size = size * SUPERSAMPLE
    canvas = bytearray(bytes(TRANSPARENT) * (source_size * source_size))

    if foreground:
        draw_brand_mark(canvas, source_size, background_color=TRANSPARENT, scale_factor=0.66)
    else:
        if circle:
            fill_circle(canvas, source_size, source_size / 2, source_size / 2, source_size / 2, GREEN)
        elif rounded and not maskable:
            fill_rounded_rect(canvas, source_size, source_size * 0.19, GREEN)
        else:
            fill_rect(canvas, source_size, 0, 0, source_size, source_size, GREEN)
        draw_brand_mark(canvas, source_size, background_color=GREEN, scale_factor=0.78 if maskable else 0.84)

    rgba = downsample(canvas, source_size, SUPERSAMPLE)
    return encode_png(size, size, rgba)


def expected_assets():
    assets = {
        ICON_DIR / "salahos-192.png": render_icon(192, rounded=True),
        ICON_DIR / "salahos-512.png": render_icon(512, rounded=True),
        ICON_DIR / "salahos-maskable-192.png": render_icon(192, rounded=False, maskable=True),
        ICON_DIR / "salahos-maskable-512.png": render_icon(512, rounded=False, maskable=True),
        IOS_ICON: render_icon(1024, rounded=False),
    }

    for density, size in ANDROID_ICON_SIZES.items():
        directory = ANDROID_RES / f"mipmap-{density}"
        assets[directory / "ic_launcher.png"] = render_icon(size, rounded=True)
        assets[directory / "ic_launcher_round.png"] = render_icon(size, rounded=False, circle=True)

    for density, size in ANDROID_FOREGROUND_SIZES.items():
        directory = ANDROID_RES / f"mipmap-{density}"
        assets[directory / "ic_launcher_foreground.png"] = render_icon(
            size,
            rounded=False,
            foreground=True,
        )

    return assets


def main():
    parser = argparse.ArgumentParser(
        description="Generate deterministic SalahOS web, Android and iOS brand icons."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail unless committed icons exactly match generated bytes.",
    )
    args = parser.parse_args()

    assets = expected_assets()
    failures = []
    for path, data in assets.items():
        if args.check:
            if not path.exists() or path.read_bytes() != data:
                failures.append(path.relative_to(ROOT).as_posix())
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            print(f"generated {path.relative_to(ROOT)} ({len(data)} bytes)")

    if failures:
        raise SystemExit("SalahOS brand icons are missing or stale: " + ", ".join(failures))
    if args.check:
        print(f"SalahOS brand icon reproducibility check passed for {len(assets)} assets.")


if __name__ == "__main__":
    main()
