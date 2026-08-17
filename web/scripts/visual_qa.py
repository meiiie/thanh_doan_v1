from pathlib import Path
from playwright.sync_api import sync_playwright


BASE_URL = "http://localhost:3000"
REPORTS = Path("reports")


def assert_no_horizontal_overflow(page, label):
    dimensions = page.evaluate(
        """() => ({
          viewport: document.documentElement.clientWidth,
          content: document.documentElement.scrollWidth,
        })"""
    )
    assert dimensions["content"] <= dimensions["viewport"], (
        f"{label} overflows horizontally: {dimensions}"
    )


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    console_errors = []

    desktop = browser.new_page(viewport={"width": 1440, "height": 1000})
    desktop.on(
        "console",
        lambda message: console_errors.append(message.text)
        if message.type == "error"
        else None,
    )
    desktop.goto(f"{BASE_URL}/admin?demo=admin")
    desktop.wait_for_load_state("networkidle")
    desktop.get_by_role(
        "heading", name="Tiến độ và kiểm soát chiến dịch"
    ).wait_for()
    assert desktop.get_by_text("16 hồ sơ Đại học, Cao đẳng").is_visible()
    assert_no_horizontal_overflow(desktop, "admin desktop")
    desktop.screenshot(path=REPORTS / "admin-desktop.png", full_page=True)

    mobile = browser.new_page(viewport={"width": 390, "height": 844})
    mobile.on(
        "console",
        lambda message: console_errors.append(message.text)
        if message.type == "error"
        else None,
    )
    mobile.emulate_media(reduced_motion="reduce")
    mobile.goto(f"{BASE_URL}/scorecard?demo=unit")
    mobile.wait_for_load_state("networkidle")
    mobile.get_by_role("heading", name="Nội dung cơ bản").wait_for()
    assert mobile.get_by_role("button", name="Nộp bảng tự chấm").is_visible()
    assert mobile.locator("input[name='score']").count() == 35
    assert_no_horizontal_overflow(mobile, "unit mobile")
    mobile.keyboard.press("Tab")
    assert mobile.evaluate("() => document.activeElement !== document.body")
    mobile.screenshot(path=REPORTS / "scorecard-mobile.png", full_page=False)

    zoom = browser.new_page(viewport={"width": 1440, "height": 900})
    zoom.goto(f"{BASE_URL}/?demo=reviewer")
    zoom.wait_for_load_state("networkidle")
    zoom.evaluate("() => { document.documentElement.style.zoom = '2'; }")
    assert_no_horizontal_overflow(zoom, "reviewer at 200% zoom")
    zoom.screenshot(path=REPORTS / "reviewer-zoom-200.png", full_page=False)

    browser.close()

assert not console_errors, f"Browser console errors: {console_errors}"
print("Visual QA: desktop, 390px mobile, keyboard focus, reduced motion, and 200% zoom passed.")
