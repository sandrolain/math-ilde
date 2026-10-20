#!/usr/bin/env python3
"""Build single-line glyphs from a Playwrite TTF/OTF/WOFF2 font.

The font contains outlines. This tool rasterizes those outlines, extracts their
medial skeleton, removes short spurs, and writes the resulting paths as the
same M/L DSL consumed by the calligrafo package.
"""

from __future__ import annotations

import argparse
import json
import re
import urllib.request
from pathlib import Path

import cv2
import numpy as np
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from skimage.morphology import skeletonize


def sample_curve(start, controls, end, count=12):
    points = []
    if len(controls) == 1:
        for step in range(1, count + 1):
            t = step / count
            u = 1 - t
            points.append(
                (
                    u * u * start[0] + 2 * u * t * controls[0][0] + t * t * end[0],
                    u * u * start[1] + 2 * u * t * controls[0][1] + t * t * end[1],
                )
            )
    else:
        c1, c2 = controls
        for step in range(1, count + 1):
            t = step / count
            u = 1 - t
            points.append(
                (
                    u**3 * start[0]
                    + 3 * u * u * t * c1[0]
                    + 3 * u * t * t * c2[0]
                    + t**3 * end[0],
                    u**3 * start[1]
                    + 3 * u * u * t * c1[1]
                    + 3 * u * t * t * c2[1]
                    + t**3 * end[1],
                )
            )
    return points


def glyph_contours(glyph_set, glyph_name):
    pen = DecomposingRecordingPen(glyph_set)
    glyph_set[glyph_name].draw(pen)
    contours = []
    current = None
    contour = []
    for command, values in pen.value:
        if command == "moveTo":
            if len(contour) > 1:
                contours.append(contour)
            current = tuple(values[0])
            contour = [current]
        elif command == "lineTo":
            current = tuple(values[0])
            contour.append(current)
        elif command == "curveTo":
            controls = [tuple(value) for value in values[:-1]]
            end = tuple(values[-1])
            contour.extend(sample_curve(current, controls, end))
            current = end
        elif command == "qCurveTo":
            controls = [tuple(value) for value in values if value is not None]
            for index, control in enumerate(controls):
                if index + 1 < len(controls):
                    next_control = controls[index + 1]
                    end = (
                        (control[0] + next_control[0]) / 2,
                        (control[1] + next_control[1]) / 2,
                    )
                else:
                    end = control
                contour.extend(sample_curve(current, [control], end))
                current = end
        elif command == "closePath":
            if len(contour) > 1:
                contours.append(contour)
            contour = []
            current = None
    if len(contour) > 1:
        contours.append(contour)
    return contours


def normalize(contours, scale, baseline=80):
    points = [point for contour in contours for point in contour]
    min_x = min(point[0] for point in points)
    return [
        [
            (
                (x - min_x) * scale,
                baseline - y * scale,
            )
            for x, y in contour
        ]
        for contour in contours
    ]


def rasterize(contours, pixels_per_em):
    max_x = max(point[0] for contour in contours for point in contour)
    max_y = max(point[1] for contour in contours for point in contour)
    width = int(np.ceil(max_x * pixels_per_em)) + 4
    height = int(np.ceil(max_y * pixels_per_em)) + 4
    mask = np.zeros((height, width), dtype=np.uint8)
    for contour in contours:
        polygon = np.round(np.array(contour) * pixels_per_em).astype(np.int32)
        layer = np.zeros_like(mask)
        cv2.fillPoly(layer, [polygon], 255)
        mask = cv2.bitwise_xor(mask, layer)
    return mask > 0


def neighbors(pixels, row, column):
    result = []
    for row_delta in (-1, 0, 1):
        for column_delta in (-1, 0, 1):
            if not row_delta and not column_delta:
                continue
            next_row = row + row_delta
            next_column = column + column_delta
            if (
                0 <= next_row < pixels.shape[0]
                and 0 <= next_column < pixels.shape[1]
                and pixels[next_row, next_column]
            ):
                result.append((next_row, next_column))
    return result


def trace_skeleton(skeleton, pixels_per_em, minimum_length=5):
    points = {
        (row, column)
        for row, column in zip(*np.nonzero(skeleton))
    }

    def adjacent(point):
        return [candidate for candidate in neighbors(skeleton, *point) if candidate in points]

    def edge_key(first, second):
        return tuple(sorted((first, second)))

    visited = set()
    paths = []

    def trace(first, second):
        path = [first, second]
        visited.add(edge_key(first, second))
        previous, current = first, second
        while len(adjacent(current)) == 2:
            candidate = next(
                (
                    point
                    for point in adjacent(current)
                    if point != previous and edge_key(current, point) not in visited
                ),
                None,
            )
            if candidate is None:
                break
            visited.add(edge_key(current, candidate))
            path.append(candidate)
            previous, current = current, candidate
        return path

    nodes = [point for point in points if len(adjacent(point)) != 2]
    for first in nodes:
        for second in adjacent(first):
            if edge_key(first, second) not in visited:
                paths.append(trace(first, second))
    for first in points:
        for second in adjacent(first):
            if edge_key(first, second) not in visited:
                paths.append(trace(first, second))

    result = []
    for path in paths:
        if len(path) < 2:
            continue
        coordinates = np.array(
            [[column / pixels_per_em, row / pixels_per_em] for row, column in path],
            dtype=np.float32,
        )
        length = np.linalg.norm(np.diff(coordinates, axis=0), axis=1).sum()
        if length < minimum_length:
            continue
        epsilon = max(0.35, 1.2 / pixels_per_em)
        simplified = cv2.approxPolyDP(coordinates, epsilon, False).reshape(-1, 2)
        if len(simplified) > 1:
            result.append([(float(x), float(y)) for x, y in simplified])
    return sorted(result, key=lambda path: -len(path))


def glyph_strokes(contours, scale, pixels_per_em):
    normalized = normalize(contours, scale)
    mask = rasterize(normalized, pixels_per_em)
    skeleton = skeletonize(mask)
    return trace_skeleton(skeleton, pixels_per_em)


def dsl(strokes):
    parts = []
    for stroke in strokes:
        if len(stroke) < 2:
            continue
        values = [f"M{stroke[0][0]:.2f} {stroke[0][1]:.2f}"]
        values.extend(f"{x:.2f} {y:.2f}" for x, y in stroke[1:])
        parts.append(f"{values[0]} L{' '.join(values[1:])}")
    return " ; ".join(parts)


def download_source(source):
    if source.startswith(("http://", "https://")):
        destination = Path("/tmp/playwrite-font.woff2")
        with urllib.request.urlopen(source) as response:
            destination.write_bytes(response.read())
        return destination
    return Path(source)


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--font", required=True, help="TTF, OTF or WOFF2 font path/URL")
    parser.add_argument("--output", required=True, help="generated TypeScript module")
    parser.add_argument("--export-name", required=True)
    parser.add_argument("--chars", default="abcdefghijklmnopqrstuvwxyz")
    parser.add_argument(
        "--x-height",
        "--height",
        dest="x_height",
        type=float,
        default=40,
        help="altezza comune del corpo minuscolo in em (default: 40)",
    )
    parser.add_argument("--pixels-per-em", type=int, default=4)
    return parser.parse_args()


def main():
    args = parse_args()
    font = TTFont(download_source(args.font))
    if "fvar" in font:
        font = instantiateVariableFont(font, {"wght": 100}, inplace=False)
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()
    units_per_em = font["head"].unitsPerEm
    metrics = font.get("OS/2")
    x_height_units = getattr(metrics, "sxHeight", 0) if metrics else 0
    if not x_height_units:
        x_height_units = units_per_em * 0.5
    coordinate_scale = args.x_height / x_height_units
    entries = {}
    metadata = {}

    for char in args.chars:
        glyph_name = cmap.get(ord(char))
        if glyph_name is None:
            continue
        contours = glyph_contours(glyph_set, glyph_name)
        if not contours:
            continue
        strokes = glyph_strokes(contours, coordinate_scale, args.pixels_per_em)
        if not strokes:
            continue
        entries[char.lower()] = dsl(strokes)
        metadata[char] = {
            "font_glyph": glyph_name,
            "strokes_em": strokes,
            "advance_em": glyph_set[glyph_name].width * coordinate_scale,
        }

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        f"/** Generato da Playwrite IT Trad, peso 100; scheletro ricostruito. */",
        "",
        f"export const {args.export_name}: Record<string, string> = {{",
    ]
    lines.extend(f"  {char}: '{value}'," for char, value in sorted(entries.items()))
    lines.extend(["};", ""])
    output.write_text("\n".join(lines))

    json_output = output.with_suffix(".json")
    json_output.write_text(json.dumps({"version": 1, "glyphs": metadata}, indent=2) + "\n")
    print(f"Generated {len(entries)}/{len(args.chars)} glyphs in {output}")


if __name__ == "__main__":
    main()
