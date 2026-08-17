import type { Metadata } from "next";
import Link from "next/link";
import { getActor, isAdmin } from "../auth";
import { getAdminOverview, listDirectory } from "@/db/app";
import {
  AccessDenied,
  AppShell,
  IdempotencyField,
  Notice,
  StatusBadge,
  classificationLabel,
  formatNumber,
  returnTo,
} from "../ui";

export const metadata: Metadata = { title: "Điều hành" };
export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

const nextPhase: Record<string, { value: string; label: string; dangerous?: boolean }> = {
  DRAFT: { value: "SELF_ASSESSMENT", label: "Công bố và mở tự chấm" },
  SELF_ASSESSMENT: { value: "ROUND1", label: "Khóa tự chấm, mở vòng 1" },
  ROUND1: { value: "ROUND1_RELEASED", label: "Công bố điểm vòng 1" },
  ROUND1_RELEASED: { value: "EXPLANATION", label: "Mở cổng giải trình" },
  EXPLANATION: { value: "ROUND2", label: "Khóa giải trình, mở vòng 2" },
  ROUND2: { value: "FINALIZED", label: "Chốt kết quả chiến dịch", dangerous: true },
  FINALIZED: { value: "ARCHIVED", label: "Lưu trữ chiến dịch" },
};

export default async function AdminPage({ searchParams }: { searchParams: Search }) {
  const search = await searchParams;
  const demo = text(search.demo);
  const actor = await getActor(demo);
  if (!actor || (!isAdmin(actor) && actor.role !== "AUDITOR")) return <AccessDenied />;
  const [{ campaign, units }, directory] = await Promise.all([
    getAdminOverview(actor),
    listDirectory(actor),
  ]);
  const transition = nextPhase[campaign.phase];
  const actionReturn = returnTo("/admin", actor);
  const finished = units.filter((unit) => unit.status === "FINALIZED").length;
  const submitted = units.filter((unit) => unit.status !== "DRAFT").length;
  const averageProgress =
    units.reduce((sum, unit) => sum + unit.completed / unit.totalCriteria, 0) /
    Math.max(units.length, 1);

  return (
    <AppShell actor={actor} campaign={campaign} active="admin">
      <Notice error={text(search.error)} success={text(search.success)} />
      <div className="page-header">
        <div>
          <p className="eyebrow">Trung tâm điều hành</p>
          <h2>Tiến độ và kiểm soát chiến dịch</h2>
          <p className="muted">Mọi lần chuyển giai đoạn đều được ghi vào nhật ký.</p>
        </div>
        <div className="actions">
          <Link className="button secondary" href={returnTo("/api/export", actor)}>
            Xuất CSV kết quả
          </Link>
          <Link className="button secondary" href={returnTo("/api/export?history=1", actor)}>
            Tải lịch sử chốt
          </Link>
          {actor.role === "SUPER_ADMIN" && (
            <Link className="button secondary" href={returnTo("/api/backup", actor)}>
              Sao lưu JSON
            </Link>
          )}
          {isAdmin(actor) && transition && (
            <form action="/api/actions" method="post">
              <input type="hidden" name="action" value="transitionCampaign" />
              <input type="hidden" name="nextPhase" value={transition.value} />
              <input type="hidden" name="returnTo" value={actionReturn} />
              {actor.demo && <input type="hidden" name="demo" value={actor.demo} />}
              <IdempotencyField />
              <button className={transition.dangerous ? "danger" : ""} type="submit">
                {transition.label}
              </button>
            </form>
          )}
        </div>
      </div>

      <section className="stats" aria-label="Tình trạng chiến dịch">
        <div className="stat"><span>Đơn vị trong chiến dịch</span><strong>{units.length}</strong></div>
        <div className="stat"><span>Đã nộp hoặc khóa</span><strong>{submitted}</strong></div>
        <div className="stat"><span>Đã chốt</span><strong>{finished}</strong></div>
        <div className="stat"><span>Tiến độ dữ liệu TB</span><strong>{Math.round(averageProgress * 100)}%</strong></div>
      </section>

      {isAdmin(actor) && ["DRAFT", "SELF_ASSESSMENT"].includes(campaign.phase) && (
        <section className="panel" aria-labelledby="campaign-settings-title">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Cấu hình đang công bố</p>
              <h2 id="campaign-settings-title">Tên chiến dịch và hạn tự chấm</h2>
              <p className="muted">
                Mọi thay đổi được ghi audit. Sau khi mở vòng 1, cấu hình này khóa lại.
              </p>
            </div>
          </div>
          <form className="form-grid" action="/api/actions" method="post">
            <input type="hidden" name="action" value="updateCampaignSettings" />
            <input type="hidden" name="returnTo" value={actionReturn} />
            {actor.demo && <input type="hidden" name="demo" value={actor.demo} />}
            <IdempotencyField />
            <label className="field full">
              <span>Tên chiến dịch</span>
              <input name="name" required maxLength={180} defaultValue={campaign.name} />
            </label>
            <label className="field">
              <span>Hạn tự chấm (giờ Việt Nam)</span>
              <input
                name="selfDeadline"
                type="datetime-local"
                required
                defaultValue={deadlineInput(campaign.selfDeadline)}
              />
            </label>
            <div className="field">
              <span className="field-label">Lưu thay đổi</span>
              <button type="submit">Cập nhật cấu hình</button>
            </div>
          </form>
        </section>
      )}

      {isAdmin(actor) && campaign.phase === "FINALIZED" && (
        <section className="panel critical-panel" aria-labelledby="reopen-title">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Kiểm soát ngoại lệ</p>
              <h2 id="reopen-title">Mở lại vòng 2</h2>
              <p className="muted">
                Kết quả hiện hành sẽ được gỡ công bố; snapshot đã chốt vẫn được giữ
                bất biến để đối chiếu. Lý do được ghi vào nhật ký.
              </p>
            </div>
          </div>
          <form className="form-grid" action="/api/actions" method="post">
            <input type="hidden" name="action" value="transitionCampaign" />
            <input type="hidden" name="nextPhase" value="ROUND2" />
            <input type="hidden" name="returnTo" value={actionReturn} />
            {actor.demo && <input type="hidden" name="demo" value={actor.demo} />}
            <IdempotencyField />
            <label className="field full">
              <span>Lý do mở lại</span>
              <textarea
                name="reason"
                required
                maxLength={500}
                placeholder="Ví dụ: Phát hiện minh chứng cần đối chiếu lại tại tiêu chí I.12…"
              />
            </label>
            <div className="actions">
              <button className="danger" type="submit">Mở lại và gỡ kết quả hiện hành</button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Theo đơn vị</p>
            <h2>16 hồ sơ Đại học, Cao đẳng</h2>
          </div>
        </div>
        <div className="table-wrap responsive">
          <table>
            <thead>
              <tr>
                <th>Đơn vị</th>
                <th>Trạng thái</th>
                <th>Tiến độ</th>
                <th>Tự chấm</th>
                <th>Kết quả</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.unitId}>
                  <td><strong>{unit.unitName}</strong><br /><span className="muted">{unit.unitCode}</span></td>
                  <td><StatusBadge status={unit.status} /></td>
                  <td className="number">{unit.completed}/{unit.totalCriteria}</td>
                  <td className="number">{formatNumber(unit.selfTotal)}</td>
                  <td>
                    {unit.finalTotal === null ? "—" : (
                      <><strong>{formatNumber(unit.finalTotal)}</strong><br /><span className="muted">{classificationLabel(unit.classification)}</span></>
                    )}
                  </td>
                  <td>
                    <Link href={returnTo(`/scorecard?unitId=${unit.unitId}`, actor)}>
                      Xem hồ sơ
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Danh sách quyền</p>
            <h2>Tài khoản đã ánh xạ</h2>
            <p className="muted">{directory.users.length} tài khoản production; tài khoản demo cục bộ không hiển thị.</p>
          </div>
        </div>
        {directory.users.length ? (
          <div className="table-wrap responsive">
            <table>
              <thead><tr><th>Tên</th><th>Email</th><th>Vai trò</th><th>Phạm vi</th><th>Truy cập</th></tr></thead>
              <tbody>
                {directory.users.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.displayName}</strong></td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.teamCode ?? user.unitId ?? "Toàn chiến dịch"}</td>
                    <td>
                      {isAdmin(actor) &&
                      user.role !== "SUPER_ADMIN" &&
                      (actor.role === "SUPER_ADMIN" || !["ADMIN", "AUDITOR"].includes(user.role)) ? (
                        <form action="/api/actions" method="post">
                          <input type="hidden" name="action" value="setUserActive" />
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="active" value={user.active ? "0" : "1"} />
                          <input type="hidden" name="returnTo" value={actionReturn} />
                          {actor.demo && <input type="hidden" name="demo" value={actor.demo} />}
                          <IdempotencyField />
                          <button className="link-button" type="submit">
                            {user.active ? "Vô hiệu hóa" : "Kích hoạt"}
                          </button>
                        </form>
                      ) : user.active ? "Đang hoạt động" : "Đã khóa"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <h3>Chưa có tài khoản production</h3>
            <p>Chủ sở hữu Site sẽ được tạo tự động khi truy cập lần đầu. Sau đó thêm các email được phép bên dưới.</p>
          </div>
        )}
      </section>

      {isAdmin(actor) && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Cấp quyền</p>
              <h2>Thêm hoặc cập nhật tài khoản</h2>
              <p className="muted">Nhập lại email đã có để cập nhật vai trò/phạm vi. Email phải đồng thời nằm trong danh sách truy cập của Site.</p>
            </div>
          </div>
          <form className="form-grid" action="/api/actions" method="post">
            <input type="hidden" name="action" value="addUser" />
            <input type="hidden" name="returnTo" value={actionReturn} />
            {actor.demo && <input type="hidden" name="demo" value={actor.demo} />}
            <IdempotencyField />
            <label className="field">
              <span>Tên hiển thị</span>
              <input name="displayName" required maxLength={120} />
            </label>
            <label className="field">
              <span>Email đăng nhập</span>
              <input name="email" type="email" required />
            </label>
            <label className="field">
              <span>Vai trò</span>
              <select name="role" defaultValue="UNIT">
                {actor.role === "SUPER_ADMIN" && <option value="ADMIN">Quản trị chiến dịch</option>}
                <option value="TEAM_LEAD">Trưởng tổ</option>
                <option value="REVIEWER">Chuyên viên chấm</option>
                <option value="UNIT">Đơn vị</option>
                {actor.role === "SUPER_ADMIN" && <option value="AUDITOR">Kiểm tra, chỉ đọc</option>}
              </select>
            </label>
            <label className="field">
              <span>Tổ chuyên môn</span>
              <select name="teamCode" defaultValue="">
                <option value="">Không áp dụng</option>
                <option value="PT">Phong trào</option>
                <option value="TH">Trường học</option>
                <option value="TG">Tuyên giáo</option>
                <option value="TCKT">Tổ chức–Kiểm tra</option>
                <option value="VP">Văn phòng</option>
              </select>
            </label>
            <label className="field full">
              <span>Đơn vị</span>
              <select name="unitId" defaultValue="">
                <option value="">Không áp dụng</option>
                {directory.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.code} — {unit.name}</option>
                ))}
              </select>
              <small className="help">Bắt buộc khi vai trò là Đơn vị.</small>
            </label>
            <div className="actions"><button type="submit">Thêm tài khoản</button></div>
          </form>
        </section>
      )}
    </AppShell>
  );
}

function text(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function deadlineInput(value: string) {
  return new Date(Date.parse(value) + 7 * 60 * 60 * 1000).toISOString().slice(0, 16);
}
