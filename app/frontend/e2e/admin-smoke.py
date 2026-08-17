from __future__ import annotations

import os
from pathlib import Path

from playwright.sync_api import Page, expect, sync_playwright


BASE_URL = os.environ.get("ADMIN_BASE_URL", "http://127.0.0.1:4317")
FRONTEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = FRONTEND_ROOT.parents[1]
PASSWORD_FILE = PROJECT_ROOT / ".tmp" / "local-superadmin.password"
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")
ARTIFACTS = FRONTEND_ROOT / "artifacts"
AXE_PATH = FRONTEND_ROOT / "node_modules" / "axe-core" / "axe.min.js"


def assert_accessible(page: Page, label: str) -> None:
    if not AXE_PATH.exists():
        raise RuntimeError(f"Thiếu axe-core: {AXE_PATH}. Hãy chạy npm install trong app/frontend.")
    page.add_script_tag(path=AXE_PATH)
    result = page.evaluate(
        """
        async () => await window.axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
          }
        })
        """
    )
    violations = result["violations"]
    if violations:
        details = []
        for violation in violations:
            targets = [", ".join(node["target"]) for node in violation["nodes"][:5]]
            details.append(
                f"{violation['id']} ({violation.get('impact')}): {violation['help']} -> {targets}"
            )
        raise AssertionError(f"A11y {label}:\n" + "\n".join(details))


def login(page: Page) -> None:
    if not ADMIN_PASSWORD and not PASSWORD_FILE.exists():
        raise RuntimeError(f"Thiếu mật khẩu local: {PASSWORD_FILE}. Hãy chạy scripts/dev.ps1 trước.")
    password = ADMIN_PASSWORD or PASSWORD_FILE.read_text(encoding="utf-8-sig").strip()
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")
    page.get_by_label("Tên đăng nhập").fill("superadmin")
    page.get_by_label("Mật khẩu").fill(password)
    page.get_by_role("button", name="Đăng nhập", exact=True).click()
    expect(page).to_have_url(f"{BASE_URL}/superadmin/lifecycle")
    expect(page.get_by_text("Đã xác thực", exact=True)).to_be_visible()


def run() -> None:
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1512, "height": 982},
            ignore_https_errors=BASE_URL.startswith("https://"),
        )
        page = context.new_page()
        console_errors: list[str] = []
        page.on(
            "console",
            lambda message: console_errors.append(message.text)
            if message.type == "error"
            and not (
                message.text.startswith("Failed to load resource:")
                and "status of 401" in message.text
            )
            else None,
        )
        page.on("pageerror", lambda error: console_errors.append(str(error)))

        page.goto(f"{BASE_URL}/superadmin/lifecycle")
        page.wait_for_load_state("networkidle")
        expect(page).to_have_url(f"{BASE_URL}/login?returnUrl=%2Fsuperadmin%2Flifecycle")
        expect(page.get_by_role("heading", name="Đăng nhập", exact=True)).to_be_visible()
        expect(page.get_by_text("Dấu Xanh Hải Phòng", exact=True)).to_be_visible()
        expect(page).to_have_title("Đăng nhập · Dấu Xanh Hải Phòng")
        brand_mark = page.locator('img[src="brand/dau-xanh-mark.svg"]')
        expect(brand_mark).to_be_visible()
        if brand_mark.evaluate("element => element.naturalWidth") <= 0:
            raise AssertionError("Biểu tượng Dấu Xanh không tải được")
        expect(page.get_by_label("Tên đăng nhập")).to_be_focused()
        assert_accessible(page, "đăng nhập desktop")
        page.screenshot(path=ARTIFACTS / "login-desktop.png", full_page=True)

        page.get_by_label("Tên đăng nhập").fill("superadmin")
        page.get_by_label("Mật khẩu").fill("sai-mat-khau")
        page.get_by_role("button", name="Hiện", exact=True).click()
        expect(page.get_by_label("Mật khẩu")).to_have_attribute("type", "text")
        page.get_by_role("button", name="Ẩn", exact=True).click()
        page.get_by_role("button", name="Đăng nhập", exact=True).click()
        expect(page.get_by_role("alert")).to_contain_text("không đúng")
        assert_accessible(page, "đăng nhập có lỗi xác thực")

        login(page)
        expect(page.get_by_role("link", name="Dấu Xanh Hải Phòng — về trang chính")).to_be_visible()
        expect(page.get_by_text("27", exact=True).first).to_be_visible()
        expect(page.get_by_text("55", exact=True).first).to_be_visible()
        expect(page.get_by_text("134", exact=True).first).to_be_visible()
        expect(page.get_by_text("0 hồ sơ")).to_be_visible()
        page.keyboard.press("Home")
        page.keyboard.press("Tab")
        expect(page.get_by_role("link", name="Bỏ qua điều hướng")).to_be_focused()
        page.keyboard.press("Enter")
        expect(page.locator("#admin-main")).to_be_focused()
        assert_accessible(page, "vòng đời Superadmin")
        page.screenshot(path=ARTIFACTS / "real-data-lifecycle-desktop.png", full_page=True)

        page.goto(f"{BASE_URL}/superadmin/scorecards")
        expect(page.get_by_role("heading", name="Bảng điểm khối Đại học, Cao đẳng")).to_be_visible()
        expect(page.get_by_text("55/55 dòng chấm")).to_be_visible()
        expect(page.locator("tbody tr")).to_have_count(55)
        assert_accessible(page, "bảng điểm và phân công")
        page.get_by_role("button", name="Chưa đủ").first.click()
        expect(page.get_by_role("heading", name="100% Đoàn các trường Đại học, Cao đẳng có hoạt động trồng mới cây xanh trên địa bàn")).to_be_visible()
        expect(page.get_by_text("Superadmin cần tạo Tổ và tài khoản cán bộ trước khi phân công.")).to_be_visible()
        assert_accessible(page, "ngăn phân công")
        page.get_by_role("button", name="Đóng", exact=True).click()
        page.get_by_placeholder("Tìm mã hoặc nội dung").fill("I.21.5")
        expect(page.locator("tbody tr")).to_have_count(1)
        expect(page.get_by_text("I.21.5", exact=True)).to_be_visible()
        page.get_by_placeholder("Tìm mã hoặc nội dung").fill("")
        page.get_by_role("button", name="Đối soát nguồn").click()
        expect(page.get_by_text("8D29B213907C00D5314C5D9B5FD27E4F09019F013B6A2D5A3DADE44361531653")).to_be_visible()
        assert_accessible(page, "đối soát nguồn bảng điểm")
        page.screenshot(path=ARTIFACTS / "source-scorecard-desktop.png", full_page=True)

        page.goto(f"{BASE_URL}/superadmin/accounts")
        expect(page.get_by_role("heading", name="Tài khoản và phạm vi quyền")).to_be_visible()
        expect(page.get_by_text("Quản trị hệ thống", exact=True).first).to_be_visible()
        assert_accessible(page, "tài khoản và quyền")
        page.get_by_role("button", name="Tạo tài khoản", exact=True).click()
        expect(page.get_by_role("form", name="Tạo tài khoản")).to_be_visible()
        assert_accessible(page, "biểu mẫu tạo tài khoản")

        page.goto(f"{BASE_URL}/superadmin/structure")
        expect(page.get_by_role("heading", name="Cơ cấu đơn vị và tổ theo dõi")).to_be_visible()
        expect(page.get_by_text("0 đã khai báo", exact=True)).to_have_count(2)
        expect(page.get_by_text("Hệ thống không tự sinh tên mẫu.")).to_be_visible()
        assert_accessible(page, "cơ cấu tổ chức")

        page.goto(f"{BASE_URL}/superadmin/results")
        expect(page.get_by_role("heading", name="Chiến dịch Thanh niên tình nguyện Hè 2026")).to_be_visible()
        expect(page.get_by_text("Chưa có snapshot kết quả", exact=True).first).to_be_visible()
        assert_accessible(page, "kết quả và đối soát")

        page.goto(f"{BASE_URL}/duong-dan-khong-ton-tai")
        expect(page.get_by_role("heading", name="Không tìm thấy trang")).to_be_visible()
        assert_accessible(page, "không tìm thấy trang")

        page.goto(f"{BASE_URL}/admin/scorecard-templates")
        expect(page.get_by_role("heading", name="Bảng điểm khối Đại học, Cao đẳng")).to_be_visible()

        mobile = browser.new_page(
            viewport={"width": 390, "height": 844},
            ignore_https_errors=BASE_URL.startswith("https://"),
        )
        mobile.goto(f"{BASE_URL}/login")
        mobile.wait_for_load_state("networkidle")
        expect(mobile.get_by_text("Dấu Xanh Hải Phòng", exact=True)).to_be_visible()
        assert_accessible(mobile, "đăng nhập mobile")
        if mobile.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"):
            raise AssertionError("Trang đăng nhập mobile bị tràn ngang")
        mobile.screenshot(path=ARTIFACTS / "login-mobile.png", full_page=True)
        login(mobile)
        mobile.goto(f"{BASE_URL}/superadmin/scorecards")
        expect(mobile.get_by_role("heading", name="Bảng điểm khối Đại học, Cao đẳng")).to_be_visible()
        assert_accessible(mobile, "bảng điểm mobile")
        mobile.screenshot(path=ARTIFACTS / "source-scorecard-mobile.png", full_page=True)

        page.goto(f"{BASE_URL}/superadmin/lifecycle")
        page.get_by_role("button", name="Mở tài khoản").click()
        expect(page.get_by_label("Tài khoản hiện tại")).to_be_visible()
        with page.expect_request(lambda request: request.url.endswith("/api/auth/logout")) as logout_request:
            with page.expect_response(lambda response: response.url.endswith("/api/auth/logout")) as logout_info:
                page.get_by_role("button", name="Đăng xuất", exact=True).click()
        if logout_info.value.status != 200:
            cookie_metadata = sorted(
                (cookie["name"], cookie["httpOnly"], cookie["secure"], cookie["sameSite"])
                for cookie in context.cookies()
            )
            all_headers = logout_request.value.all_headers()
            header_names = sorted(name.lower() for name in all_headers)
            document_cookie_names = sorted(
                item.split("=", 1)[0].strip()
                for item in page.evaluate("document.cookie").split(";")
                if item.strip()
            )
            xsrf_header_length = len(all_headers.get("x-xsrf-token", ""))
            xsrf_cookie_length = page.evaluate(
                "document.cookie.split('; ').find(v => v.startsWith('XSRF-TOKEN='))?.split('=')[1]?.length ?? 0"
            )
            raise AssertionError(
                f"Logout API trả về HTTP {logout_info.value.status}; "
                f"cookies={cookie_metadata}; document_cookies={document_cookie_names}; "
                f"request_headers={header_names}; xsrf_header_length={xsrf_header_length}; "
                f"xsrf_cookie_length={xsrf_cookie_length}"
            )
        expect(page).to_have_url(f"{BASE_URL}/login?reason=logged-out")
        expect(page.get_by_role("status")).to_contain_text("đăng xuất an toàn")
        session_cookies = [
            cookie for cookie in context.cookies() if cookie["name"] == "CAMPAIGN_SESSION"
        ]
        if session_cookies:
            raise AssertionError("Cookie phiên vẫn tồn tại sau khi đăng xuất")
        page.goto(f"{BASE_URL}/superadmin/lifecycle")
        expect(page).to_have_url(f"{BASE_URL}/login?returnUrl=%2Fsuperadmin%2Flifecycle")

        if console_errors:
            raise AssertionError("Lỗi trình duyệt:\n" + "\n".join(console_errors))
        context.close()
        browser.close()


if __name__ == "__main__":
    run()
