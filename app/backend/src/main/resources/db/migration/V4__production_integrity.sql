alter table campaign add constraint chk_campaign_phase
  check (phase in ('PREPARATION', 'SELF_ASSESSMENT', 'ROUND_1', 'EXPLANATION', 'ROUND_2', 'FINAL_REVIEW', 'PUBLISHED', 'CLOSED', 'CANCELLED'));

alter table scorecard_group add constraint chk_scorecard_group_section
  check (section in ('CORE', 'BONUS'));
alter table scorecard_line add constraint chk_scorecard_line_evidence_policy
  check (evidence_policy in ('LINK', 'DOCUMENT', 'INTERNAL', 'GUIDED'));
alter table scorecard_line add constraint chk_scorecard_line_maximum
  check (maximum_score >= 0);

alter table app_account add constraint chk_app_account_role
  check (role in ('SUPERADMIN', 'CAMPAIGN_ADMIN', 'REVIEWER', 'UNIT_MEMBER'));
alter table authentication_event add constraint chk_authentication_event_outcome
  check (outcome in ('SUCCEEDED', 'DENIED'));

alter table submission add constraint fk_submission_organization
  foreign key (organization_id) references organization(id);
alter table submission add constraint chk_submission_status
  check (status in ('DRAFT', 'SUBMITTED', 'RETURNED', 'RESUBMITTED', 'LOCKED'));
alter table submission add constraint chk_submission_score
  check (self_score >= 0);
alter table submission_revision add constraint fk_submission_revision_actor
  foreign key (submitted_by) references app_account(id);
alter table submission_revision add constraint chk_submission_revision_values
  check (revision >= 1 and self_score >= 0);

alter table review_case add constraint fk_review_case_team
  foreign key (team_id) references review_team(id);
alter table review_case add constraint fk_review_case_reviewer
  foreign key (reviewer_id) references app_account(id);
alter table review_case add constraint chk_review_case_round1
  check (round1_status in ('NOT_OPEN', 'WAITING_FOR_SUBMISSION', 'QUEUED', 'IN_PROGRESS', 'COMPLETED', 'INCLUDED_IN_BATCH'));
alter table review_case add constraint chk_review_case_round2
  check (round2_status in ('NOT_OPEN', 'WAITING_FOR_SUBMISSION', 'QUEUED', 'IN_PROGRESS', 'COMPLETED', 'INCLUDED_IN_BATCH'));
alter table review_decision add constraint fk_review_decision_actor
  foreign key (decided_by) references app_account(id);
alter table review_decision add constraint chk_review_decision_values
  check (round_number in (1, 2) and revision >= 1 and awarded_score >= 0);
alter table explanation_revision add constraint fk_explanation_revision_actor
  foreign key (submitted_by) references app_account(id);
alter table explanation_revision add constraint chk_explanation_revision_number
  check (revision >= 1);

alter table final_result add constraint fk_final_result_prepared_by
  foreign key (prepared_by) references app_account(id);
alter table final_result add constraint fk_final_result_approved_by
  foreign key (approved_by) references app_account(id);
alter table final_result add constraint fk_final_result_published_by
  foreign key (published_by) references app_account(id);
alter table final_result add constraint chk_final_result_status
  check (status in ('CALCULATED', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'SUPERSEDED'));
alter table final_result add constraint chk_final_result_values
  check (result_version >= 1 and total_score >= 0);

alter table audit_record add constraint fk_audit_record_actor
  foreign key (actor_id) references app_account(id);
alter table idempotency_record add constraint fk_idempotency_actor
  foreign key (actor_id) references app_account(id);

create index idx_authentication_event_username_time
  on authentication_event (username, occurred_at);
create index idx_submission_campaign_organization_status
  on submission (campaign_id, organization_id, status);
create index idx_review_case_reviewer_status
  on review_case (reviewer_id, round1_status, round2_status);
create index idx_final_result_campaign_status
  on final_result (campaign_id, status, result_version);
create index idx_audit_correlation
  on audit_record (correlation_id);
