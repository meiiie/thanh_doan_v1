import { env } from "cloudflare:workers";
import { CAMPAIGN_ID, criteria, demoUsers, unitGroups, units } from "./seed";

export type Db = D1Database;

let ready: Promise<void> | null = null;
const SEED_VERSION = "2026-08-12.2";

const schemaStatements = [
  "PRAGMA foreign_keys = ON",
  "CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS unit_groups (code TEXT PRIMARY KEY, name TEXT NOT NULL, sort_order INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS units (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, group_code TEXT NOT NULL REFERENCES unit_groups(code), active INTEGER NOT NULL DEFAULT 1)",
  "CREATE INDEX IF NOT EXISTS idx_units_group ON units(group_code)",
  "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, external_user_id TEXT, email TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, role TEXT NOT NULL, team_code TEXT, unit_id TEXT REFERENCES units(id), active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_users_unit ON users(unit_id)",
  "CREATE INDEX IF NOT EXISTS idx_users_team ON users(team_code)",
  "CREATE TABLE IF NOT EXISTS campaigns (id TEXT PRIMARY KEY, name TEXT NOT NULL, scorecard_version INTEGER NOT NULL, phase TEXT NOT NULL, self_deadline TEXT NOT NULL, bonus_cap REAL NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS campaign_units (campaign_id TEXT NOT NULL REFERENCES campaigns(id), unit_id TEXT NOT NULL REFERENCES units(id), status TEXT NOT NULL, submitted_at TEXT, finalized_at TEXT, PRIMARY KEY (campaign_id, unit_id))",
  "CREATE INDEX IF NOT EXISTS idx_campaign_units_status ON campaign_units(campaign_id, status)",
  "CREATE TABLE IF NOT EXISTS criteria (id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL REFERENCES campaigns(id), code TEXT NOT NULL, section TEXT NOT NULL, title TEXT NOT NULL, instructions TEXT NOT NULL, team_code TEXT NOT NULL, maximum REAL NOT NULL CHECK(maximum >= 0), sort_order INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1, UNIQUE(campaign_id, code))",
  "CREATE INDEX IF NOT EXISTS idx_criteria_team ON criteria(campaign_id, team_code)",
  "CREATE TABLE IF NOT EXISTS assessments (id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL REFERENCES campaigns(id), unit_id TEXT NOT NULL REFERENCES units(id), criterion_id TEXT NOT NULL REFERENCES criteria(id), applicable INTEGER NOT NULL DEFAULT 1, self_score REAL NOT NULL DEFAULT 0 CHECK(self_score >= 0), report TEXT NOT NULL DEFAULT '', evidence_url TEXT NOT NULL DEFAULT '', updated_by TEXT REFERENCES users(id), updated_at TEXT NOT NULL, UNIQUE(campaign_id, unit_id, criterion_id))",
  "CREATE INDEX IF NOT EXISTS idx_assessments_unit ON assessments(campaign_id, unit_id)",
  "CREATE TABLE IF NOT EXISTS review_decisions (id TEXT PRIMARY KEY, assessment_id TEXT NOT NULL REFERENCES assessments(id), round INTEGER NOT NULL CHECK(round IN (1,2)), score REAL NOT NULL CHECK(score >= 0), reason TEXT NOT NULL DEFAULT '', reviewer_user_id TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_review_latest ON review_decisions(assessment_id, round, created_at)",
  "CREATE TABLE IF NOT EXISTS explanations (id TEXT PRIMARY KEY, assessment_id TEXT NOT NULL REFERENCES assessments(id), message TEXT NOT NULL, evidence_url TEXT NOT NULL DEFAULT '', author_user_id TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_explanations_assessment ON explanations(assessment_id, created_at)",
  "CREATE TABLE IF NOT EXISTS final_results (campaign_id TEXT NOT NULL REFERENCES campaigns(id), unit_id TEXT NOT NULL REFERENCES units(id), core_maximum REAL NOT NULL, core_score REAL NOT NULL, bonus_raw REAL NOT NULL, bonus_score REAL NOT NULL, total_score REAL NOT NULL, rate REAL NOT NULL, classification TEXT NOT NULL, snapshot_json TEXT NOT NULL, finalized_by TEXT NOT NULL REFERENCES users(id), finalized_at TEXT NOT NULL, PRIMARY KEY (campaign_id, unit_id))",
  "CREATE TABLE IF NOT EXISTS final_result_snapshots (id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL REFERENCES campaigns(id), unit_id TEXT NOT NULL REFERENCES units(id), core_maximum REAL NOT NULL, core_score REAL NOT NULL, bonus_raw REAL NOT NULL, bonus_score REAL NOT NULL, total_score REAL NOT NULL, rate REAL NOT NULL, classification TEXT NOT NULL, snapshot_json TEXT NOT NULL, finalized_by TEXT NOT NULL REFERENCES users(id), finalized_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_final_snapshots_scope ON final_result_snapshots(campaign_id, unit_id, finalized_at)",
  "CREATE TABLE IF NOT EXISTS audit_events (id TEXT PRIMARY KEY, actor_user_id TEXT REFERENCES users(id), action TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL, metadata_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at)",
  "CREATE TABLE IF NOT EXISTS idempotency_keys (key TEXT PRIMARY KEY, actor_user_id TEXT NOT NULL REFERENCES users(id), action TEXT NOT NULL, created_at TEXT NOT NULL)",
];

export function getD1(): Db {
  const runtimeEnv = env as typeof env & { DB?: D1Database };
  if (!runtimeEnv.DB) throw new Error("D1 binding DB is unavailable");
  return runtimeEnv.DB;
}

export async function ensureDatabase() {
  ready ??= initialize(getD1()).catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

async function initialize(db: Db) {
  await runBatches(db, schemaStatements.map((sql) => db.prepare(sql)), 40);
  const assessmentColumns = await db
    .prepare("PRAGMA table_info(assessments)")
    .all<{ name: string }>();
  if (!assessmentColumns.results.some((column) => column.name === "applicable")) {
    await db.prepare("ALTER TABLE assessments ADD COLUMN applicable INTEGER NOT NULL DEFAULT 1").run();
  }
  const seeded = await db
    .prepare("SELECT value FROM app_meta WHERE key = 'seed_version'")
    .first<{ value: string }>();
  if (seeded?.value === SEED_VERSION) return;

  const now = "2026-08-12T00:00:00.000Z";
  const statements: D1PreparedStatement[] = [];

  for (const group of unitGroups) {
    statements.push(
      db
        .prepare("INSERT OR IGNORE INTO unit_groups(code,name,sort_order) VALUES(?,?,?)")
        .bind(group.code, group.name, group.sortOrder),
    );
  }
  for (const unit of units) {
    statements.push(
      db
        .prepare("INSERT OR IGNORE INTO units(id,code,name,group_code,active) VALUES(?,?,?,?,1)")
        .bind(unit.id, unit.code, unit.name, unit.groupCode),
    );
  }
  for (const user of demoUsers) {
    statements.push(
      db
        .prepare("INSERT OR IGNORE INTO users(id,email,display_name,role,team_code,unit_id,active,created_at) VALUES(?,?,?,?,?,?,1,?)")
        .bind(user.id, user.email, user.displayName, user.role, user.teamCode, user.unitId, now),
    );
  }

  statements.push(
    db
      .prepare("INSERT OR IGNORE INTO campaigns(id,name,scorecard_version,phase,self_deadline,bonus_cap,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)")
      .bind(
        CAMPAIGN_ID,
        "Chiến dịch Thanh niên tình nguyện Hè 2026 — Đại học, Cao đẳng",
        1,
        "SELF_ASSESSMENT",
        "2026-08-31T16:59:59.000Z",
        25,
        now,
        now,
      ),
  );

  criteria.forEach((criterion, index) => {
    const id = `criterion-${String(index + 1).padStart(3, "0")}`;
    statements.push(
      db
        .prepare("INSERT OR IGNORE INTO criteria(id,campaign_id,code,section,title,instructions,team_code,maximum,sort_order,active) VALUES(?,?,?,?,?,?,?,?,?,1)")
        .bind(
          id,
          CAMPAIGN_ID,
          criterion.code,
          criterion.section,
          criterion.title,
          criterion.instructions,
          criterion.teamCode,
          criterion.maximum,
          index + 1,
        ),
    );
  });

  for (const unit of units.filter((item) => item.groupCode === "UNIVERSITY")) {
    statements.push(
      db
        .prepare("INSERT OR IGNORE INTO campaign_units(campaign_id,unit_id,status) VALUES(?,?,'DRAFT')")
        .bind(CAMPAIGN_ID, unit.id),
    );
    criteria.forEach((_, index) => {
      const criterionId = `criterion-${String(index + 1).padStart(3, "0")}`;
      statements.push(
        db
          .prepare("INSERT OR IGNORE INTO assessments(id,campaign_id,unit_id,criterion_id,self_score,report,evidence_url,updated_at) VALUES(?,?,?,?,0,'','',?)")
          .bind(
            `assessment-${unit.id}-${criterionId}`,
            CAMPAIGN_ID,
            unit.id,
            criterionId,
            now,
          ),
      );
    });
  }

  statements.push(
    db
      .prepare("INSERT OR REPLACE INTO app_meta(key,value) VALUES('seed_version',?)")
      .bind(SEED_VERSION),
  );
  await runBatches(db, statements, 40);
}

async function runBatches(
  db: Db,
  statements: D1PreparedStatement[],
  size: number,
) {
  for (let index = 0; index < statements.length; index += size) {
    await db.batch(statements.slice(index, index + size));
  }
}
