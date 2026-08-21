"""Render and publish the reviewed Neko Đoàn brand derivatives."""

from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
BRAND = ROOT / "docs" / "assets" / "brand" / "neko-doan-v1"
PUBLIC = ROOT / "app" / "frontend" / "public"
PUBLIC_BRAND = PUBLIC / "brand" / "neko-doan-v1"

SVG_RENDERS = (
    ("logo/neko-doan-mark.svg", "previews/neko-doan-mark-on-light.png", 768, 768, "#E7E3DE"),
    (
        "logo/neko-doan-mark-on-dark.svg",
        "previews/neko-doan-mark-on-dark.png",
        768,
        768,
        "#201F1E",
    ),
    ("logo/neko-doan-lockup.svg", "previews/neko-doan-lockup.png", 1260, 384, "#E7E3DE"),
    ("social/neko-doan-social-card.svg", "social/neko-doan-social-card.png", 1200, 630, None),
)

PUBLIC_FILES = {
    "logo/neko-doan-mark.svg": "neko-doan-mark.svg",
    "logo/neko-doan-mark-on-dark.svg": "neko-doan-mark-on-dark.svg",
    "logo/neko-doan-mark-mono.svg": "neko-doan-mark-mono.svg",
    "logo/png/neko-doan-icon-16.png": "neko-doan-icon-16.png",
    "logo/png/neko-doan-icon-32.png": "neko-doan-icon-32.png",
    "logo/png/neko-doan-icon-48.png": "neko-doan-icon-48.png",
    "logo/png/neko-doan-icon-180.png": "neko-doan-icon-180.png",
    "logo/png/neko-doan-icon-192.png": "neko-doan-icon-192.png",
    "logo/png/neko-doan-icon-512.png": "neko-doan-icon-512.png",
    "social/neko-doan-social-card.png": "neko-doan-social-card.png",
}


def browser_executable() -> str | None:
    candidates = (
        Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
        Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
    )
    return str(next((candidate for candidate in candidates if candidate.exists()), "")) or None


def render_svg_derivatives() -> None:
    from playwright.sync_api import sync_playwright

    with sync_playwright() as playwright:
        launch_options: dict[str, object] = {"headless": True}
        executable = browser_executable()
        if executable:
            launch_options["executable_path"] = executable
        browser = playwright.chromium.launch(**launch_options)
        try:
            for source_name, output_name, width, height, background in SVG_RENDERS:
                source = (BRAND / source_name).read_text(encoding="utf-8")
                rendered_size = "100%" if source_name.startswith("social/") else "82%"
                page = browser.new_page(viewport={"width": width, "height": height})
                page.set_content(
                    f"""<!doctype html><style>
                    html, body {{ width: {width}px; height: {height}px; margin: 0; overflow: hidden;
                      display: grid; place-items: center; background: {background or 'transparent'}; }}
                    svg {{ display: block; width: {rendered_size}; height: {rendered_size}; }}
                    </style>{source}"""
                )
                output = BRAND / output_name
                output.parent.mkdir(parents=True, exist_ok=True)
                page.screenshot(path=str(output), omit_background=background is None)
                page.close()
                print(f"Rendered {output.relative_to(ROOT)}")
        finally:
            browser.close()


def publish_runtime_assets() -> None:
    PUBLIC_BRAND.mkdir(parents=True, exist_ok=True)
    for source_name, output_name in PUBLIC_FILES.items():
        shutil.copyfile(BRAND / source_name, PUBLIC_BRAND / output_name)
    shutil.copyfile(BRAND / "logo" / "neko-doan.ico", PUBLIC / "favicon.ico")


def write_manifest() -> None:
    assets = []
    for path in sorted(BRAND.rglob("*")):
        if not path.is_file() or path.name == "manifest.json":
            continue
        data = path.read_bytes()
        assets.append(
            {
                "path": path.relative_to(BRAND).as_posix(),
                "bytes": len(data),
                "sha256": hashlib.sha256(data).hexdigest(),
            }
        )
    manifest = {
        "schema_version": "neko-doan.brand.v1",
        "status": "integrated-local",
        "primary_mark": "Neko Peek",
        "product_name": "Neko Đoàn",
        "operator": "Thành đoàn Hải Phòng",
        "concept_tool": "OpenAI built-in imagegen",
        "assets": assets,
    }
    (BRAND / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def main() -> None:
    render_svg_derivatives()
    publish_runtime_assets()
    write_manifest()
    print(f"Published Neko Doan v1 assets to {PUBLIC_BRAND}")


if __name__ == "__main__":
    main()
