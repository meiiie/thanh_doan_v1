import { getActor } from "@/app/auth";
import { getCampaignBackup, recordExport } from "@/db/app";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const actor = await getActor(url.searchParams.get("demo") ?? undefined);
  if (!actor) return new Response("Unauthorized", { status: 401 });
  if (actor.role !== "SUPER_ADMIN") return new Response("Forbidden", { status: 403 });

  const data = await getCampaignBackup(actor);
  await recordExport(actor, "FULL_BACKUP");
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(
    JSON.stringify(
      {
        format: "doan-scorecard-backup",
        version: 1,
        exportedAt: new Date().toISOString(),
        data,
      },
      null,
      2,
    ),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="sao-luu-chien-dich-${stamp}.json"`,
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    },
  );
}
