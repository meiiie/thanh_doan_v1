import type { Metadata } from "next";
import Link from "next/link";
import { getActor, isAdmin, isReviewer } from "./auth";
import {
  getAdminOverview,
  getCampaign,
  getReviewQueue,
  getUnitScorecard,
} from "@/db/app";
import {
  AccessDenied,
  AppShell,
  Notice,
  StatusBadge,
  formatNumber,
  returnTo,
} from "./ui";

export const metadata: Metadata = {
  title: "Tổng quan",
};

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function Home({ searchParams }: { searchParams: Search }) {
  const search = await searchParams;
  const demo = text(search.demo);
  const actor = await getActor(demo);
  if (!actor) return <AccessDenied />;
  const campaign = await getCampaign();

  return (
    <AppShell actor={actor} campaign={campaign} active="dashboard">
      <Notice error={text(search.error)} success={text(search.success)} />
      {actor.role === "UNIT" && actor.unitId ? (
        <UnitDashboard actor={actor} unitId={actor.unitId} />
      ) : isAdmin(actor) || actor.role === "AUDITOR" ? (
        <AdminDashboard actor={actor} />
      ) : isReviewer(actor) ? (
        <ReviewerDashboard actor={actor} />
      ) : null}
    </AppShell>
  );
}

async function UnitDashboard({
  actor,
  unitId,
}: {
  actor: NonNullable<Awaited<ReturnType<typeof getActor>>>;
  unitId: string;
}) {
  const scorecard = await getUnitScorecard(unitId);
  const applicableRows = scorecard.rows.filter((row) => row.applicable);
  const completed = applicableRows.filter(
    (row) => row.selfScore > 0 || row.report || row.evidenceUrl,
  ).length;
  const selfTotal = applicableRows.reduce((sum, row) => sum + row.selfScore, 0);
  const progress = Math.round((completed / Math.max(applicableRows.length, 1)) * 100);

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Việc cần làm tiếp theo</p>
          <h2>{scorecard.status === "DRAFT" ? "Hoàn thiện bảng tự chấm" : "Theo dõi hồ sơ đã nộp"}</h2>
          <p className="muted">{scorecard.unit.name}</p>
        </div>
        <Link className="button" href={returnTo("/scorecard", actor)}>
          Mở bảng điểm
        </Link>
      </div>
      <section className="stats" aria-label="Tiến độ hồ sơ">
        <div className="stat"><span>Tiêu chí đã có dữ liệu</span><strong>{completed}/{applicableRows.length}</strong></div>
        <div className="stat"><span>Tiến độ</span><strong>{progress}%</strong></div>
        <div className="stat"><span>Tổng tự chấm</span><strong>{formatNumber(selfTotal)}</strong></div>
        <div className="stat"><span>Trạng thái</span><strong><StatusBadge status={scorecard.status} /></strong></div>
      </section>
      <section className="panel">
        <h2>Nguyên tắc đang áp dụng</h2>
        <p className="muted">
          Dữ liệu được lưu theo từng tiêu chí. Sau khi nộp hoặc hết hạn, hồ sơ chuyển
          sang chỉ đọc; mọi lần mở lại đều được ghi nhật ký.
        </p>
      </section>
    </>
  );
}

async function ReviewerDashboard({
  actor,
}: {
  actor: NonNullable<Awaited<ReturnType<typeof getActor>>>;
}) {
  const { campaign, rows } = await getReviewQueue(actor);
  const round = campaign.phase === "ROUND2" ? 2 : 1;
  const reviewed = rows.filter((row) =>
    round === 2 ? row.round2Score !== null : row.round1Score !== null,
  ).length;
  const pending = rows.length - reviewed;
  const criteria = new Set(rows.map((row) => row.code)).size;

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Phạm vi của bạn</p>
          <h2>Hàng chờ thẩm định</h2>
          <p className="muted">
            {actor.teamCode ? `Tổ ${actor.teamCode}` : "Toàn bộ tổ chuyên môn"}
          </p>
        </div>
        <Link className="button" href={returnTo("/review", actor)}>
          Mở hàng chờ
        </Link>
      </div>
      <section className="stats" aria-label="Khối lượng chấm">
        <div className="stat"><span>Tiêu chí phụ trách</span><strong>{criteria}</strong></div>
        <div className="stat"><span>Lượt cần chấm</span><strong>{rows.length}</strong></div>
        <div className="stat"><span>Đã chấm vòng {round}</span><strong>{reviewed}</strong></div>
        <div className="stat"><span>Còn lại</span><strong>{pending}</strong></div>
      </section>
    </>
  );
}

async function AdminDashboard({
  actor,
}: {
  actor: NonNullable<Awaited<ReturnType<typeof getActor>>>;
}) {
  const { units } = await getAdminOverview(actor);
  const counts = units.reduce<Record<string, number>>((result, unit) => {
    result[unit.status] = (result[unit.status] ?? 0) + 1;
    return result;
  }, {});
  const average = units.length
    ? units.reduce((sum, unit) => sum + unit.completed / unit.totalCriteria, 0) /
      units.length
    : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Điểm nghẽn chiến dịch</p>
          <h2>Tiến độ 16 đơn vị Đại học, Cao đẳng</h2>
          <p className="muted">Theo dõi hồ sơ, tải kết quả và điều phối giai đoạn.</p>
        </div>
        <Link className="button" href={returnTo("/admin", actor)}>
          Mở điều hành
        </Link>
      </div>
      <section className="stats" aria-label="Tổng quan đơn vị">
        <div className="stat"><span>Đang làm</span><strong>{counts.DRAFT ?? 0}</strong></div>
        <div className="stat"><span>Đã nộp/khóa</span><strong>{(counts.SUBMITTED ?? 0) + (counts.LOCKED ?? 0)}</strong></div>
        <div className="stat"><span>Đã giải trình</span><strong>{counts.EXPLAINED ?? 0}</strong></div>
        <div className="stat"><span>Tiến độ dữ liệu TB</span><strong>{Math.round(average * 100)}%</strong></div>
      </section>
    </>
  );
}

function text(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}
