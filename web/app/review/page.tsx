import type { Metadata } from "next";
import Link from "next/link";
import { getActor, isReviewer } from "../auth";
import { getReviewQueue } from "@/db/app";
import {
  AccessDenied,
  AppShell,
  IdempotencyField,
  Notice,
  StatusBadge,
  formatNumber,
  returnTo,
} from "../ui";

export const metadata: Metadata = { title: "Hàng chờ chấm" };
export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function ReviewPage({ searchParams }: { searchParams: Search }) {
  const search = await searchParams;
  const demo = text(search.demo);
  const actor = await getActor(demo);
  if (!actor || !isReviewer(actor)) return <AccessDenied />;
  const { campaign, rows } = await getReviewQueue(actor);
  const codes = [...new Set(rows.map((row) => row.code))];
  const selectedCode = text(search.criterion) && codes.includes(text(search.criterion)!)
    ? text(search.criterion)!
    : codes[0];
  const unitQuery = text(search.q)?.toLocaleLowerCase("vi") ?? "";
  const selectedRows = rows.filter(
    (row) =>
      row.code === selectedCode &&
      (!unitQuery || row.unitName.toLocaleLowerCase("vi").includes(unitQuery)),
  );
  const round = campaign.phase === "ROUND2" ? 2 : 1;
  const canScore = campaign.phase === "ROUND1" || campaign.phase === "ROUND2";
  const actionReturn = returnTo(
    `/review?criterion=${encodeURIComponent(selectedCode ?? "")}`,
    actor,
  );

  return (
    <AppShell actor={actor} campaign={campaign} active="review">
      <Notice error={text(search.error)} success={text(search.success)} />
      <div className="page-header">
        <div>
          <p className="eyebrow">Tổ {actor.teamCode ?? "Tất cả"}</p>
          <h2>Hàng chờ chấm vòng {round}</h2>
          <p className="muted">
            Chọn một tiêu chí, sau đó xử lý lần lượt 16 đơn vị trong cùng ngữ cảnh.
          </p>
        </div>
        <Link className="button secondary" href={returnTo("/", actor)}>Về tổng quan</Link>
      </div>

      {!canScore && (
        <div className="notice error" role="alert">
          <strong>Chưa mở quyền nhập điểm</strong>
          <span>
            Hồ sơ tự chấm được giữ kín trong giai đoạn đơn vị đang làm. Hàng chờ chỉ
            xuất hiện khi chiến dịch mở chấm vòng 1 hoặc vòng 2.
          </span>
        </div>
      )}

      <section className="panel">
        <form className="form-grid" method="get">
          {actor.demo && <input type="hidden" name="demo" value={actor.demo} />}
          <label className="field">
            <span>Tiêu chí phụ trách</span>
            <select name="criterion" defaultValue={selectedCode}>
              {codes.map((code) => {
                const row = rows.find((item) => item.code === code)!;
                return <option key={code} value={code}>{code} — {row.title}</option>;
              })}
            </select>
          </label>
          <label className="field">
            <span>Tìm đơn vị</span>
            <input name="q" type="search" defaultValue={text(search.q)} placeholder="Nhập tên đơn vị" />
          </label>
          <div className="field">
            <span className="field-label">Áp dụng bộ lọc</span>
            <button type="submit">Xem hàng chờ</button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{selectedCode}</p>
            <h2>{rows.find((row) => row.code === selectedCode)?.title}</h2>
            <p className="muted">{rows.find((row) => row.code === selectedCode)?.instructions}</p>
          </div>
          <span className="muted">{selectedRows.length} đơn vị</span>
        </div>

        <div className="score-list">
          {selectedRows.map((row) => {
            const currentScore = round === 2 ? row.round2Score : row.round1Score;
            const currentReason = round === 2 ? row.round2Reason : row.round1Reason;
            return (
              <article className="score-item" key={row.assessmentId}>
                <div className="criterion-heading">
                  <div>
                    <p className="criterion-code">{row.unitName}</p>
                    <h3>Tự chấm {formatNumber(row.selfScore)} / {formatNumber(row.maximum)}</h3>
                  </div>
                  <StatusBadge status={row.status} />
                </div>

                <div className="review-context">
                  <p><strong>Báo cáo đơn vị:</strong> {row.report || "Chưa có báo cáo"}</p>
                  {row.evidenceUrl ? (
                    <p><a href={row.evidenceUrl} target="_blank" rel="noreferrer">Mở minh chứng gốc</a></p>
                  ) : <p className="muted">Chưa có link minh chứng.</p>}
                  {round === 2 && (
                    <>
                      <p><strong>Điểm vòng 1:</strong> {row.round1Score ?? "Chưa chấm"}</p>
                      <p><strong>Lý do vòng 1:</strong> {row.round1Reason || "Không có"}</p>
                      <p><strong>Giải trình:</strong> {row.explanation || "Đơn vị chưa giải trình"}</p>
                      {row.explanationEvidenceUrl && (
                        <p><a href={row.explanationEvidenceUrl} target="_blank" rel="noreferrer">Mở minh chứng bổ sung</a></p>
                      )}
                    </>
                  )}
                </div>

                <form className="score-form" action="/api/actions" method="post">
                  <input type="hidden" name="action" value="saveReview" />
                  <input type="hidden" name="assessmentId" value={row.assessmentId} />
                  <input type="hidden" name="returnTo" value={actionReturn} />
                  {actor.demo && <input type="hidden" name="demo" value={actor.demo} />}
                  <IdempotencyField />
                  <label className="field">
                    <span>Điểm vòng {round}</span>
                    <input
                      name="score"
                      type="number"
                      min="0"
                      max={row.maximum}
                      step="0.5"
                      defaultValue={currentScore ?? row.selfScore}
                      disabled={!canScore}
                      required
                    />
                  </label>
                  <label className="field full">
                    <span>Lý do điều chỉnh</span>
                    <textarea
                      name="reason"
                      defaultValue={currentReason ?? ""}
                      maxLength={1000}
                      disabled={!canScore}
                      placeholder="Bắt buộc nếu điểm thấp hơn tự chấm"
                    />
                  </label>
                  <button type="submit" disabled={!canScore}>Lưu vòng {round}</button>
                </form>
              </article>
            );
          })}
          {selectedRows.length === 0 && (
            <div className="empty"><h3>Không có đơn vị phù hợp</h3><p>Hãy xóa từ khóa tìm kiếm hoặc chọn tiêu chí khác.</p></div>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function text(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}
