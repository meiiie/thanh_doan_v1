import Link from "next/link";
import type { Actor } from "./auth";
import type { Campaign } from "@/db/app";
import { PHASES, phaseIndex } from "@/domain/workflow.mjs";

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Chủ hệ thống",
  ADMIN: "Quản trị chiến dịch",
  TEAM_LEAD: "Trưởng tổ",
  REVIEWER: "Chuyên viên chấm",
  UNIT: "Đơn vị",
  AUDITOR: "Kiểm tra",
};

const phaseLabels: Record<string, string> = {
  DRAFT: "Chuẩn bị",
  SELF_ASSESSMENT: "Tự chấm",
  ROUND1: "Chấm vòng 1",
  ROUND1_RELEASED: "Công bố vòng 1",
  EXPLANATION: "Giải trình",
  ROUND2: "Chấm vòng 2",
  FINALIZED: "Đã chốt",
  ARCHIVED: "Lưu trữ",
};

export function AppShell({
  actor,
  campaign,
  active,
  children,
}: {
  actor: Actor;
  campaign?: Campaign;
  active: "dashboard" | "scorecard" | "review" | "admin" | "audit";
  children: React.ReactNode;
}) {
  const demo = actor.demo ? `?demo=${encodeURIComponent(actor.demo)}` : "";
  const nav = [
    { key: "dashboard", href: `/${demo}`, label: "Tổng quan", show: true },
    {
      key: "scorecard",
      href: `/scorecard${demo}`,
      label: "Bảng điểm",
      show: actor.role === "UNIT",
    },
    {
      key: "review",
      href: `/review${demo}`,
      label: "Hàng chờ chấm",
      show: ["SUPER_ADMIN", "ADMIN", "TEAM_LEAD", "REVIEWER"].includes(actor.role),
    },
    {
      key: "admin",
      href: `/admin${demo}`,
      label: "Điều hành",
      show: ["SUPER_ADMIN", "ADMIN", "AUDITOR"].includes(actor.role),
    },
    {
      key: "audit",
      href: `/audit${demo}`,
      label: "Nhật ký",
      show: ["SUPER_ADMIN", "ADMIN", "AUDITOR"].includes(actor.role),
    },
  ];

  return (
    <div className="app-frame">
      <header className="topbar">
        <Link href={`/${demo}`} className="brand" aria-label="Về tổng quan">
          <span className="brand-mark" aria-hidden="true">Đ</span>
          <span>
            <strong>Điều hành chiến dịch</strong>
            <small>Thành đoàn Hải Phòng</small>
          </span>
        </Link>
        <div className="account">
          <span className="account-copy">
            <strong>{actor.displayName}</strong>
            <small>{roleLabels[actor.role] ?? actor.role}</small>
          </span>
          <span className="avatar" aria-hidden="true">
            {initials(actor.displayName)}
          </span>
        </div>
      </header>

      <div className="shell">
        <aside className="sidebar">
          <nav aria-label="Điều hướng chính">
            {nav.filter((item) => item.show).map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={active === item.key ? "nav-link active" : "nav-link"}
                aria-current={active === item.key ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {actor.demo && (
            <div className="demo-switch">
              <span>Chế độ kiểm thử cục bộ</span>
              <Link href="/?demo=admin">Quản trị</Link>
              <Link href="/?demo=reviewer">Chuyên viên</Link>
              <Link href="/?demo=unit">Đơn vị</Link>
            </div>
          )}
        </aside>

        <main id="main-content" className="main">
          {campaign && <PhaseRail campaign={campaign} />}
          {children}
        </main>
      </div>
    </div>
  );
}

export function PhaseRail({ campaign }: { campaign: Campaign }) {
  const current = phaseIndex(campaign.phase);
  const visiblePhases = PHASES.filter((phase) => !["DRAFT", "ARCHIVED"].includes(phase));
  return (
    <section className="phase-panel" aria-labelledby="campaign-title">
      <div>
        <p className="eyebrow">Chiến dịch đang vận hành</p>
        <h1 id="campaign-title">{campaign.name}</h1>
        <p className="phase-meta">
          Phiên bản bảng điểm {campaign.scorecardVersion} · Hạn tự chấm{" "}
          <time dateTime={campaign.selfDeadline}>{formatDateTime(campaign.selfDeadline)}</time>
        </p>
      </div>
      <ol className="phase-rail" aria-label="Tiến độ chiến dịch">
        {visiblePhases.map((phase) => {
          const index = phaseIndex(phase);
          const state = index < current ? "done" : index === current ? "current" : "next";
          return (
            <li key={phase} className={state} aria-current={state === "current" ? "step" : undefined}>
              <span className="phase-dot" aria-hidden="true" />
              <span>{phaseLabels[phase]}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function Notice({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (!error && !success) return null;
  return (
    <div className={error ? "notice error" : "notice success"} role={error ? "alert" : "status"}>
      <strong>{error ? "Chưa thể thực hiện" : "Đã hoàn tất"}</strong>
      <span>{error ? errorMessage(error) : successMessage(success ?? "")}</span>
    </div>
  );
}

export function AccessDenied() {
  return (
    <main className="access-page">
      <div className="access-card">
        <span className="brand-mark large" aria-hidden="true">Đ</span>
        <p className="eyebrow">Truy cập có kiểm soát</p>
        <h1>Tài khoản chưa được cấp quyền</h1>
        <p>
          Hãy đăng nhập bằng tài khoản đã được quản trị chiến dịch thêm vào danh sách.
          Nếu đây là lần triển khai đầu tiên, chủ sở hữu Site cần truy cập trước.
        </p>
      </div>
    </main>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    DRAFT: "Đang làm",
    SUBMITTED: "Đã nộp",
    LOCKED: "Đã khóa",
    EXPLAINED: "Đã giải trình",
    FINALIZED: "Đã chốt",
  };
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <span aria-hidden="true" />
      {labels[status] ?? status}
    </span>
  );
}

export function IdempotencyField() {
  return <input type="hidden" name="idempotencyKey" value={crypto.randomUUID()} />;
}

export function returnTo(path: string, actor: Actor) {
  return actor.demo
    ? `${path}${path.includes("?") ? "&" : "?"}demo=${encodeURIComponent(actor.demo)}`
    : path;
}

export function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export function classificationLabel(value: string | null) {
  const labels: Record<string, string> = {
    EXCELLENT_CANDIDATE: "Có khả năng đạt xuất sắc",
    ADVANCED: "Tiên tiến",
    COMPLETED: "Hoàn thành",
    NOT_COMPLETED: "Không hoàn thành",
  };
  return value ? labels[value] ?? value : "—";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function errorMessage(code: string) {
  const messages: Record<string, string> = {
    FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
    READ_ONLY: "Hồ sơ đang ở trạng thái chỉ đọc.",
    INVALID_SCORE: "Điểm phải nằm trong khung và dùng bước 0,5.",
    INVALID_PHASE: "Thao tác không phù hợp với giai đoạn hiện tại.",
    INVALID_TRANSITION: "Không thể chuyển trực tiếp tới giai đoạn đã chọn.",
    DEDUCTION_REASON_REQUIRED: "Khi chấm thấp hơn tự chấm, cần ghi rõ lý do.",
    INCOMPLETE_SCORECARD: "Hãy hoàn thành tất cả tiêu chí trước khi nộp.",
    ALREADY_SUBMITTED: "Hồ sơ này đã được nộp.",
    HTTPS_URL_REQUIRED: "Link minh chứng phải bắt đầu bằng https://.",
    INVALID_URL: "Link minh chứng không hợp lệ.",
    EXPLANATION_REQUIRED: "Nội dung giải trình không được để trống.",
    REVIEWS_INCOMPLETE: "Còn tiêu chí chưa được chấm nên chưa thể chốt chiến dịch.",
    DUPLICATE_ACTION: "Thao tác này đã được ghi nhận trước đó.",
    INVALID_EMAIL: "Địa chỉ email không hợp lệ.",
    DISPLAY_NAME_REQUIRED: "Cần nhập tên hiển thị.",
    UNIT_REQUIRED: "Tài khoản đơn vị phải được gắn với một đơn vị.",
    DEADLINE_PASSED: "Đã quá hạn tự chấm; hồ sơ đã chuyển sang chỉ đọc.",
    REOPEN_REASON_REQUIRED: "Cần ghi rõ lý do trước khi mở lại vòng 2.",
    RESERVED_EMAIL: "Không thể dùng miền email dành riêng cho kiểm thử cục bộ.",
    ROLE_GRANT_FORBIDDEN: "Chỉ Chủ hệ thống được cấp hoặc thay đổi quyền quản trị/kiểm tra.",
    USER_NOT_FOUND: "Không tìm thấy tài khoản cần cập nhật.",
    CANNOT_DEACTIVATE_SELF: "Bạn không thể tự vô hiệu hóa tài khoản đang dùng.",
    CANNOT_CHANGE_OWNER: "Không thể thay đổi Chủ hệ thống tại màn hình này.",
    CAMPAIGN_NAME_REQUIRED: "Tên chiến dịch không được để trống.",
    INVALID_DEADLINE: "Thời hạn không hợp lệ.",
    DEADLINE_MUST_BE_FUTURE: "Thời hạn tự chấm phải nằm trong tương lai.",
    NOT_APPLICABLE: "Tiêu chí này đã được đánh dấu không áp dụng cho đơn vị.",
  };
  return messages[code] ?? "Có lỗi xảy ra. Dữ liệu trước đó vẫn được giữ nguyên.";
}

function successMessage(code: string) {
  const messages: Record<string, string> = {
    saved: "Thay đổi đã được lưu và ghi vào nhật ký.",
    submitted: "Hồ sơ đã nộp và chuyển sang chỉ đọc.",
    transitioned: "Giai đoạn chiến dịch đã được cập nhật.",
    userAdded: "Tài khoản đã được thêm vào danh sách quyền.",
    userStatusChanged: "Trạng thái truy cập của tài khoản đã được cập nhật.",
    campaignUpdated: "Tên chiến dịch và hạn tự chấm đã được cập nhật.",
    applicabilityChanged: "Phạm vi áp dụng tiêu chí đã được cập nhật và ghi audit.",
  };
  return messages[code] ?? "Thao tác đã được ghi nhận.";
}
