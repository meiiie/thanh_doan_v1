from pathlib import Path
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parent
URL = (ROOT / "index.html").as_uri()


def main() -> None:
    errors: list[str] = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1536, "height": 960}, device_scale_factor=1)
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(URL)
        page.wait_for_load_state("networkidle")

        assert page.get_by_role("heading", name="Mọi chi tiết đều có lý do").is_visible()
        assert not page.get_by_role("button", name="Mở điều hướng").is_visible()
        assert page.get_by_role("button", name="Tổng quan", exact=True).get_attribute("aria-current") == "page"
        assert page.get_by_text("Chủ chiến dịch", exact=True).first.is_visible()

        page.locator("#roleSelect").select_option("reviewer")
        assert page.get_by_role("button", name="Việc cần làm, 18 việc cần xử lý").is_visible()
        assert page.get_by_role("button", name="Hàng chờ của tổ, 18 việc cần xử lý").count() == 0
        page.screenshot(path=str(ROOT / "specimen-desktop.png"), full_page=True)

        mobile = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
        mobile.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
        mobile.on("pageerror", lambda error: errors.append(str(error)))
        mobile.goto(URL)
        mobile.wait_for_load_state("networkidle")
        menu = mobile.get_by_role("button", name="Mở điều hướng")
        menu.click()
        assert menu.get_attribute("aria-expanded") == "true"
        assert mobile.locator("#app").evaluate("element => element.classList.contains('drawer-open')")
        mobile.screenshot(path=str(ROOT / "specimen-mobile.png"), full_page=True)

        browser.close()

    if errors:
        raise AssertionError("Browser errors: " + " | ".join(errors))
    print("specimen verification passed: desktop role switch, mobile drawer, no browser errors")


if __name__ == "__main__":
    main()
