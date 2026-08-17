import type { Metadata } from "next";
import { getActor, isAdmin } from "../auth";
import { getUnitScorecard } from "@/db/app";
import { phaseIndex } from "@/domain/workflow.mjs";
import {
  AccessDenied,
  AppShell,
  IdempotencyField,
  Notice,
  StatusBadge,
  formatNumber,
  returnTo,
} from "../ui";
import { PrintButton } from "../print-button";

export const metadata: Metadata = { title: "Bảng điểm" };
export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function ScorecardPage({ searchParams }: { searchParams: Search }) {
  const search = await searchParams;
  const demo = text(search.demo);
  const actor = await getActor(demo);
  if (!actor) return <AccessDenied />;
  const targetUnitId =
    actor.role === "UNIT" ? actor.unitId : isAdmin(actor) ? text(search.unitId) : null;
  if (!targetUnitId) return <AccessDenied />;
  const scorecard = await getUnitScorecard(targetUnitId);
  const ownRecord = actor.role === "UNIT" && actor.unitId === targetUnitId;
  const canEditSelf =
    ownRecord &&
    scorecard.campaign.phase === "SELF_ASSESSMENT" &&
    scorecard.status === "DRAFT";
  const canExplain = ownRecord && scorecard.campaign.phase === "EXPLANATION";
  const canSeeRound1 =
    isAdmin(actor) || phaseIndex(scorecard.campaign.phase) >= phaseIndex("ROUND1_RELEASED");
  const selfTotal = scorecard.rows.reduce(
    (sum, row) => sum + (row.applicable ? row.selfScore : 0),
    0,
  );
  const coreMaximum = scorecard.rows
    .filter((row) => row.section === "CORE" && row.applicable)
    .reduce((sum, row) => sum + row.maximum, 0);
  const actionReturn = returnTo(
    isAdmin(actor) ? `/scorecard?unitId=${targetUnitId}` : "/scorecard",
    actor,
  );

  return (
    <AppShell actor={actor} campaign={scorecard.campaign} active="scorecard">
      <Notice error={text(search.error)} success={text(search.success)} />
      <div className="page-header">
        <div>
          <p className="eyebrow">{scorecard.unit.code}</p>
          <h2>{scorecard.unit.name}</h2>
          <p className="muted">
            <StatusBadge status={scorecard.status} /> · Tổng tự chấm{" "}
            <strong>{formatNumber(selfTotal)}</strong> / {formatNumber(coreMaximum)} điểm cơ bản
          </p>
        </div>
        <div className="actions">
          <PrintButton />
          {canEditSelf && (
            <form action="/api/actions" method="post">
              <input type="hidden" name="action" value="submitUnit" />
              <input type="hidden" name="returnTo" value={actionReturn} />
              {actor.demo && <input type="hidden" name="demo" value={actor.demo} />}
              <IdempotencyField />
              <button type="submit">Nộp bảng tự chấm</button>
            </form>
          )}
        </div>
      </div>

      {!canEditSelf && ownRecord && (
        <div className="notice success" role="status">
          <strong>Hồ sơ đang ở chế độ chỉ đọc</strong>
          <span>Việc chỉnh sửa chỉ mở trong giai đoạn tự chấm và trước khi nộp.</span>
        </div>
      )}

      {(["CORE", "BONUS"] as const).map((section) => (
        <section key={section} className="panel" aria-labelledby={`section-${section}`}>
          <div className="panel-header">
            <div>
              <p className="eyebrow">{section === "CORE" ? "I" : "II"}</p>
              <h2 id={`section-${section}`}>
                {section === "CORE" ? "Nội dung cơ bản" : "Nội dung điểm thưởng"}
              </h2>
            </div>
            {section === "BONUS" && <span className="muted">Điểm thưởng cuối không vượt quá 25</span>}
          </div>
          <div className="score-list">
            {scorecard.rows
              .filter((row) => row.section === section)
              .map((row) => {
                const applicable = Boolean(row.applicable);
                return (
                <article className={applicable ? "score-item" : "score-item not-applicable"} key={row.assessmentId}>
                  <div className="criterion-heading">
                    <div>
                      <p className="criterion-code">{row.code} · Tổ {row.teamCode}</p>
                      <h3>{row.title}</h3>
                      <p className="criterion-instructions">{row.instructions}</p>
                    </div>
                    <div className="score-maximum">
                      <strong>{applicable ? formatNumber(row.maximum) : "—"}</strong>
                      <small>{applicable ? "tối đa" : "không áp dụng"}</small>
                    </div>
                  </div>

                  {isAdmin(actor) && scorecard.campaign.phase === "SELF_ASSESSMENT" && scorecard.status === "DRAFT" && (
                    <form className="applicability-form" action="/api/actions" method="post">
                      <input type="hidden" name="action" value="setAssessmentApplicability" />
                      <input type="hidden" name="assessmentId" value={row.assessmentId} />
                      <input type="hidden" name="applicable" value={applicable ? "0" : "1"} />
                      <input type="hidden" name="returnTo" value={actionReturn} />
                      {actor.demo && <input type="hidden" name="demo" value={actor.demo} />}
                      <IdempotencyField />
                      <button className="link-button" type="submit">
                        {applicable ? "Đánh dấu không áp dụng" : "Áp dụng lại tiêu chí"}
                      </button>
                    </form>
                  )}

                  {canSeeRound1 && row.round1Score !== null && (
                    <div className="review-context">
                      <p>
                        <strong>Vòng 1: {formatNumber(row.round1Score)}</strong>
                        {row.round1Score < row.selfScore ? " · Có chênh lệch" : " · Đã đồng thuận"}
                      </p>
                      {row.round1Reason && <p className="muted">Lý do: {row.round1Reason}</p>}
                      {row.explanation && <p><strong>Giải trình:</strong> {row.explanation}</p>}
                      {row.round2Score !== null && (
                        <p><strong>Vòng 2: {formatNumber(row.round2Score)}</strong></p>
                      )}
                    </div>
                  )}

                  <form className="score-form" action="/api/actions" method="post">
                    <input type="hidden" name="action" value="saveAssessment" />
                    <input type="hidden" name="assessmentId" value={row.assessmentId} />
                    <input type="hidden" name="returnTo" value={actionReturn} />
                    {actor.demo && <input type="hidden" name="demo" value={actor.demo} />}
                    <IdempotencyField />
                    <label className="field">
                      <span>Điểm tự chấm</span>
                      <input
                        name="score"
                        type="number"
                        min="0"
                        max={row.maximum}
                        step="0.5"
                        defaultValue={row.selfScore}
                        disabled={!canEditSelf || !applicable}
                        required
                      />
                    </label>
                    <label className="field">
                      <span>Báo cáo ngắn</span>
                      <textarea
                        name="report"
                        defaultValue={row.report}
                        disabled={!canEditSelf || !applicable}
                        required={canEditSelf && applicable}
                        maxLength={2000}
                        placeholder="Mô tả kết quả; nếu không thực hiện, ghi rõ không triển khai"
                      />
                    </label>
                    <label className="field">
                      <span>Link minh chứng</span>
                      <input
                        name="evidenceUrl"
                        type="url"
                        inputMode="url"
                        defaultValue={row.evidenceUrl}
                        disabled={!canEditSelf || !applicable}
                        maxLength={1000}
                        placeholder="https://drive.google.com/..."
                      />
                      {row.evidenceUrl && !canEditSelf && (
                        <a href={row.evidenceUrl} target="_blank" rel="noreferrer">
                          Mở minh chứng
                        </a>
                      )}
                    </label>
                    <button type="submit" disabled={!canEditSelf || !applicable}>Lưu</button>
                  </form>

                  {canExplain && row.round1Score !== null && row.round1Score < row.selfScore && (
                    <form className="form-grid" action="/api/actions" method="post">
                      <input type="hidden" name="action" value="saveExplanation" />
                      <input type="hidden" name="assessmentId" value={row.assessmentId} />
                      <input type="hidden" name="returnTo" value={actionReturn} />
                      {actor.demo && <input type="hidden" name="demo" value={actor.demo} />}
                      <IdempotencyField />
                      <label className="field full">
                        <span>Nội dung giải trình</span>
                        <textarea name="message" required maxLength={2000} defaultValue={row.explanation ?? ""} />
                      </label>
                      <label className="field">
                        <span>Minh chứng bổ sung</span>
                        <input name="evidenceUrl" type="url" placeholder="https://..." defaultValue={row.explanationEvidenceUrl ?? ""} />
                      </label>
                      <div className="field">
                        <span className="field-label">Gửi theo tiêu chí</span>
                        <button type="submit">Lưu giải trình</button>
                      </div>
                    </form>
                  )}
                </article>
              );})}
          </div>
        </section>
      ))}
    </AppShell>
  );
}

function text(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}
