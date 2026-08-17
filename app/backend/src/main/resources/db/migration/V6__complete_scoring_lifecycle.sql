create table submission_return_event (
  id varchar(100) primary key,
  submission_id varchar(80) not null references submission(id),
  submission_revision integer not null,
  reason varchar(4000) not null,
  returned_by varchar(80) not null references app_account(id),
  returned_at timestamp with time zone not null,
  unique (submission_id, submission_revision)
);

create index idx_submission_return_latest
  on submission_return_event (submission_id, returned_at desc);

create table final_result_unit (
  final_result_id varchar(100) not null references final_result(id),
  organization_id varchar(80) not null references organization(id),
  organization_code varchar(80) not null,
  organization_name varchar(500) not null,
  unit_group_code varchar(40) not null,
  applicable_core_maximum decimal(10,2) not null,
  core_score decimal(10,2) not null,
  bonus_raw_score decimal(10,2) not null,
  bonus_capped_score decimal(10,2) not null,
  total_score decimal(10,2) not null,
  completion_rate decimal(10,4) not null,
  primary key (final_result_id, organization_id),
  constraint chk_final_result_unit_scores check (
    applicable_core_maximum >= 0 and core_score >= 0 and bonus_raw_score >= 0 and
    bonus_capped_score >= 0 and total_score >= 0 and completion_rate >= 0
  )
);

create table final_result_line (
  final_result_id varchar(100) not null references final_result(id),
  organization_id varchar(80) not null references organization(id),
  organization_code varchar(80) not null,
  organization_name varchar(500) not null,
  unit_group_code varchar(40) not null,
  line_id varchar(80) not null references scorecard_line(id),
  group_code varchar(40) not null,
  line_code varchar(40) not null,
  line_title varchar(1000) not null,
  section varchar(20) not null,
  maximum_score decimal(10,2) not null,
  self_score decimal(10,2) not null,
  round1_score decimal(10,2) not null,
  round1_reason varchar(4000),
  explanation_body varchar(4000),
  explanation_evidence_url varchar(2000),
  round2_score decimal(10,2) not null,
  round2_reason varchar(4000),
  effective_score decimal(10,2) not null,
  submission_evidence_url varchar(2000) not null,
  submission_summary varchar(4000) not null,
  submission_revision integer not null,
  round1_decided_by varchar(80) not null,
  round1_decided_by_name varchar(240) not null,
  round1_decided_at timestamp with time zone not null,
  round2_decided_by varchar(80) not null,
  round2_decided_by_name varchar(240) not null,
  round2_decided_at timestamp with time zone not null,
  primary key (final_result_id, organization_id, line_id),
  constraint chk_final_result_line_section check (section in ('CORE', 'BONUS')),
  constraint chk_final_result_line_scores check (
    maximum_score >= 0 and self_score >= 0 and round1_score >= 0 and
    round2_score >= 0 and effective_score >= 0
  )
);

create index idx_final_result_unit_rank
  on final_result_unit (final_result_id, total_score desc, organization_name);
create index idx_final_result_line_export
  on final_result_line (final_result_id, organization_name, group_code, line_code);
