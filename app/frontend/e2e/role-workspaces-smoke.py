from __future__ import annotations

import json
import os
import re
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import Page, expect, sync_playwright


expect.set_options(timeout=10_000)

BASE_URL = os.environ.get("ADMIN_BASE_URL", "http://127.0.0.1:4317").rstrip("/")
FRONTEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = FRONTEND_ROOT.parents[1]
MANIFEST = PROJECT_ROOT / ".tmp" / "local-uat-accounts.json"
AXE_PATH = FRONTEND_ROOT / "node_modules" / "axe-core" / "axe.min.js"
ARTIFACTS = FRONTEND_ROOT / "artifacts"
HEADINGS = {
    "SUPERADMIN": "Chiến dịch TNTN Hè 2026",
    "CAMPAIGN_ADMIN": "Bảng Tổng",
    "REVIEWER": "Công việc chấm",
    "UNIT_MEMBER": "Công việc được giao",
}


def assert_accessible(page: Page, label: str) -> None:
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
    if result["violations"]:
        summaries = [
            f"{item['id']} ({item.get('impact')}): {item['help']} -> "
            + ", ".join(", ".join(node["target"]) for node in item["nodes"][:3])
            for item in result["violations"]
        ]
        raise AssertionError(f"A11y {label}:\n" + "\n".join(summaries))


def route_path(route: str) -> str:
    parsed = urlsplit(route)
    return parsed.path or "/"


def login(page: Page, username: str, password: str) -> None:
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")
    page.get_by_label("Tên đăng nhập", exact=True).fill(username)
    page.get_by_role("button", name="Tiếp tục", exact=True).click()
    page.get_by_label("Mật khẩu", exact=True).fill(password)
    page.get_by_role("button", name="Đăng nhập", exact=True).click()


def run() -> None:
    if not MANIFEST.exists():
        raise RuntimeError(
            f"Thiếu {MANIFEST}. Hãy chạy ops/provision-local-uat-accounts.ps1 trước."
        )
    if not AXE_PATH.exists():
        raise RuntimeError(f"Thiếu axe-core: {AXE_PATH}. Hãy chạy npm install trong app/frontend.")

    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    superadmin = manifest["superadmin"]
    superadmin_password = Path(superadmin["passwordFile"]).read_text(encoding="utf-8").strip()
    accounts = [
        {
            "username": superadmin["username"],
            "password": superadmin_password,
            "role": "SUPERADMIN",
            "route": superadmin["route"],
        },
        *manifest["accounts"],
    ]
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            for entry in accounts:
                viewport = (
                    {"width": 1672, "height": 941}
                    if entry["role"] == "CAMPAIGN_ADMIN"
                    else {"width": 1512, "height": 982}
                )
                context = browser.new_context(
                    viewport=viewport,
                    ignore_https_errors=True,
                    reduced_motion="reduce",
                )
                page = context.new_page()
                console_errors: list[str] = []
                page.on(
                    "console",
                    lambda message: console_errors.append(message.text)
                    if message.type == "error"
                    else None,
                )
                page.on(
                    "pageerror", lambda error: console_errors.append(f"pageerror: {error}")
                )

                path = route_path(entry["route"])
                login(page, entry["username"], entry["password"])
                expect(page).to_have_url(f"{BASE_URL}{path}")
                if entry["role"] == "SUPERADMIN":
                    expect(page.locator(".status-page h1")).to_be_visible()
                else:
                    expect(
                        page.get_by_role("heading", name=HEADINGS[entry["role"]], exact=True)
                    ).to_be_visible()
                expect(page.locator(".admin-topbar__context")).not_to_be_attached()
                expect(page.locator(".admin-topbar__actions")).not_to_be_attached()
                expect(page.locator("[data-profile-topbar]")).not_to_be_attached()
                assert_accessible(page, f"workspace {entry['role']}")
                if page.evaluate(
                    "document.documentElement.scrollWidth > document.documentElement.clientWidth"
                ):
                    raise AssertionError(f"Workspace {entry['role']} bị tràn ngang")

                if entry["role"] == "SUPERADMIN":
                    expect(page.locator(".admin-nav").get_by_role("link")).to_have_count(8)
                    for label in (
                        "Tổng quan",
                        "Bảng Tổng",
                        "Phiên bản",
                        "Điều hành chấm",
                        "Kết quả & đối soát",
                        "Tổ & cán bộ",
                        "Cơ cấu tổ chức",
                        "Tài khoản & quyền",
                    ):
                        expect(page.get_by_role("link", name=label, exact=True)).to_be_visible()
                    expect(page.locator(".role-card")).not_to_be_attached()
                    expect(page.locator("[data-sidebar-width-toggle]")).to_be_visible()

                    page.goto(f"{BASE_URL}/superadmin/versions")
                    expect(page.get_by_role("heading", name="Phiên bản", exact=True)).to_be_visible()
                    expect(page.get_by_role("link", name="Mở Bảng Tổng", exact=True)).to_have_attribute(
                        "href", "/superadmin/scorecards"
                    )
                    page.goto(f"{BASE_URL}/superadmin/review-control")
                    expect(page.get_by_role("heading", name=re.compile(r"^Chấm vòng [12]$"))).to_be_visible()
                    assert_accessible(page, "workspace SUPERADMIN điều hành chấm")
                    page.screenshot(
                        path=ARTIFACTS / "superadmin-review-control-desktop.png",
                        full_page=True,
                    )
                    page.goto(f"{BASE_URL}/superadmin/teams")
                    expect(page.get_by_role("heading", name="Tổ & cán bộ", exact=True)).to_be_visible()
                    assert_accessible(page, "workspace SUPERADMIN Tổ và cán bộ")
                    page.goto(f"{BASE_URL}{path}")

                elif entry["role"] == "CAMPAIGN_ADMIN":
                    expect(page.locator(".admin-nav").get_by_role("link")).to_have_count(6)
                    expect(page.get_by_role("link", name="Tổng quan", exact=True)).to_be_visible()
                    expect(page.get_by_role("link", name="Bảng Tổng", exact=True)).to_be_visible()
                    expect(page.get_by_role("link", name="Phiên bản", exact=True)).to_be_visible()
                    expect(page.get_by_role("link", name="Kết quả & đối soát", exact=True)).to_be_visible()
                    expect(page.get_by_role("link", name="Tổ & cán bộ", exact=True)).to_be_visible()
                    expect(page.get_by_role("link", name="Điều hành chấm", exact=True)).to_be_visible()
                    expect(page.get_by_text("Hải Phòng", exact=True)).to_be_visible()
                    expect(page.get_by_text("Admin chiến dịch", exact=True)).to_be_visible()
                    expect(page.get_by_text("55 dòng tính điểm", exact=True)).to_be_visible()
                    expect(page.get_by_text("4 khối", exact=True).first).to_be_visible()
                    expect(page.get_by_text("134 đơn vị", exact=True)).to_be_visible()
                    expect(page.locator("tbody tr")).to_have_count(10)

                    page.screenshot(
                        path=ARTIFACTS / "campaign-admin-master-scorecard-reference-viewport.png"
                    )

                    page.locator(".section-tabs button", has_text="Điểm thưởng").click()
                    expect(page.locator("tbody tr")).to_have_count(5)
                    page.locator(".section-tabs button", has_text="Tất cả").click()
                    expect(page.locator("tbody tr")).to_have_count(10)
                    page.get_by_role("button", name="2", exact=True).click()
                    expect(page.get_by_text("Hiển thị 11–20 của 27 tiêu chí", exact=True)).to_be_visible()
                    page.get_by_role("button", name="1", exact=True).click()
                    page.get_by_role("checkbox", name="Chọn tiêu chí I.01", exact=True).check()
                    expect(page.get_by_role("region", name="Thao tác với tiêu chí đã chọn")).to_be_visible()
                    expect(page.get_by_text("1 tiêu chí đã chọn", exact=True)).to_be_visible()
                    page.get_by_role("button", name="Phân bổ", exact=True).click()
                    expect(page.get_by_role("group", name="Phân bổ phạm vi áp dụng")).to_be_visible()
                    expect(page.get_by_role("group", name="Phân công người chấm")).not_to_be_attached()
                    page.get_by_role("button", name="Đóng", exact=True).click()
                    page.get_by_role("button", name="Phân công", exact=True).click()
                    expect(page.get_by_role("group", name="Phân công người chấm")).to_be_visible()
                    expect(page.get_by_role("group", name="Phân bổ phạm vi áp dụng")).not_to_be_attached()
                    page.get_by_role("button", name="Đóng", exact=True).click()

                    page.goto(f"{BASE_URL}/admin/versions")
                    expect(page.get_by_role("heading", name="Phiên bản", exact=True)).to_be_visible()
                    assert_accessible(page, "workspace CAMPAIGN_ADMIN phiên bản")
                    page.goto(f"{BASE_URL}{path}")
                    expect(page.get_by_role("heading", name="Bảng Tổng", exact=True)).to_be_visible()

                    page.goto(f"{BASE_URL}/admin/review-control")
                    expect(page.get_by_role("heading", name="Chấm vòng 1", exact=True)).to_be_visible()
                    assert_accessible(page, "workspace CAMPAIGN_ADMIN điều hành chấm")
                    page.screenshot(
                        path=ARTIFACTS / "campaign-admin-review-control-desktop.png",
                        full_page=True,
                    )
                    page.goto(f"{BASE_URL}{path}")

                    page.get_by_role("button", name="I.01", exact=True).click()
                    review_group = page.get_by_role("group", name="Phân công người chấm")
                    review_group.locator("select").first.select_option(
                        label="Tổ Trường học (TH) · 5 cán bộ chấm"
                    )
                    expect(page.get_by_role("link", name="Xem Tổ", exact=True)).to_be_visible()
                    page.get_by_role("link", name="Xem Tổ", exact=True).click()
                    expect(page).to_have_url(
                        re.compile(rf"^{re.escape(BASE_URL)}/admin/teams\?team=review-team-")
                    )
                    expect(page.get_by_role("heading", name="Tổ & cán bộ", exact=True)).to_be_visible()
                    expect(page.get_by_text("Chỉ xem", exact=True)).to_be_visible()
                    team_buttons = page.get_by_role(
                        "navigation", name="Danh sách Tổ chuyên môn"
                    ).get_by_role("button")
                    expect(team_buttons.nth(4)).to_be_visible()
                    if team_buttons.count() < 5:
                        raise AssertionError("Roster nguồn phải có đủ năm Tổ chuyên môn")
                    expect(page.get_by_role("heading", name="Tổ Trường học (TH)", exact=True)).to_be_visible()
                    expect(page.get_by_role("heading", name="Theo dõi Tổ (SubAdmin1)", exact=True)).to_be_visible()
                    expect(page.get_by_text("Ngô Quang Cường", exact=True)).to_be_visible()
                    expect(page.get_by_role("button", name="Tạo tài khoản", exact=True)).not_to_be_attached()
                    expect(page.get_by_role("button", name="Xóa", exact=True)).not_to_be_attached()
                    assert_accessible(page, "workspace CAMPAIGN_ADMIN Tổ và cán bộ")
                    page.screenshot(
                        path=ARTIFACTS / "campaign-admin-team-directory-desktop.png",
                        full_page=True,
                    )

                    page.get_by_role("tab", name="Cán bộ", exact=True).click()
                    member_rows = page.locator(".member-table-row")
                    expect(member_rows.first).to_be_visible()
                    if member_rows.count() < 25:
                        raise AssertionError("Roster nguồn phải có đủ 25 cán bộ")
                    page.get_by_placeholder("Tìm Tổ hoặc cán bộ").fill("Ngô Quang Cường")
                    expect(page.locator(".member-table-row")).to_have_count(1)
                    expect(page.get_by_text("Ngô Quang Cường", exact=True)).to_be_visible()
                    page.get_by_placeholder("Tìm Tổ hoặc cán bộ").fill("")

                elif entry["role"] == "REVIEWER":
                    expect(page.locator(".admin-nav").get_by_role("link")).to_have_count(3)
                    expect(page.get_by_role("link", name="Công việc chấm", exact=True)).to_be_visible()
                    expect(page.get_by_role("link", name="Lịch sử chấm", exact=True)).to_be_visible()
                    expect(page.get_by_role("link", name="Kết quả", exact=True)).to_be_visible()
                    assert_accessible(page, "workspace REVIEWER công việc chấm")
                    page.screenshot(
                        path=ARTIFACTS / "reviewer-criterion-worklist-desktop.png",
                        full_page=True,
                    )

                elif entry["role"] == "UNIT_MEMBER":
                    expect(page.locator(".admin-nav").get_by_role("link")).to_have_count(3)
                    expect(page.get_by_role("link", name="Tự chấm", exact=True)).to_be_visible()
                    expect(page.get_by_role("link", name="Giải trình", exact=True)).to_be_visible()
                    expect(page.get_by_role("link", name="Kết quả cuối", exact=True)).to_be_visible()
                    page.goto(f"{BASE_URL}/unit/results")
                    expect(page.get_by_role("heading", name="Giải trình", exact=True)).to_be_visible()
                    assert_accessible(page, "workspace UNIT_MEMBER giải trình")
                    page.screenshot(
                        path=ARTIFACTS / "unit-explanation-desktop.png",
                        full_page=True,
                    )
                    page.goto(f"{BASE_URL}/unit/final")
                    expect(page.get_by_role("heading", name="Kết quả cuối", exact=True)).to_be_visible()
                    expect(page.get_by_text("Chưa công bố kết quả cuối", exact=True)).to_be_visible()
                    assert_accessible(page, "workspace UNIT_MEMBER kết quả cuối")
                    page.screenshot(
                        path=ARTIFACTS / "unit-final-results-desktop.png",
                        full_page=True,
                    )

                compact_page = context.new_page()
                compact_page.set_viewport_size({"width": 910, "height": 698})
                compact_page.goto(f"{BASE_URL}{path}")
                compact_page.wait_for_load_state("networkidle")
                expect(
                    compact_page.get_by_role("button", name="Mở điều hướng", exact=True)
                ).to_be_visible()
                if entry["role"] == "SUPERADMIN":
                    compact_page.get_by_role(
                        "button", name="Mở điều hướng", exact=True
                    ).click()
                    compact_page.get_by_role(
                        "link", name="Điều hành chấm", exact=True
                    ).click()
                    expect(compact_page).to_have_url(
                        f"{BASE_URL}/superadmin/review-control"
                    )
                    expect(
                        compact_page.get_by_role(
                            "heading", name=re.compile(r"^Chấm vòng [12]$")
                        )
                    ).to_be_visible()
                    expect(compact_page.locator(".sidebar-scrim")).not_to_be_visible()
                expect(compact_page.locator(".admin-topbar__context")).not_to_be_attached()
                expect(compact_page.locator(".admin-topbar__actions")).not_to_be_attached()
                expect(compact_page.locator("[data-profile-topbar]")).not_to_be_attached()
                assert_accessible(compact_page, f"workspace {entry['role']} compact")
                if compact_page.evaluate(
                    "document.documentElement.scrollWidth > document.documentElement.clientWidth"
                ):
                    raise AssertionError(f"Workspace compact {entry['role']} bị tràn ngang")
                compact_page.screenshot(
                    path=ARTIFACTS / f"{entry['role'].lower()}-compact-header.png",
                    full_page=True,
                )
                compact_page.close()

                profile_button = page.locator("[data-profile-sidebar]")
                if not profile_button.is_visible():
                    profile_button = page.get_by_role("button", name="Mở tài khoản", exact=True)
                profile_button.click()
                if entry["role"] == "SUPERADMIN":
                    expect(page.locator("#account-menu").get_by_role("link")).to_have_count(0)
                with page.expect_response(
                    lambda response: response.url.endswith("/api/auth/logout")
                ) as logout_info:
                    page.get_by_role("button", name="Đăng xuất", exact=True).click()
                if logout_info.value.status != 200:
                    raise AssertionError(
                        f"Logout {entry['role']} trả HTTP {logout_info.value.status}"
                    )
                expect(page).to_have_url(f"{BASE_URL}/login?reason=logged-out")
                if any(cookie["name"] == "CAMPAIGN_SESSION" for cookie in context.cookies()):
                    raise AssertionError(f"Workspace {entry['role']} còn cookie phiên sau logout")
                unexpected_errors = [
                    error
                    for error in console_errors
                    if not ("Failed to load resource" in error and "401" in error)
                ]
                if unexpected_errors:
                    raise AssertionError(
                        f"Lỗi trình duyệt {entry['role']}:\n" + "\n".join(unexpected_errors)
                    )
                context.close()
        finally:
            browser.close()


if __name__ == "__main__":
    run()
