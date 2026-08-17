import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const appMeta = sqliteTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const unitGroups = sqliteTable("unit_groups", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const units = sqliteTable(
  "units",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    groupCode: text("group_code")
      .notNull()
      .references(() => unitGroups.code),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  (table) => [
    uniqueIndex("uq_units_code").on(table.code),
    index("idx_units_group").on(table.groupCode),
  ],
);

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    externalUserId: text("external_user_id"),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    role: text("role").notNull(),
    teamCode: text("team_code"),
    unitId: text("unit_id").references(() => units.id),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("uq_users_email").on(table.email),
    index("idx_users_unit").on(table.unitId),
    index("idx_users_team").on(table.teamCode),
  ],
);

export const campaigns = sqliteTable("campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  scorecardVersion: integer("scorecard_version").notNull(),
  phase: text("phase").notNull(),
  selfDeadline: text("self_deadline").notNull(),
  bonusCap: real("bonus_cap").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const campaignUnits = sqliteTable(
  "campaign_units",
  {
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id),
    unitId: text("unit_id")
      .notNull()
      .references(() => units.id),
    status: text("status").notNull(),
    submittedAt: text("submitted_at"),
    finalizedAt: text("finalized_at"),
  },
  (table) => [
    primaryKey({ columns: [table.campaignId, table.unitId] }),
    index("idx_campaign_units_status").on(table.campaignId, table.status),
  ],
);

export const criteria = sqliteTable(
  "criteria",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id),
    code: text("code").notNull(),
    section: text("section").notNull(),
    title: text("title").notNull(),
    instructions: text("instructions").notNull(),
    teamCode: text("team_code").notNull(),
    maximum: real("maximum").notNull(),
    sortOrder: integer("sort_order").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  (table) => [
    uniqueIndex("uq_criteria_campaign_code").on(table.campaignId, table.code),
    index("idx_criteria_team").on(table.campaignId, table.teamCode),
  ],
);

export const assessments = sqliteTable(
  "assessments",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id),
    unitId: text("unit_id")
      .notNull()
      .references(() => units.id),
    criterionId: text("criterion_id")
      .notNull()
      .references(() => criteria.id),
    applicable: integer("applicable", { mode: "boolean" }).notNull().default(true),
    selfScore: real("self_score").notNull().default(0),
    report: text("report").notNull().default(""),
    evidenceUrl: text("evidence_url").notNull().default(""),
    updatedBy: text("updated_by").references(() => users.id),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("uq_assessments_scope").on(
      table.campaignId,
      table.unitId,
      table.criterionId,
    ),
    index("idx_assessments_unit").on(table.campaignId, table.unitId),
  ],
);

export const reviewDecisions = sqliteTable(
  "review_decisions",
  {
    id: text("id").primaryKey(),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id),
    round: integer("round").notNull(),
    score: real("score").notNull(),
    reason: text("reason").notNull().default(""),
    reviewerUserId: text("reviewer_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_review_latest").on(table.assessmentId, table.round, table.createdAt),
  ],
);

export const explanations = sqliteTable(
  "explanations",
  {
    id: text("id").primaryKey(),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id),
    message: text("message").notNull(),
    evidenceUrl: text("evidence_url").notNull().default(""),
    authorUserId: text("author_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_explanations_assessment").on(table.assessmentId, table.createdAt)],
);

export const finalResults = sqliteTable(
  "final_results",
  {
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id),
    unitId: text("unit_id")
      .notNull()
      .references(() => units.id),
    coreMaximum: real("core_maximum").notNull(),
    coreScore: real("core_score").notNull(),
    bonusRaw: real("bonus_raw").notNull(),
    bonusScore: real("bonus_score").notNull(),
    totalScore: real("total_score").notNull(),
    rate: real("rate").notNull(),
    classification: text("classification").notNull(),
    snapshotJson: text("snapshot_json").notNull(),
    finalizedBy: text("finalized_by")
      .notNull()
      .references(() => users.id),
    finalizedAt: text("finalized_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.campaignId, table.unitId] })],
);

export const finalResultSnapshots = sqliteTable(
  "final_result_snapshots",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id),
    unitId: text("unit_id")
      .notNull()
      .references(() => units.id),
    coreMaximum: real("core_maximum").notNull(),
    coreScore: real("core_score").notNull(),
    bonusRaw: real("bonus_raw").notNull(),
    bonusScore: real("bonus_score").notNull(),
    totalScore: real("total_score").notNull(),
    rate: real("rate").notNull(),
    classification: text("classification").notNull(),
    snapshotJson: text("snapshot_json").notNull(),
    finalizedBy: text("finalized_by")
      .notNull()
      .references(() => users.id),
    finalizedAt: text("finalized_at").notNull(),
  },
  (table) => [
    index("idx_final_snapshots_scope").on(
      table.campaignId,
      table.unitId,
      table.finalizedAt,
    ),
  ],
);

export const auditEvents = sqliteTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => users.id),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    metadataJson: text("metadata_json").notNull().default("{}"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_audit_created").on(table.createdAt)],
);

export const idempotencyKeys = sqliteTable("idempotency_keys", {
  key: text("key").primaryKey(),
  actorUserId: text("actor_user_id")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  createdAt: text("created_at").notNull(),
});
