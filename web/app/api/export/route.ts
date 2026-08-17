import { getActor, isAdmin } from "@/app/auth";
import {
  getAdminOverview,
  getFinalResultHistory,
  getUnitScorecard,
  recordExport,
} from "@/db/app";
import { classificationLabel } from "@/app/ui";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const actor = await getActor(url.searchParams.get("demo") ?? undefined);
  if (!actor) return new Response("Unauthorized", { status: 401 });

  if (url.searchParams.get("history") === "1") {
    if (!isAdmin(actor) && actor.role !== "AUDITOR") {
      return new Response("Forbidden", { status: 403 });
    }
    const snapshots = await getFinalResultHistory(actor);
    await recordExport(actor, "FINAL_HISTORY");
    return new Response(
      JSON.stringify({ exportedAt: new Date().toISOString(), snapshots }, null, 2),
      {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "content-disposition": 'attachment; filename="lich-su-chot-2026.json"',
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      },
    );
  }

  let rows: Array<Array<string | number>>;
  if (isAdmin(actor) || actor.role === "AUDITOR") {
    const { units } = await getAdminOverview(actor);
    rows = [
      ["Mã đơn vị", "Đơn vị", "Trạng thái", "Tiến độ", "Tự chấm", "Điểm cuối", "Tỷ lệ", "Xếp loại"],
      ...units.map((unit) => [
        unit.unitCode,
        unit.unitName,
        unit.status,
        `${unit.completed}/${unit.totalCriteria}`,
        unit.selfTotal,
        unit.finalTotal ?? "",
        unit.rate === null ? "" : unit.rate / 100,
        classificationLabel(unit.classification),
      ]),
    ];
  } else if (actor.role === "UNIT" && actor.unitId) {
    const { unit, rows: scorecard } = await getUnitScorecard(actor.unitId);
    rows = [
      ["Mã tiêu chí", "Nội dung", "Tổ", "Áp dụng", "Khung điểm", "Tự chấm", "Vòng 1", "Vòng 2", "Minh chứng"],
      ...scorecard.map((row) => [
        row.code,
        row.title,
        row.teamCode,
        row.applicable ? "Có" : "Không",
        row.maximum,
        row.selfScore,
        row.round1Score ?? "",
        row.round2Score ?? "",
        row.evidenceUrl,
      ]),
    ];
    rows.unshift(["Đơn vị", unit.name]);
  } else {
    return new Response("Forbidden", { status: 403 });
  }

  const csv = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  await recordExport(actor, actor.role === "UNIT" ? "UNIT_CSV" : "RESULT_CSV");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="ket-qua-chien-dich-2026.csv"',
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function csvCell(value: string | number) {
  const raw = String(value);
  const text = /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${text.replaceAll('"', '""')}"`;
}
