from __future__ import annotations

import os
import re
from pathlib import Path

from playwright.sync_api import Page, expect, sync_playwright


expect.set_options(timeout=10_000)


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
    page.get_by_label("Tên đăng nhập", exact=True).fill("superadmin")
    page.get_by_role("button", name="Tiếp tục", exact=True).click()
    page.get_by_label("Mật khẩu", exact=True).fill(password)
    page.get_by_role("button", name="Đăng nhập", exact=True).click()
    expect(page).to_have_url(f"{BASE_URL}/superadmin/lifecycle")
    expect(page.locator(".admin-topbar__context")).not_to_be_attached()
    expect(page.locator(".admin-topbar__actions")).not_to_be_attached()
    expect(page.locator("[data-profile-topbar]")).not_to_be_attached()


def run() -> None:
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1512, "height": 982},
            ignore_https_errors=BASE_URL.startswith("https://"),
            reduced_motion="reduce",
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
        expect(page.get_by_role("heading", name="Đăng nhập vào Neko Đoàn", exact=True)).to_be_visible()
        expect(page.get_by_text("Neko Đoàn", exact=True)).to_be_visible()
        expect(page).to_have_title("Đăng nhập · Neko Đoàn")
        brand_mark = page.locator('img[src="brand/neko-doan-v1/neko-doan-mark.svg"]').first
        expect(brand_mark).to_be_visible()
        if brand_mark.evaluate("element => element.naturalWidth") <= 0:
            raise AssertionError("Biểu tượng Neko Đoàn không tải được")
        expect(page.get_by_label("Tên đăng nhập", exact=True)).to_be_focused()
        expect(page.get_by_label("Mật khẩu", exact=True)).not_to_be_attached()
        assert_accessible(page, "đăng nhập desktop")
        page.screenshot(path=ARTIFACTS / "login-desktop.png", full_page=True)

        login_requests: list[str] = []
        page.on(
            "request",
            lambda request: login_requests.append(request.url)
            if request.url.endswith("/api/auth/login")
            else None,
        )
        page.get_by_label("Tên đăng nhập", exact=True).fill("superadmin")
        expect(page.get_by_role("button", name="Tiếp tục", exact=True)).to_be_enabled()
        page.screenshot(path=ARTIFACTS / "login-identifier-filled-desktop.png", full_page=True)
        page.get_by_role("button", name="Tiếp tục", exact=True).click()
        expect(page.get_by_label("Tên đăng nhập", exact=True)).to_have_value("superadmin")
        expect(page.get_by_label("Tên đăng nhập", exact=True)).to_have_attribute("readonly", "")
        expect(page.get_by_role("button", name="Sửa tên đăng nhập", exact=True)).to_be_visible()
        expect(page.get_by_label("Mật khẩu", exact=True)).to_be_focused()
        expect(page.get_by_role("button", name="Quay lại", exact=True)).to_be_visible()
        expect(page.get_by_role("button", name="←", exact=True)).not_to_be_attached()
        if login_requests:
            raise AssertionError("Bước tài khoản đã gọi API đăng nhập và có thể làm lộ tài khoản")
        assert_accessible(page, "đăng nhập bước mật khẩu")
        page.screenshot(path=ARTIFACTS / "login-password-desktop.png", full_page=True)

        page.get_by_role("button", name="Quay lại", exact=True).click()
        expect(page.get_by_label("Tên đăng nhập", exact=True)).to_be_focused()
        expect(page.get_by_label("Tên đăng nhập", exact=True)).to_have_value("superadmin")
        expect(page.get_by_label("Mật khẩu", exact=True)).not_to_be_attached()
        page.get_by_role("button", name="Tiếp tục", exact=True).click()
        page.get_by_label("Mật khẩu", exact=True).fill("sai-mat-khau")
        page.screenshot(path=ARTIFACTS / "login-password-filled-desktop.png", full_page=True)
        page.get_by_role("button", name="Hiện mật khẩu", exact=True).click()
        expect(page.get_by_label("Mật khẩu", exact=True)).to_have_attribute("type", "text")
        page.get_by_role("button", name="Ẩn mật khẩu", exact=True).click()
        page.get_by_role("button", name="Đăng nhập", exact=True).click()
        expect(page.get_by_role("alert")).to_contain_text("không đúng")
        expect(page.get_by_label("Mật khẩu", exact=True)).to_have_value("sai-mat-khau")
        expect(page.get_by_label("Mật khẩu", exact=True)).to_have_attribute("type", "password")
        expect(page.get_by_label("Mật khẩu", exact=True)).to_be_focused()
        assert_accessible(page, "đăng nhập có lỗi xác thực")

        login(page)
        expect(page.get_by_role("link", name="Neko Đoàn — về trang chính")).to_be_visible()
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
        expect(page.get_by_role("heading", name="Bảng Tổng", exact=True)).to_be_visible()
        expect(page.get_by_text("55 dòng tính điểm", exact=True)).to_be_visible()
        expect(page.get_by_text("4 khối", exact=True).first).to_be_visible()
        expect(page.get_by_text("134 đơn vị", exact=True)).to_be_visible()
        expect(page.locator("tbody tr")).to_have_count(10)
        assert_accessible(page, "Bảng Tổng và phân công")
        page.get_by_role("button", name="I.01", exact=True).click()
        expect(page.get_by_role("heading", name="Thiết lập tiêu chí", exact=True)).to_be_visible()
        empty_assignment = page.get_by_text(
            "Superadmin cần tạo Tổ và tài khoản cán bộ trước khi phân công."
        )
        if empty_assignment.count():
            expect(empty_assignment).to_be_visible()
        else:
            review_group = page.get_by_role("group", name="Phân công người chấm")
            team_select = review_group.locator("select").first
            expect(team_select).to_be_enabled()
            if team_select.locator("option").count() < 2:
                raise AssertionError("Roster nguồn đã provision nhưng không có trong lựa chọn phân công")
            team_select.select_option(label="Tổ Trường học (TH) · 5 cán bộ chấm")
            expect(page.get_by_text("Ngô Quang Cường", exact=True).first).to_be_visible()
            reviewer_select = review_group.locator("select").nth(1)
            expect(reviewer_select).to_be_enabled()
            if reviewer_select.locator("option").count() != 6:
                raise AssertionError(
                    "Tổ Trường học phải có năm cán bộ chấm khả dụng, gồm người theo dõi Tổ"
                )
            page.screenshot(path=ARTIFACTS / "assignment-drawer-source-roster.png", full_page=True)
        assert_accessible(page, "ngăn phân công")
        page.get_by_role("button", name="Đóng", exact=True).click()
        page.get_by_placeholder("Tìm mã, nội dung, người chấm...").fill("I.21.5")
        expect(page.locator("tbody tr")).to_have_count(1)
        expect(page.get_by_role("button", name="I.21", exact=True)).to_be_visible()
        page.get_by_placeholder("Tìm mã, nội dung, người chấm...").fill("")
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
        expect(page.get_by_label("Danh sách đơn vị")).to_be_visible()
        expect(page.get_by_label("Danh sách tổ theo dõi")).to_be_visible()
        expect(page.locator(".section-heading span")).to_have_count(2)
        assert_accessible(page, "cơ cấu tổ chức")

        page.goto(f"{BASE_URL}/superadmin/results")
        expect(page.get_by_role("heading", name="Chiến dịch Thanh niên tình nguyện Hè 2026")).to_be_visible()
        expect(page.get_by_text("Chưa có snapshot kết quả", exact=True).first).to_be_visible()
        assert_accessible(page, "kết quả và đối soát")

        page.goto(f"{BASE_URL}/duong-dan-khong-ton-tai")
        expect(page.get_by_role("heading", name="Không tìm thấy trang")).to_be_visible()
        assert_accessible(page, "không tìm thấy trang")

        page.goto(f"{BASE_URL}/admin/scorecard-templates")
        expect(page.get_by_role("heading", name="Bảng Tổng", exact=True)).to_be_visible()
        expect(page.locator(".admin-topbar__context")).not_to_be_attached()
        expect(page.locator(".admin-topbar__actions")).not_to_be_attached()
        expect(page.get_by_role("heading", name="Bảng điều hành", exact=True)).not_to_be_attached()
        sidebar = page.locator(".admin-sidebar")
        expanded_sidebar_width = sidebar.evaluate("element => element.getBoundingClientRect().width")
        page.get_by_role("button", name="Thu gọn thanh điều hướng", exact=True).click()
        page.wait_for_function(
            "document.querySelector('.admin-sidebar').getBoundingClientRect().width <= 90"
        )
        collapsed_sidebar_width = sidebar.evaluate("element => element.getBoundingClientRect().width")
        if expanded_sidebar_width < 300 or collapsed_sidebar_width > 90:
            raise AssertionError("Nút thu gọn không chuyển sidebar desktop từ 304px về 88px")
        page.get_by_role("button", name="Mở rộng thanh điều hướng", exact=True).click()

        profile_button = page.get_by_role("button", name="Mở tài khoản hiện tại", exact=True)
        profile_button.click()
        expect(page.get_by_role("dialog", name="Tài khoản hiện tại")).to_be_visible()
        page.get_by_role("heading", name="Bảng Tổng", exact=True).click()
        expect(page.get_by_role("dialog", name="Tài khoản hiện tại")).not_to_be_attached()

        profile_button.click()
        page.get_by_role("link", name="Phiên bản", exact=True).click()
        expect(page).to_have_url(f"{BASE_URL}/admin/versions")
        expect(page.get_by_role("dialog", name="Tài khoản hiện tại")).not_to_be_attached()
        page.goto(f"{BASE_URL}/admin/scorecard-templates")
        expect(page.get_by_role("heading", name="Bảng Tổng", exact=True)).to_be_visible()
        table_scroll_metrics = page.locator(".table-scroll").evaluate(
            """
            element => ({
              clientHeight: element.clientHeight,
              scrollHeight: element.scrollHeight,
              overflowY: getComputedStyle(element).overflowY
            })
            """
        )
        if table_scroll_metrics["overflowY"] in ("auto", "scroll"):
            raise AssertionError("Bảng Tổng vẫn tạo vùng cuộn dọc lồng bên trong trang")
        if table_scroll_metrics["scrollHeight"] > table_scroll_metrics["clientHeight"] + 1:
            raise AssertionError("Nội dung Bảng Tổng vẫn bị cắt trong vùng cuộn nội bộ")
        if page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"):
            raise AssertionError("Bảng Tổng desktop bị tràn ngang toàn trang")

        compact = context.new_page()
        compact.set_viewport_size({"width": 910, "height": 698})
        compact.goto(f"{BASE_URL}/admin/scorecard-templates")
        compact.wait_for_load_state("networkidle")
        expect(compact.get_by_role("button", name="Mở điều hướng", exact=True)).to_be_visible()
        expect(compact.locator(".admin-topbar__context")).not_to_be_attached()
        expect(compact.locator(".admin-topbar__actions")).not_to_be_attached()
        compact.get_by_role("button", name="Mở điều hướng", exact=True).click()
        expect(
            compact.get_by_role("button", name="Thu gọn thanh điều hướng", exact=True)
        ).to_be_visible()
        compact.get_by_role("button", name="Thu gọn thanh điều hướng", exact=True).click()
        expect(compact.locator(".admin-shell")).not_to_have_class(
            re.compile(r".*admin-shell--drawer-open.*")
        )
        compact.get_by_role("button", name="Mở điều hướng", exact=True).click()
        compact.get_by_role("button", name="Mở tài khoản hiện tại", exact=True).click()
        expect(compact.get_by_role("dialog", name="Tài khoản hiện tại")).to_be_visible()
        compact.keyboard.press("Escape")
        expect(compact.get_by_role("dialog", name="Tài khoản hiện tại")).not_to_be_attached()
        expect(compact.locator(".admin-shell")).to_have_class(
            re.compile(r".*admin-shell--drawer-open.*")
        )
        compact.keyboard.press("Escape")
        expect(compact.locator(".admin-shell")).not_to_have_class(
            re.compile(r".*admin-shell--drawer-open.*")
        )
        compact_metrics = compact.locator(".table-scroll").evaluate(
            """
            element => ({
              clientHeight: element.clientHeight,
              scrollHeight: element.scrollHeight,
              overflowY: getComputedStyle(element).overflowY
            })
            """
        )
        if compact_metrics["overflowY"] in ("auto", "scroll"):
            raise AssertionError("Bảng Tổng 910px vẫn có thanh cuộn dọc thứ hai")
        if compact.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"):
            raise AssertionError("Bảng Tổng 910px bị tràn ngang toàn trang")
        compact.screenshot(path=ARTIFACTS / "scorecard-operational-compact.png", full_page=True)
        compact.close()

        design_view = context.new_page()
        design_view.set_viewport_size({"width": 1670, "height": 939})
        design_view.goto(f"{BASE_URL}/admin/scorecard-templates")
        design_view.wait_for_load_state("networkidle")
        design_view.get_by_role("button", name="I.01", exact=True).click()
        expect(design_view.get_by_label("Thiết lập tiêu chí")).to_be_visible()
        expect(design_view.locator(".inspector-scrim")).not_to_be_attached()
        design_view.screenshot(
            path=ARTIFACTS / "scorecard-operational-desktop-inspector.png",
            full_page=False,
        )
        design_view.close()

        reference_view = browser.new_page(
            viewport={"width": 1448, "height": 1086},
            ignore_https_errors=BASE_URL.startswith("https://"),
            reduced_motion="reduce",
        )
        reference_view.goto(f"{BASE_URL}/login")
        reference_view.wait_for_load_state("networkidle")
        reference_view.get_by_label("Tên đăng nhập", exact=True).fill("superadmin")
        reference_view.get_by_role("button", name="Tiếp tục", exact=True).click()
        reference_view.get_by_label("Mật khẩu", exact=True).fill("mat-khau-kiem-tra")
        expect(reference_view.get_by_role("button", name="Quay lại", exact=True)).to_be_visible()
        reference_view.screenshot(
            path=ARTIFACTS / "login-password-reference-viewport.png", full_page=True
        )

        tablet = browser.new_page(
            viewport={"width": 1024, "height": 768},
            ignore_https_errors=BASE_URL.startswith("https://"),
            reduced_motion="reduce",
        )
        tablet.goto(f"{BASE_URL}/login")
        tablet.wait_for_load_state("networkidle")
        expect(tablet.get_by_label("Tên đăng nhập", exact=True)).to_be_focused()
        assert_accessible(tablet, "đăng nhập tablet")
        if tablet.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"):
            raise AssertionError("Trang đăng nhập tablet bị tràn ngang")
        tablet.screenshot(path=ARTIFACTS / "login-tablet.png", full_page=True)

        mobile = browser.new_page(
            viewport={"width": 390, "height": 844},
            ignore_https_errors=BASE_URL.startswith("https://"),
            reduced_motion="reduce",
        )
        mobile.goto(f"{BASE_URL}/login")
        mobile.wait_for_load_state("networkidle")
        expect(mobile).to_have_url(f"{BASE_URL}/login")
        expect(
            mobile.get_by_role("heading", name="Đăng nhập vào Neko Đoàn", exact=True)
        ).to_be_visible()
        assert_accessible(mobile, "đăng nhập mobile")
        if mobile.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"):
            raise AssertionError("Trang đăng nhập mobile bị tràn ngang")
        mobile.screenshot(path=ARTIFACTS / "login-mobile.png", full_page=True)
        login(mobile)
        mobile.goto(f"{BASE_URL}/superadmin/scorecards")
        expect(mobile.get_by_role("heading", name="Bảng Tổng", exact=True)).to_be_visible()
        assert_accessible(mobile, "Bảng Tổng mobile")
        mobile.screenshot(path=ARTIFACTS / "source-scorecard-mobile.png", full_page=True)

        page.goto(f"{BASE_URL}/superadmin/lifecycle")
        page.get_by_role("button", name="Mở tài khoản").click()
        expect(page.get_by_role("dialog", name="Tài khoản hiện tại")).to_be_visible()
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
