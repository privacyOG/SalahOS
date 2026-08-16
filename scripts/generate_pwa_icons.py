from __future__ import annotations

import argparse
import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "public" / "icons"
DESIGN_SIZE = 512
SUPERSAMPLE = 2

DARK = (16, 21, 16, 255)
RING = (29, 40, 31, 255)
LIGHT = (197, 224, 190, 255)
TRANSPARENT = (0, 0, 0, 0)


def cubic_point(p0, p1, p2, p3, t):
    u = 1.0 - t
    return (
        u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
        u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1],
    )


def sample_path(start, segments, samples_per_segment=32):
    points = [start]
    current = start
    for control1, control2, end in segments:
        for index in range(1, samples_per_segment + 1):
            points.append(cubic_point(current, control1, control2, end, index / samples_per_segment))
        current = end
    return points


def scale_points(points, scale):
    return [(x * scale, y * scale) for x, y in points]


def set_pixel(canvas, width, x, y, color):
    offset = (y * width + x) * 4
    canvas[offset : offset + 4] = bytes(color)


def fill_polygon(canvas, width, height, points, color):
    for y in range(height):
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


def fill_circle(canvas, width, height, cx, cy, radius, color):
    radius_squared = radius * radius
    min_y = max(0, math.floor(cy - radius))
    max_y = min(height - 1, math.ceil(cy + radius))
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


def fill_rounded_rect(canvas, width, height, radius, color):
    radius_squared = radius * radius
    for y in range(height):
        py = y + 0.5
        for x in range(width):
            px = x + 0.5
            inside = radius <= px <= width - radius or radius <= py <= height - radius
            if not inside:
                cx = radius if px < radius else width - radius
                cy = radius if py < radius else height - radius
                inside = (px - cx) ** 2 + (py - cy) ** 2 <= radius_squared
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


def standard_geometry(scale):
    outer = sample_path(
        (256, 76),
        [
            ((310, 138), (342, 202), (342, 268)),
            ((342, 348), (304, 406), (256, 436)),
            ((208, 406), (170, 356), (170, 268)),
            ((170, 202), (202, 138), (256, 76)),
        ],
    )
    inner = sample_path(
        (256, 152),
        [
            ((226, 194), (210, 234), (210, 272)),
            ((210, 323), (228, 362), (256, 388)),
            ((284, 362), (302, 323), (302, 272)),
            ((302, 234), (286, 194), (256, 152)),
        ],
    )
    return scale_points(outer, scale), scale_points(inner, scale)


def maskable_geometry(scale):
    outer = sample_path(
        (256, 112),
        [
            ((303, 166), (330, 221), (330, 278)),
            ((330, 346), (298, 396), (256, 422)),
            ((214, 396), (182, 346), (182, 278)),
            ((182, 221), (209, 166), (256, 112)),
        ],
    )
    inner = sample_path(
        (256, 178),
        [
            ((231, 213), (217, 247), (217, 279)),
            ((217, 322), (233, 355), (256, 377)),
            ((279, 355), (295, 322), (295, 279)),
            ((295, 247), (281, 213), (256, 178)),
        ],
    )
    return scale_points(outer, scale), scale_points(inner, scale)


def render_icon(size, maskable):
    source_size = size * SUPERSAMPLE
    scale = source_size / DESIGN_SIZE
    canvas = bytearray(bytes(TRANSPARENT) * (source_size * source_size))

    if maskable:
        for y in range(source_size):
            for x in range(source_size):
                set_pixel(canvas, source_size, x, y, DARK)
        fill_circle(canvas, source_size, source_size, 256 * scale, 256 * scale, 176 * scale, RING)
        outer, inner = maskable_geometry(scale)
        fill_polygon(canvas, source_size, source_size, outer, LIGHT)
        fill_polygon(canvas, source_size, source_size, inner, DARK)
        fill_circle(canvas, source_size, source_size, 256 * scale, 278 * scale, 24 * scale, LIGHT)
    else:
        fill_rounded_rect(canvas, source_size, source_size, 112 * scale, DARK)
        outer, inner = standard_geometry(scale)
        fill_polygon(canvas, source_size, source_size, outer, LIGHT)
        fill_polygon(canvas, source_size, source_size, inner, DARK)
        fill_circle(canvas, source_size, source_size, 256 * scale, 270 * scale, 28 * scale, LIGHT)

    rgba = downsample(canvas, source_size, SUPERSAMPLE)
    return encode_png(size, size, rgba)


def expected_assets():
    return {
        ICON_DIR / "salahos-192.png": render_icon(192, False),
        ICON_DIR / "salahos-512.png": render_icon(512, False),
        ICON_DIR / "salahos-maskable-192.png": render_icon(192, True),
        ICON_DIR / "salahos-maskable-512.png": render_icon(512, True),
    }


def main():
    parser = argparse.ArgumentParser(description="Generate deterministic SalahOS PWA raster icons.")
    parser.add_argument("--check", action="store_true", help="Fail unless committed icons exactly match generated bytes.")
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
        raise SystemExit("PWA raster icons are missing or stale: " + ", ".join(failures))
    if args.check:
        print(f"PWA raster icon reproducibility check passed for {len(assets)} assets.")


if __name__ == "__main__":
    main()
