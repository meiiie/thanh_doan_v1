import { headers } from "next/headers";
import { getChatGPTUser } from "./chatgpt-auth";
import { ensureDatabase, getD1 } from "@/db/runtime";

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "TEAM_LEAD"
  | "REVIEWER"
  | "UNIT"
  | "AUDITOR";

export type Actor = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  teamCode: string | null;
  unitId: string | null;
  demo: string | null;
};

const demoEmails: Record<string, string> = {
  admin: "admin@doan.local",
  reviewer: "reviewer.pt@doan.local",
  reviewerVp: "reviewer.vp@doan.local",
  unit: "unit@doan.local",
  auditor: "auditor@doan.local",
};

export async function getActor(demo?: string): Promise<Actor | null> {
  await ensureDatabase();
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "";
  const localDemo = /^localhost(?::\d+)?$/.test(host)
    ? demoEmails[demo ?? "admin"] ?? demoEmails.admin
    : null;
  const platformUser = localDemo ? null : await getChatGPTUser();
  const email = (localDemo ?? platformUser?.email)?.trim().toLowerCase();
  if (!email) return null;

  const db = getD1();
  let actor = await db
    .prepare("SELECT id,email,display_name AS displayName,role,team_code AS teamCode,unit_id AS unitId FROM users WHERE lower(email)=? AND active=1")
    .bind(email)
    .first<Omit<Actor, "demo">>();

  if (!actor && platformUser) {
    const existingRealUsers = await db
      .prepare("SELECT count(*) AS count FROM users WHERE email NOT LIKE '%@doan.local'")
      .first<{ count: number }>();
    if ((existingRealUsers?.count ?? 0) === 0) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db.batch([
        db
          .prepare("INSERT INTO users(id,external_user_id,email,display_name,role,active,created_at) VALUES(?,?,?,?, 'SUPER_ADMIN',1,?)")
          .bind(id, platformUser.userId, email, platformUser.displayName, now),
        db
          .prepare("INSERT INTO audit_events(id,actor_user_id,action,target_type,target_id,metadata_json,created_at) VALUES(?,?, 'BOOTSTRAP_OWNER','USER',?,'{}',?)")
          .bind(crypto.randomUUID(), id, id, now),
      ]);
      actor = {
        id,
        email,
        displayName: platformUser.displayName,
        role: "SUPER_ADMIN",
        teamCode: null,
        unitId: null,
      };
    }
  }

  return actor ? { ...actor, demo: localDemo ? demo ?? "admin" : null } : null;
}

export function isAdmin(actor: Actor) {
  return actor.role === "SUPER_ADMIN" || actor.role === "ADMIN";
}

export function isReviewer(actor: Actor) {
  return (
    actor.role === "SUPER_ADMIN" ||
    actor.role === "ADMIN" ||
    actor.role === "TEAM_LEAD" ||
    actor.role === "REVIEWER"
  );
}
