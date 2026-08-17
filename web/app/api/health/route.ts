import { ensureDatabase, getD1 } from "@/db/runtime";

export async function GET() {
  try {
    await ensureDatabase();
    await getD1().prepare("SELECT 1").first();
    return Response.json(
      { status: "ok", database: "ok", time: new Date().toISOString() },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "degraded", database: "unavailable" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
