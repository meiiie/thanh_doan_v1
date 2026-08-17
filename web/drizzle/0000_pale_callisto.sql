CREATE TABLE `app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`criterion_id` text NOT NULL,
	`self_score` real DEFAULT 0 NOT NULL,
	`report` text DEFAULT '' NOT NULL,
	`evidence_url` text DEFAULT '' NOT NULL,
	`updated_by` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`criterion_id`) REFERENCES `criteria`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_assessments_scope` ON `assessments` (`campaign_id`,`unit_id`,`criterion_id`);--> statement-breakpoint
CREATE INDEX `idx_assessments_unit` ON `assessments` (`campaign_id`,`unit_id`);--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_created` ON `audit_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `campaign_units` (
	`campaign_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`status` text NOT NULL,
	`submitted_at` text,
	`finalized_at` text,
	PRIMARY KEY(`campaign_id`, `unit_id`),
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_campaign_units_status` ON `campaign_units` (`campaign_id`,`status`);--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`scorecard_version` integer NOT NULL,
	`phase` text NOT NULL,
	`self_deadline` text NOT NULL,
	`bonus_cap` real NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `criteria` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`code` text NOT NULL,
	`section` text NOT NULL,
	`title` text NOT NULL,
	`instructions` text NOT NULL,
	`team_code` text NOT NULL,
	`maximum` real NOT NULL,
	`sort_order` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_criteria_campaign_code` ON `criteria` (`campaign_id`,`code`);--> statement-breakpoint
CREATE INDEX `idx_criteria_team` ON `criteria` (`campaign_id`,`team_code`);--> statement-breakpoint
CREATE TABLE `explanations` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`message` text NOT NULL,
	`evidence_url` text DEFAULT '' NOT NULL,
	`author_user_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_explanations_assessment` ON `explanations` (`assessment_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `final_result_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`core_maximum` real NOT NULL,
	`core_score` real NOT NULL,
	`bonus_raw` real NOT NULL,
	`bonus_score` real NOT NULL,
	`total_score` real NOT NULL,
	`rate` real NOT NULL,
	`classification` text NOT NULL,
	`snapshot_json` text NOT NULL,
	`finalized_by` text NOT NULL,
	`finalized_at` text NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`finalized_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_final_snapshots_scope` ON `final_result_snapshots` (`campaign_id`,`unit_id`,`finalized_at`);--> statement-breakpoint
CREATE TABLE `final_results` (
	`campaign_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`core_maximum` real NOT NULL,
	`core_score` real NOT NULL,
	`bonus_raw` real NOT NULL,
	`bonus_score` real NOT NULL,
	`total_score` real NOT NULL,
	`rate` real NOT NULL,
	`classification` text NOT NULL,
	`snapshot_json` text NOT NULL,
	`finalized_by` text NOT NULL,
	`finalized_at` text NOT NULL,
	PRIMARY KEY(`campaign_id`, `unit_id`),
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`finalized_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `idempotency_keys` (
	`key` text PRIMARY KEY NOT NULL,
	`actor_user_id` text NOT NULL,
	`action` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `review_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`round` integer NOT NULL,
	`score` real NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`reviewer_user_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_review_latest` ON `review_decisions` (`assessment_id`,`round`,`created_at`);--> statement-breakpoint
CREATE TABLE `unit_groups` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `units` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`group_code` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`group_code`) REFERENCES `unit_groups`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_units_code` ON `units` (`code`);--> statement-breakpoint
CREATE INDEX `idx_units_group` ON `units` (`group_code`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`external_user_id` text,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text NOT NULL,
	`team_code` text,
	`unit_id` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_unit` ON `users` (`unit_id`);--> statement-breakpoint
CREATE INDEX `idx_users_team` ON `users` (`team_code`);