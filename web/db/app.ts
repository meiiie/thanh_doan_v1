import { calculateResult, validateReviewScore } from "@/domain/scoring.mjs";
import { requireTransition } from "@/domain/workflow.mjs";
import type { Actor } from "@/app/auth";
import { isAdmin, isReviewer } from "@/app/auth";
import { CAMPAIGN_ID } from "./seed";
import { ensureDatabase, getD1 } from "./runtime";

export type Campaign = {
  id: string;
  name: string;
  phase: string;
  selfDeadline: string;
  bonusCap: number;
  scorecardVersion: number;
};

export type ScorecardRow = {
  assessmentId: string;
  criterionId: string;
  code: string;
  section: "CORE" | "BONUS";
  title: string;
  instructions: string;
  teamCode: string;
  maximum: number;
  applicable: number;
  selfScore: number;
  report: string;
  evidenceUrl: string;
  round1Score: number | null;
  round1Reason: string | null;
  round2Score: number | null;
  round2Reason: string | null;
  explanation: string | null;
  explanationEvidenceUrl: string | null;
};

export type UnitSummary = {
  unitId: string;
  unitCode: string;
  unitName: string;
  status: string;
  completed: number;
  totalCriteria: number;
  selfTotal: number;
  finalTotal: number | null;
  rate: number | null;
  classification: string | null;
};

export async function getCampaign(): Promise<Campaign> {
  await ensureDatabase();
  const db = getD1();
  let campaign = await db
    .prepare("SELECT id,name,phase,self_deadline AS selfDeadline,bonus_cap AS bonusCap,scorecard_version AS scorecardVersion FROM campaigns WHERE id=?")
    .bind(CAMPAIGN_ID)
    .first<Campaign>();
  if (!campaign) throw new Error("CAMPAIGN_NOT_FOUND");
  if (
    campaign.phase === "SELF_ASSESSMENT" &&
    Date.now() > Date.parse(campaign.selfDeadline)
  ) {
    const now = new Date().toISOString();
    const results = await db.batch([
      db
        .prepare("UPDATE campaigns SET phase='ROUND1',updated_at=? WHERE id=? AND phase='SELF_ASSESSMENT' AND self_deadline<?")
        .bind(now, campaign.id, now),
      db
        .prepare("UPDATE campaign_units SET status='LOCKED' WHERE campaign_id=? AND status='DRAFT' AND EXISTS (SELECT 1 FROM campaigns WHERE id=? AND phase='ROUND1' AND updated_at=?)")
        .bind(campaign.id, campaign.id, now),
      db
        .prepare("INSERT INTO audit_events(id,actor_user_id,action,target_type,target_id,metadata_json,created_at) SELECT ?,NULL,'AUTO_DEADLINE_LOCKED','CAMPAIGN',?,'{}',? WHERE EXISTS (SELECT 1 FROM campaigns WHERE id=? AND phase='ROUND1' AND updated_at=?)")
        .bind(crypto.randomUUID(), campaign.id, now, campaign.id, now),
    ]);
    if ((results[0]?.meta.changes ?? 0) > 0) {
      campaign = { ...campaign, phase: "ROUND1" };
    } else {
      campaign =
        (await db
          .prepare("SELECT id,name,phase,self_deadline AS selfDeadline,bonus_cap AS bonusCap,scorecard_version AS scorecardVersion FROM campaigns WHERE id=?")
          .bind(CAMPAIGN_ID)
          .first<Campaign>()) ?? campaign;
    }
  }
  return campaign;
}

export async function getUnit(unitId: string) {
  await ensureDatabase();
  return getD1()
    .prepare("SELECT id,code,name,group_code AS groupCode FROM units WHERE id=? AND active=1")
    .bind(unitId)
    .first<{ id: string; code: string; name: string; groupCode: string }>();
}

export async function getUnitScorecard(unitId: string): Promise<{
  campaign: Campaign;
  unit: NonNullable<Awaited<ReturnType<typeof getUnit>>>;
  status: string;
  rows: ScorecardRow[];
}> {
  const [campaign, unit] = await Promise.all([getCampaign(), getUnit(unitId)]);
  if (!unit) throw new Error("UNIT_NOT_FOUND");
  const db = getD1();
  const enrollment = await db
    .prepare("SELECT status FROM campaign_units WHERE campaign_id=? AND unit_id=?")
    .bind(campaign.id, unitId)
    .first<{ status: string }>();
  if (!enrollment) throw new Error("UNIT_NOT_IN_CAMPAIGN");

  const result = await db
    .prepare(
      `SELECT
        a.id AS assessmentId, c.id AS criterionId, c.code, c.section, c.title,
        c.instructions, c.team_code AS teamCode, c.maximum,a.applicable,
        a.self_score AS selfScore, a.report, a.evidence_url AS evidenceUrl,
        (SELECT score FROM review_decisions r WHERE r.assessment_id=a.id AND r.round=1 ORDER BY r.created_at DESC,r.id DESC LIMIT 1) AS round1Score,
        (SELECT reason FROM review_decisions r WHERE r.assessment_id=a.id AND r.round=1 ORDER BY r.created_at DESC,r.id DESC LIMIT 1) AS round1Reason,
        (SELECT score FROM review_decisions r WHERE r.assessment_id=a.id AND r.round=2 ORDER BY r.created_at DESC,r.id DESC LIMIT 1) AS round2Score,
        (SELECT reason FROM review_decisions r WHERE r.assessment_id=a.id AND r.round=2 ORDER BY r.created_at DESC,r.id DESC LIMIT 1) AS round2Reason,
        (SELECT message FROM explanations e WHERE e.assessment_id=a.id ORDER BY e.created_at DESC,e.id DESC LIMIT 1) AS explanation,
        (SELECT evidence_url FROM explanations e WHERE e.assessment_id=a.id ORDER BY e.created_at DESC,e.id DESC LIMIT 1) AS explanationEvidenceUrl
      FROM assessments a
      JOIN criteria c ON c.id=a.criterion_id
      WHERE a.campaign_id=? AND a.unit_id=? AND c.active=1
      ORDER BY c.sort_order`,
    )
    .bind(campaign.id, unitId)
    .all<ScorecardRow>();

  return { campaign, unit, status: enrollment.status, rows: result.results };
}

export async function getReviewQueue(actor: Actor): Promise<{
  campaign: Campaign;
  rows: Array<ScorecardRow & { unitId: string; unitName: string; status: string }>;
}> {
  if (!isReviewer(actor)) throw new Error("FORBIDDEN");
  const campaign = await getCampaign();
  if (!isAdmin(actor) && ["DRAFT", "SELF_ASSESSMENT"].includes(campaign.phase)) {
    return { campaign, rows: [] };
  }
  const teamFilter =
    actor.role === "SUPER_ADMIN" || actor.role === "ADMIN" ? null : actor.teamCode;
  if (!teamFilter && !isAdmin(actor)) throw new Error("TEAM_REQUIRED");
  const db = getD1();
  const sql = `SELECT
      a.id AS assessmentId, a.unit_id AS unitId, u.name AS unitName,
      cu.status, c.id AS criterionId, c.code, c.section, c.title, c.instructions,
      c.team_code AS teamCode, c.maximum,a.applicable,a.self_score AS selfScore,
      a.report, a.evidence_url AS evidenceUrl,
      (SELECT score FROM review_decisions r WHERE r.assessment_id=a.id AND r.round=1 ORDER BY r.created_at DESC,r.id DESC LIMIT 1) AS round1Score,
      (SELECT reason FROM review_decisions r WHERE r.assessment_id=a.id AND r.round=1 ORDER BY r.created_at DESC,r.id DESC LIMIT 1) AS round1Reason,
      (SELECT score FROM review_decisions r WHERE r.assessment_id=a.id AND r.round=2 ORDER BY r.created_at DESC,r.id DESC LIMIT 1) AS round2Score,
      (SELECT reason FROM review_decisions r WHERE r.assessment_id=a.id AND r.round=2 ORDER BY r.created_at DESC,r.id DESC LIMIT 1) AS round2Reason,
      (SELECT message FROM explanations e WHERE e.assessment_id=a.id ORDER BY e.created_at DESC,e.id DESC LIMIT 1) AS explanation,
      (SELECT evidence_url FROM explanations e WHERE e.assessment_id=a.id ORDER BY e.created_at DESC,e.id DESC LIMIT 1) AS explanationEvidenceUrl
    FROM assessments a
    JOIN criteria c ON c.id=a.criterion_id
    JOIN units u ON u.id=a.unit_id
    JOIN campaign_units cu ON cu.campaign_id=a.campaign_id AND cu.unit_id=a.unit_id
    WHERE a.campaign_id=? AND a.applicable=1 AND cu.status IN ('SUBMITTED','LOCKED','EXPLAINED','FINALIZED') ${teamFilter ? "AND c.team_code=?" : ""}
    ORDER BY c.sort_order,u.name`;
  const statement = teamFilter
    ? db.prepare(sql).bind(campaign.id, teamFilter)
    : db.prepare(sql).bind(campaign.id);
  const rows = await statement.all<
    ScorecardRow & { unitId: string; unitName: string; status: string }
  >();
  return { campaign, rows: rows.results };
}

export async function getAdminOverview(actor: Actor) {
  if (!isAdmin(actor) && actor.role !== "AUDITOR") throw new Error("FORBIDDEN");
  const campaign = await getCampaign();
  const result = await getD1()
    .prepare(
      `SELECT
        u.id AS unitId, u.code AS unitCode, u.name AS unitName, cu.status,
        SUM(CASE WHEN a.applicable=1 AND (a.report<>'' OR a.evidence_url<>'' OR a.self_score>0) THEN 1 ELSE 0 END) AS completed,
        SUM(a.applicable) AS totalCriteria,
        SUM(CASE WHEN a.applicable=1 THEN a.self_score ELSE 0 END) AS selfTotal,
        fr.total_score AS finalTotal, fr.rate, fr.classification
      FROM campaign_units cu
      JOIN units u ON u.id=cu.unit_id
      JOIN assessments a ON a.campaign_id=cu.campaign_id AND a.unit_id=cu.unit_id
      LEFT JOIN final_results fr ON fr.campaign_id=cu.campaign_id AND fr.unit_id=cu.unit_id
      WHERE cu.campaign_id=?
      GROUP BY u.id,u.code,u.name,cu.status,fr.total_score,fr.rate,fr.classification
      ORDER BY u.name`,
    )
    .bind(campaign.id)
    .all<UnitSummary>();
  return { campaign, units: result.results };
}

export async function getFinalResultHistory(actor: Actor) {
  if (!isAdmin(actor) && actor.role !== "AUDITOR") throw new Error("FORBIDDEN");
  await ensureDatabase();
  const result = await getD1()
    .prepare(
      `SELECT frs.id,frs.campaign_id AS campaignId,frs.unit_id AS unitId,
        u.code AS unitCode,u.name AS unitName,frs.core_maximum AS coreMaximum,
        frs.core_score AS coreScore,frs.bonus_raw AS bonusRaw,
        frs.bonus_score AS bonusScore,frs.total_score AS totalScore,
        frs.rate,frs.classification,frs.snapshot_json AS snapshotJson,
        frs.finalized_by AS finalizedBy,frs.finalized_at AS finalizedAt
       FROM final_result_snapshots frs
       JOIN units u ON u.id=frs.unit_id
       WHERE frs.campaign_id=?
       ORDER BY frs.finalized_at,u.name`,
    )
    .bind(CAMPAIGN_ID)
    .all<{
      id: string;
      campaignId: string;
      unitId: string;
      unitCode: string;
      unitName: string;
      coreMaximum: number;
      coreScore: number;
      bonusRaw: number;
      bonusScore: number;
      totalScore: number;
      rate: number;
      classification: string;
      snapshotJson: string;
      finalizedBy: string;
      finalizedAt: string;
    }>();
  return result.results.map(({ snapshotJson, ...row }) => ({
    ...row,
    criteria: JSON.parse(snapshotJson) as unknown,
  }));
}

export async function getCampaignBackup(actor: Actor) {
  if (actor.role !== "SUPER_ADMIN") throw new Error("FORBIDDEN");
  await ensureDatabase();
  const db = getD1();
  const results = await Promise.all([
    db.prepare("SELECT * FROM app_meta ORDER BY key").all(),
    db.prepare("SELECT * FROM unit_groups ORDER BY sort_order").all(),
    db.prepare("SELECT * FROM units ORDER BY group_code,name").all(),
    db.prepare("SELECT * FROM users ORDER BY role,display_name").all(),
    db.prepare("SELECT * FROM campaigns WHERE id=?").bind(CAMPAIGN_ID).all(),
    db.prepare("SELECT * FROM campaign_units WHERE campaign_id=? ORDER BY unit_id").bind(CAMPAIGN_ID).all(),
    db.prepare("SELECT * FROM criteria WHERE campaign_id=? ORDER BY sort_order").bind(CAMPAIGN_ID).all(),
    db.prepare("SELECT * FROM assessments WHERE campaign_id=? ORDER BY unit_id,criterion_id").bind(CAMPAIGN_ID).all(),
    db.prepare("SELECT r.* FROM review_decisions r JOIN assessments a ON a.id=r.assessment_id WHERE a.campaign_id=? ORDER BY r.created_at,r.id").bind(CAMPAIGN_ID).all(),
    db.prepare("SELECT e.* FROM explanations e JOIN assessments a ON a.id=e.assessment_id WHERE a.campaign_id=? ORDER BY e.created_at,e.id").bind(CAMPAIGN_ID).all(),
    db.prepare("SELECT * FROM final_results WHERE campaign_id=? ORDER BY unit_id").bind(CAMPAIGN_ID).all(),
    db.prepare("SELECT * FROM final_result_snapshots WHERE campaign_id=? ORDER BY finalized_at,unit_id").bind(CAMPAIGN_ID).all(),
    db.prepare("SELECT * FROM audit_events ORDER BY created_at,id").all(),
  ]);
  const names = [
    "appMeta",
    "unitGroups",
    "units",
    "users",
    "campaigns",
    "campaignUnits",
    "criteria",
    "assessments",
    "reviewDecisions",
    "explanations",
    "finalResults",
    "finalResultSnapshots",
    "auditEvents",
  ];
  return Object.fromEntries(
    names.map((name, index) => [name, results[index]?.results ?? []]),
  );
}

export async function recordExport(actor: Actor, kind: string) {
  const allowedKinds = new Set(["RESULT_CSV", "UNIT_CSV", "FINAL_HISTORY", "FULL_BACKUP"]);
  if (!allowedKinds.has(kind)) throw new Error("INVALID_EXPORT_KIND");
  await ensureDatabase();
  const now = new Date().toISOString();
  const db = getD1();
  await db.batch([
    auditStatement(db, actor, "DATA_EXPORTED", "CAMPAIGN", CAMPAIGN_ID, { kind }, now),
  ]);
}

export async function getAudit(actor: Actor, limit = 100) {
  if (!isAdmin(actor) && actor.role !== "AUDITOR") throw new Error("FORBIDDEN");
  await ensureDatabase();
  const result = await getD1()
    .prepare(
      `SELECT ae.id,ae.action,ae.target_type AS targetType,ae.target_id AS targetId,
        ae.metadata_json AS metadataJson,ae.created_at AS createdAt,
        COALESCE(u.display_name,'Hệ thống') AS actorName
      FROM audit_events ae
      LEFT JOIN users u ON u.id=ae.actor_user_id
      ORDER BY ae.created_at DESC LIMIT ?`,
    )
    .bind(Math.min(Math.max(limit, 1), 250))
    .all<{
      id: string;
      action: string;
      targetType: string;
      targetId: string;
      metadataJson: string;
      createdAt: string;
      actorName: string;
    }>();
  return result.results;
}

export async function listDirectory(actor: Actor) {
  if (!isAdmin(actor) && actor.role !== "AUDITOR") throw new Error("FORBIDDEN");
  await ensureDatabase();
  const db = getD1();
  const [unitResult, userResult] = await Promise.all([
    db
      .prepare("SELECT id,code,name,group_code AS groupCode FROM units WHERE active=1 ORDER BY group_code,name")
      .all<{ id: string; code: string; name: string; groupCode: string }>(),
    db
      .prepare("SELECT id,email,display_name AS displayName,role,team_code AS teamCode,unit_id AS unitId,active FROM users WHERE email NOT LIKE '%@doan.local' ORDER BY role,display_name")
      .all<{ id: string; email: string; displayName: string; role: string; teamCode: string | null; unitId: string | null; active: number }>(),
  ]);
  return { units: unitResult.results, users: userResult.results };
}

export async function setAssessmentApplicability(
  actor: Actor,
  input: { assessmentId: string; applicable: boolean },
) {
  if (!isAdmin(actor)) throw new Error("FORBIDDEN");
  const db = getD1();
  const row = await db
    .prepare(
      `SELECT a.id,a.applicable,ca.phase,cu.status
       FROM assessments a
       JOIN campaigns ca ON ca.id=a.campaign_id
       JOIN campaign_units cu ON cu.campaign_id=a.campaign_id AND cu.unit_id=a.unit_id
       WHERE a.id=?`,
    )
    .bind(input.assessmentId)
    .first<{ id: string; applicable: number; phase: string; status: string }>();
  if (!row) throw new Error("ASSESSMENT_NOT_FOUND");
  if (!["DRAFT", "SELF_ASSESSMENT"].includes(row.phase) || row.status !== "DRAFT") {
    throw new Error("READ_ONLY");
  }
  if (Boolean(row.applicable) === input.applicable) return;
  const now = new Date().toISOString();
  await db.batch([
    db.prepare("UPDATE assessments SET applicable=?,updated_by=?,updated_at=? WHERE id=?")
      .bind(input.applicable ? 1 : 0, actor.id, now, row.id),
    auditStatement(
      db,
      actor,
      "ASSESSMENT_APPLICABILITY_CHANGED",
      "ASSESSMENT",
      row.id,
      { from: Boolean(row.applicable), to: input.applicable },
      now,
    ),
  ]);
}

export async function saveAssessment(
  actor: Actor,
  input: {
    assessmentId: string;
    score: number;
    report: string;
    evidenceUrl: string;
  },
) {
  if (actor.role !== "UNIT" || !actor.unitId) throw new Error("FORBIDDEN");
  const report = cleanText(input.report, 2000);
  const evidenceUrl = cleanUrl(input.evidenceUrl);
  const db = getD1();
  const row = await db
    .prepare(
      `SELECT a.id,a.unit_id AS unitId,c.maximum,a.applicable,ca.phase,
        ca.self_deadline AS selfDeadline,cu.status
       FROM assessments a JOIN criteria c ON c.id=a.criterion_id
       JOIN campaigns ca ON ca.id=a.campaign_id
       JOIN campaign_units cu ON cu.campaign_id=a.campaign_id AND cu.unit_id=a.unit_id
       WHERE a.id=?`,
    )
    .bind(input.assessmentId)
    .first<{ id: string; unitId: string; maximum: number; applicable: number; phase: string; selfDeadline: string; status: string }>();
  if (!row || row.unitId !== actor.unitId) throw new Error("FORBIDDEN");
  if (row.phase !== "SELF_ASSESSMENT" || row.status !== "DRAFT") throw new Error("READ_ONLY");
  if (!row.applicable) throw new Error("NOT_APPLICABLE");
  if (Date.now() > Date.parse(row.selfDeadline)) throw new Error("DEADLINE_PASSED");
  validateScore(input.score, row.maximum);
  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare("UPDATE assessments SET self_score=?,report=?,evidence_url=?,updated_by=?,updated_at=? WHERE id=?")
      .bind(input.score, report, evidenceUrl, actor.id, now, row.id),
    auditStatement(db, actor, "ASSESSMENT_SAVED", "ASSESSMENT", row.id, {
      score: input.score,
      hasEvidence: Boolean(evidenceUrl),
    }, now),
  ]);
}

export async function submitUnit(actor: Actor) {
  if (actor.role !== "UNIT" || !actor.unitId) throw new Error("FORBIDDEN");
  const campaign = await getCampaign();
  if (campaign.phase !== "SELF_ASSESSMENT") throw new Error("INVALID_PHASE");
  if (Date.now() > Date.parse(campaign.selfDeadline)) throw new Error("DEADLINE_PASSED");
  const db = getD1();
  const current = await db
    .prepare("SELECT status FROM campaign_units WHERE campaign_id=? AND unit_id=?")
    .bind(campaign.id, actor.unitId)
    .first<{ status: string }>();
  if (current?.status !== "DRAFT") throw new Error("ALREADY_SUBMITTED");
  const missing = await db
    .prepare("SELECT count(*) AS count FROM assessments WHERE campaign_id=? AND unit_id=? AND applicable=1 AND trim(report)=''")
    .bind(campaign.id, actor.unitId)
    .first<{ count: number }>();
  if ((missing?.count ?? 0) > 0) throw new Error("INCOMPLETE_SCORECARD");
  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare("UPDATE campaign_units SET status='SUBMITTED',submitted_at=? WHERE campaign_id=? AND unit_id=?")
      .bind(now, campaign.id, actor.unitId),
    auditStatement(db, actor, "UNIT_SUBMITTED", "CAMPAIGN_UNIT", actor.unitId, {}, now),
  ]);
}

export async function saveReview(
  actor: Actor,
  input: { assessmentId: string; score: number; reason: string },
) {
  if (!isReviewer(actor)) throw new Error("FORBIDDEN");
  const db = getD1();
  const row = await db
    .prepare(
      `SELECT a.id,a.self_score AS selfScore,a.applicable,c.maximum,c.team_code AS teamCode,
        ca.phase,cu.status
       FROM assessments a JOIN criteria c ON c.id=a.criterion_id
       JOIN campaigns ca ON ca.id=a.campaign_id
       JOIN campaign_units cu ON cu.campaign_id=a.campaign_id AND cu.unit_id=a.unit_id
       WHERE a.id=?`,
    )
    .bind(input.assessmentId)
    .first<{
      id: string;
      selfScore: number;
      applicable: number;
      maximum: number;
      teamCode: string;
      phase: string;
      status: string;
    }>();
  if (!row) throw new Error("ASSESSMENT_NOT_FOUND");
  if (!isAdmin(actor) && actor.teamCode !== row.teamCode) throw new Error("FORBIDDEN");
  if (!row.applicable) throw new Error("NOT_APPLICABLE");
  const round = row.phase === "ROUND1" ? 1 : row.phase === "ROUND2" ? 2 : 0;
  if (!round) throw new Error("INVALID_PHASE");
  if (!["SUBMITTED", "LOCKED", "EXPLAINED"].includes(row.status)) throw new Error("UNIT_NOT_READY");
  const reason = cleanText(input.reason, 1000);
  validateReviewScore(row.selfScore, input.score, row.maximum, reason);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.batch([
    db
      .prepare("INSERT INTO review_decisions(id,assessment_id,round,score,reason,reviewer_user_id,created_at) VALUES(?,?,?,?,?,?,?)")
      .bind(id, row.id, round, input.score, reason, actor.id, now),
    auditStatement(db, actor, `REVIEW_ROUND_${round}_SAVED`, "REVIEW_DECISION", id, {
      assessmentId: row.id,
      score: input.score,
    }, now),
  ]);
}

export async function saveExplanation(
  actor: Actor,
  input: { assessmentId: string; message: string; evidenceUrl: string },
) {
  if (actor.role !== "UNIT" || !actor.unitId) throw new Error("FORBIDDEN");
  const message = cleanText(input.message, 2000);
  if (!message) throw new Error("EXPLANATION_REQUIRED");
  const evidenceUrl = cleanUrl(input.evidenceUrl);
  const db = getD1();
  const row = await db
    .prepare(
      `SELECT a.id,a.unit_id AS unitId,a.applicable,ca.phase FROM assessments a
       JOIN campaigns ca ON ca.id=a.campaign_id WHERE a.id=?`,
    )
    .bind(input.assessmentId)
    .first<{ id: string; unitId: string; applicable: number; phase: string }>();
  if (!row || row.unitId !== actor.unitId) throw new Error("FORBIDDEN");
  if (!row.applicable) throw new Error("NOT_APPLICABLE");
  if (row.phase !== "EXPLANATION") throw new Error("INVALID_PHASE");
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare("INSERT INTO explanations(id,assessment_id,message,evidence_url,author_user_id,created_at) VALUES(?,?,?,?,?,?)")
      .bind(id, row.id, message, evidenceUrl, actor.id, now),
    db
      .prepare("UPDATE campaign_units SET status='EXPLAINED' WHERE campaign_id=? AND unit_id=?")
      .bind(CAMPAIGN_ID, actor.unitId),
    auditStatement(db, actor, "EXPLANATION_SAVED", "EXPLANATION", id, {
      assessmentId: row.id,
      hasEvidence: Boolean(evidenceUrl),
    }, now),
  ]);
}

export async function updateCampaignSettings(
  actor: Actor,
  input: { name: string; selfDeadline: string },
) {
  if (!isAdmin(actor)) throw new Error("FORBIDDEN");
  const campaign = await getCampaign();
  if (!["DRAFT", "SELF_ASSESSMENT"].includes(campaign.phase)) {
    throw new Error("INVALID_PHASE");
  }
  const name = cleanText(input.name, 180);
  if (!name) throw new Error("CAMPAIGN_NAME_REQUIRED");
  const selfDeadline = cleanDeadline(input.selfDeadline);
  if (Date.parse(selfDeadline) <= Date.now()) throw new Error("DEADLINE_MUST_BE_FUTURE");
  const now = new Date().toISOString();
  const db = getD1();
  await db.batch([
    db
      .prepare("UPDATE campaigns SET name=?,self_deadline=?,updated_at=? WHERE id=? AND phase IN ('DRAFT','SELF_ASSESSMENT')")
      .bind(name, selfDeadline, now, campaign.id),
    auditStatement(db, actor, "CAMPAIGN_SETTINGS_UPDATED", "CAMPAIGN", campaign.id, {
      previousName: campaign.name,
      name,
      previousSelfDeadline: campaign.selfDeadline,
      selfDeadline,
    }, now),
  ]);
}

export async function transitionCampaign(
  actor: Actor,
  nextPhase: string,
  reason = "",
) {
  if (!isAdmin(actor)) throw new Error("FORBIDDEN");
  const campaign = await getCampaign();
  requireTransition(campaign.phase, nextPhase);
  const db = getD1();
  const now = new Date().toISOString();
  const transitionReason = cleanText(reason, 500);

  if (campaign.phase === "FINALIZED" && nextPhase === "ROUND2") {
    if (!transitionReason) throw new Error("REOPEN_REASON_REQUIRED");
    await db.batch([
      db
        .prepare("UPDATE campaigns SET phase='ROUND2',updated_at=? WHERE id=? AND phase='FINALIZED'")
        .bind(now, campaign.id),
      db
        .prepare("UPDATE campaign_units SET status='EXPLAINED',finalized_at=NULL WHERE campaign_id=? AND status='FINALIZED'")
        .bind(campaign.id),
      db.prepare("DELETE FROM final_results WHERE campaign_id=?").bind(campaign.id),
      auditStatement(db, actor, "CAMPAIGN_REOPENED", "CAMPAIGN", campaign.id, {
        from: campaign.phase,
        to: nextPhase,
        reason: transitionReason,
      }, now),
    ]);
    return;
  }

  if (nextPhase === "FINALIZED") {
    await finalizeCampaign(actor, campaign, now);
    return;
  }

  const statements: D1PreparedStatement[] = [
    db
      .prepare("UPDATE campaigns SET phase=?,updated_at=? WHERE id=? AND phase=?")
      .bind(nextPhase, now, campaign.id, campaign.phase),
    auditStatement(db, actor, "CAMPAIGN_PHASE_CHANGED", "CAMPAIGN", campaign.id, {
      from: campaign.phase,
      to: nextPhase,
      reason: transitionReason || undefined,
    }, now),
  ];
  if (campaign.phase === "SELF_ASSESSMENT" && nextPhase === "ROUND1") {
    statements.push(
      db
        .prepare("UPDATE campaign_units SET status='LOCKED' WHERE campaign_id=? AND status='DRAFT'")
        .bind(campaign.id),
    );
  }
  await db.batch(statements);
}

async function finalizeCampaign(actor: Actor, campaign: Campaign, now: string) {
  const db = getD1();
  const missing = await db
    .prepare(
      `SELECT count(*) AS count FROM assessments a
       WHERE a.campaign_id=? AND a.applicable=1 AND NOT EXISTS (
         SELECT 1 FROM review_decisions r WHERE r.assessment_id=a.id
       )`,
    )
    .bind(campaign.id)
    .first<{ count: number }>();
  if ((missing?.count ?? 0) > 0) throw new Error("REVIEWS_INCOMPLETE");

  const units = await db
    .prepare("SELECT unit_id AS unitId FROM campaign_units WHERE campaign_id=?")
    .bind(campaign.id)
    .all<{ unitId: string }>();
  const statements: D1PreparedStatement[] = [];

  for (const { unitId } of units.results) {
    const scoreRows = await db
      .prepare(
        `SELECT c.id,c.code,c.section,c.maximum,a.applicable,
          COALESCE(
            (SELECT score FROM review_decisions r WHERE r.assessment_id=a.id AND r.round=2 ORDER BY r.created_at DESC,r.id DESC LIMIT 1),
            (SELECT score FROM review_decisions r WHERE r.assessment_id=a.id AND r.round=1 ORDER BY r.created_at DESC,r.id DESC LIMIT 1)
          ) AS score
        FROM assessments a JOIN criteria c ON c.id=a.criterion_id
        WHERE a.campaign_id=? AND a.unit_id=? AND c.active=1 ORDER BY c.sort_order`,
      )
      .bind(campaign.id, unitId)
      .all<{ id: string; code: string; section: "CORE" | "BONUS"; maximum: number; applicable: number; score: number | null }>();
    const result = calculateResult(
      scoreRows.results.map((row) => ({
        ...row,
        applicable: Boolean(row.applicable),
        score: row.score ?? 0,
      })),
      campaign.bonusCap,
    );
    const snapshotId = crypto.randomUUID();
    const snapshotJson = JSON.stringify(scoreRows.results);
    statements.push(
      db
        .prepare(
          `INSERT INTO final_result_snapshots(
            id,campaign_id,unit_id,core_maximum,core_score,bonus_raw,bonus_score,
            total_score,rate,classification,snapshot_json,finalized_by,finalized_at
          ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .bind(
          snapshotId,
          campaign.id,
          unitId,
          result.coreMaximum,
          result.coreScore,
          result.bonusRaw,
          result.bonusScore,
          result.totalScore,
          result.rate,
          result.classification,
          snapshotJson,
          actor.id,
          now,
        ),
      db
        .prepare(
          `INSERT OR REPLACE INTO final_results(
            campaign_id,unit_id,core_maximum,core_score,bonus_raw,bonus_score,
            total_score,rate,classification,snapshot_json,finalized_by,finalized_at
          ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .bind(
          campaign.id,
          unitId,
          result.coreMaximum,
          result.coreScore,
          result.bonusRaw,
          result.bonusScore,
          result.totalScore,
          result.rate,
          result.classification,
          snapshotJson,
          actor.id,
          now,
        ),
      db
        .prepare("UPDATE campaign_units SET status='FINALIZED',finalized_at=? WHERE campaign_id=? AND unit_id=?")
        .bind(now, campaign.id, unitId),
    );
  }
  statements.push(
    db
      .prepare("UPDATE campaigns SET phase='FINALIZED',updated_at=? WHERE id=? AND phase='ROUND2'")
      .bind(now, campaign.id),
    auditStatement(db, actor, "CAMPAIGN_FINALIZED", "CAMPAIGN", campaign.id, {
      unitCount: units.results.length,
    }, now),
  );
  await db.batch(statements);
}

export async function addUser(
  actor: Actor,
  input: {
    email: string;
    displayName: string;
    role: string;
    teamCode: string;
    unitId: string;
  },
) {
  if (!isAdmin(actor)) throw new Error("FORBIDDEN");
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("INVALID_EMAIL");
  if (email.endsWith("@doan.local")) throw new Error("RESERVED_EMAIL");
  const displayName = cleanText(input.displayName, 120);
  if (!displayName) throw new Error("DISPLAY_NAME_REQUIRED");
  const allowedRoles = new Set(["ADMIN", "TEAM_LEAD", "REVIEWER", "UNIT", "AUDITOR"]);
  if (!allowedRoles.has(input.role)) throw new Error("INVALID_ROLE");
  if (
    actor.role !== "SUPER_ADMIN" &&
    new Set(["ADMIN", "AUDITOR"]).has(input.role)
  ) {
    throw new Error("ROLE_GRANT_FORBIDDEN");
  }
  const teamCode = ["TEAM_LEAD", "REVIEWER"].includes(input.role)
    ? cleanTeam(input.teamCode)
    : null;
  const unitId = input.role === "UNIT" ? input.unitId : null;
  if (input.role === "UNIT" && !unitId) throw new Error("UNIT_REQUIRED");
  const db = getD1();
  const existing = await db
    .prepare("SELECT id FROM users WHERE lower(email)=?")
    .bind(email)
    .first<{ id: string }>();
  const id = existing?.id ?? crypto.randomUUID();
  const now = new Date().toISOString();
  await db.batch([
    existing
      ? db
          .prepare("UPDATE users SET display_name=?,role=?,team_code=?,unit_id=?,active=1 WHERE id=?")
          .bind(displayName, input.role, teamCode, unitId, id)
      : db
          .prepare("INSERT INTO users(id,email,display_name,role,team_code,unit_id,active,created_at) VALUES(?,?,?,?,?,?,1,?)")
          .bind(id, email, displayName, input.role, teamCode, unitId, now),
    auditStatement(db, actor, existing ? "USER_ACCESS_UPDATED" : "USER_CREATED", "USER", id, {
      role: input.role,
      teamCode,
      unitId,
    }, now),
  ]);
}

export async function setUserActive(
  actor: Actor,
  input: { userId: string; active: boolean },
) {
  if (!isAdmin(actor)) throw new Error("FORBIDDEN");
  const db = getD1();
  const target = await db
    .prepare("SELECT id,role,active FROM users WHERE id=? AND email NOT LIKE '%@doan.local'")
    .bind(input.userId)
    .first<{ id: string; role: string; active: number }>();
  if (!target) throw new Error("USER_NOT_FOUND");
  if (!input.active && target.id === actor.id) throw new Error("CANNOT_DEACTIVATE_SELF");
  if (target.role === "SUPER_ADMIN") throw new Error("CANNOT_CHANGE_OWNER");
  if (
    actor.role !== "SUPER_ADMIN" &&
    new Set(["ADMIN", "AUDITOR"]).has(target.role)
  ) {
    throw new Error("ROLE_GRANT_FORBIDDEN");
  }
  if (Boolean(target.active) === input.active) return;
  const now = new Date().toISOString();
  await db.batch([
    db.prepare("UPDATE users SET active=? WHERE id=?").bind(input.active ? 1 : 0, target.id),
    auditStatement(db, actor, input.active ? "USER_ACTIVATED" : "USER_DEACTIVATED", "USER", target.id, {}, now),
  ]);
}

export async function claimIdempotency(actor: Actor, key: string, action: string) {
  if (!/^[a-zA-Z0-9_-]{16,100}$/.test(key)) throw new Error("INVALID_IDEMPOTENCY_KEY");
  const result = await getD1()
    .prepare("INSERT OR IGNORE INTO idempotency_keys(key,actor_user_id,action,created_at) VALUES(?,?,?,?)")
    .bind(key, actor.id, action, new Date().toISOString())
    .run();
  return (result.meta.changes ?? 0) > 0;
}

function auditStatement(
  db: D1Database,
  actor: Actor,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown>,
  createdAt: string,
) {
  return db
    .prepare("INSERT INTO audit_events(id,actor_user_id,action,target_type,target_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)")
    .bind(
      crypto.randomUUID(),
      actor.id,
      action,
      targetType,
      targetId,
      JSON.stringify(metadata),
      createdAt,
    );
}

function cleanText(value: string, maximum: number) {
  const text = value.trim().replace(/\r\n/g, "\n");
  if (text.length > maximum) throw new Error("TEXT_TOO_LONG");
  return text;
}

function cleanUrl(value: string) {
  const text = value.trim();
  if (!text) return "";
  if (text.length > 1000) throw new Error("URL_TOO_LONG");
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error("INVALID_URL");
  }
  if (url.protocol !== "https:") throw new Error("HTTPS_URL_REQUIRED");
  return url.href;
}

function validateScore(score: number, maximum: number) {
  if (
    !Number.isFinite(score) ||
    score < 0 ||
    score > maximum ||
    !Number.isInteger(score * 2)
  ) {
    throw new Error("INVALID_SCORE");
  }
}

function cleanTeam(value: string) {
  const team = value.trim().toUpperCase();
  if (!new Set(["PT", "TH", "TG", "TCKT", "VP"]).has(team)) {
    throw new Error("INVALID_TEAM");
  }
  return team;
}

function cleanDeadline(value: string) {
  const text = value.trim();
  const localMatch = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?$/.exec(text);
  const timestamp = localMatch
    ? Date.parse(`${localMatch[1]}T${localMatch[2]}:00+07:00`)
    : Date.parse(text);
  if (!Number.isFinite(timestamp)) throw new Error("INVALID_DEADLINE");
  return new Date(timestamp).toISOString();
}
