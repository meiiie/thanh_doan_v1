import type { Metadata } from "next";
import { getActor, isAdmin } from "../auth";
import { getAudit, getCampaign } from "@/db/app";
import {
  AccessDenied,
  AppShell,
  Notice,
  formatDateTime,
} from "../ui";

export const metadata: Metadata = { title: "Nhật ký" };
export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

const actionLabels: Record<string, string> = {
  BOOTSTRAP_OWNER: "Khởi tạo chủ sở hữu",
  ASSESSMENT_SAVED: "Lưu tự chấm",
  UNIT_SUBMITTED: "Nộp hồ sơ đơn vị",
  REVIEW_ROUND_1_SAVED: "Lưu điểm vòng 1",
  REVIEW_ROUND_2_SAVED: "Lưu điểm vòng 2",
  EXPLANATION_SAVED: "Lưu giải trình",
  CAMPAIGN_PHASE_CHANGED: "Chuyển giai đoạn",
  CAMPAIGN_FINALIZED: "Chốt chiến dịch",
  CAMPAIGN_REOPENED: "Mở lại vòng 2",
  AUTO_DEADLINE_LOCKED: "Tự động khóa khi hết hạn",
  USER_ACCESS_UPDATED: "Cập nhật quyền tài khoản",
  USER_ACTIVATED: "Kích hoạt tài khoản",
  USER_DEACTIVATED: "Vô hiệu hóa tài khoản",
  CAMPAIGN_SETTINGS_UPDATED: "Cập nhật cấu hình chiến dịch",
  DATA_EXPORTED: "Xuất dữ liệu",
  ASSESSMENT_APPLICABILITY_CHANGED: "Đổi phạm vi áp dụng tiêu chí",
  USER_CREATED: "Tạo tài khoản",
};

export default async function AuditPage({ searchParams }: { searchParams: Search }) {
  const search = await searchParams;
  const actor = await getActor(text(search.demo));
  if (!actor || (!isAdmin(actor) && actor.role !== "AUDITOR")) return <AccessDenied />;
  const [campaign, events] = await Promise.all([getCampaign(), getAudit(actor)]);

  return (
    <AppShell actor={actor} campaign={campaign} active="audit">
      <Notice error={text(search.error)} success={text(search.success)} />
      <div className="page-header">
        <div>
          <p className="eyebrow">Dấu vết kiểm toán</p>
          <h2>100 thao tác gần nhất</h2>
          <p className="muted">Nhật ký không lưu mật khẩu, session hoặc nội dung tệp minh chứng.</p>
        </div>
      </div>
      <section className="panel">
        {events.length ? (
          <div className="table-wrap responsive">
            <table>
              <thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Thao tác</th><th>Đối tượng</th><th>Thông tin an toàn</th></tr></thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td><time dateTime={event.createdAt}>{formatDateTime(event.createdAt)}</time></td>
                    <td>{event.actorName}</td>
                    <td><strong>{actionLabels[event.action] ?? event.action}</strong></td>
                    <td>{event.targetType}<br /><span className="muted">{event.targetId}</span></td>
                    <td><code>{compactMetadata(event.metadataJson)}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty"><h3>Chưa có thao tác nghiệp vụ</h3><p>Nhật ký sẽ xuất hiện ngay khi dữ liệu đầu tiên được lưu.</p></div>
        )}
      </section>
    </AppShell>
  );
}

function compactMetadata(value: string) {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.entries(parsed)
      .map(([key, item]) => `${key}=${String(item)}`)
      .join(" · ") || "—";
  } catch {
    return "—";
  }
}

function text(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}
