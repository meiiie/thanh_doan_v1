"""Render deterministic raster fallbacks from the approved Dấu Xanh mark geometry."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "app" / "frontend" / "public"
SCALE = 16
CANVAS = 64 * SCALE
BLUE = "#0756c9"
TEAL = "#0b8f75"


def scaled(point: tuple[float, float]) -> tuple[int, int]:
    return round(point[0] * SCALE), round(point[1] * SCALE)


def rounded_line(
    draw: ImageDraw.ImageDraw,
    points: list[tuple[float, float]],
    color: str,
    width: float,
) -> None:
    pixels = [scaled(point) for point in points]
    stroke = round(width * SCALE)
    radius = stroke // 2
    draw.line(pixels, fill=color, width=stroke, joint="curve")
    for x, y in (pixels[0], pixels[-1]):
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)


def cubic_bezier(
    start: tuple[float, float],
    control_1: tuple[float, float],
    control_2: tuple[float, float],
    end: tuple[float, float],
    steps: int = 48,
) -> list[tuple[float, float]]:
    result: list[tuple[float, float]] = []
    for index in range(steps + 1):
        t = index / steps
        inverse = 1 - t
        result.append(
            (
                inverse**3 * start[0]
                + 3 * inverse**2 * t * control_1[0]
                + 3 * inverse * t**2 * control_2[0]
                + t**3 * end[0],
                inverse**3 * start[1]
                + 3 * inverse**2 * t * control_1[1]
                + 3 * inverse * t**2 * control_2[1]
                + t**3 * end[1],
            )
        )
    return result


def render() -> Image.Image:
    image = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    rounded_line(draw, [(9, 29), (24, 44)], BLUE, 11)
    rounded_line(draw, [(24, 44), (54, 12)], TEAL, 11)
    wave = cubic_bezier((21, 52), (30, 58), (43, 57), (53, 48))
    rounded_line(draw, wave, BLUE, 4)
    return image


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    source = render()
    source.save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    source.resize((180, 180), Image.Resampling.LANCZOS).save(
        PUBLIC / "brand" / "dau-xanh-touch-icon.png",
        optimize=True,
    )


if __name__ == "__main__":
    main()
