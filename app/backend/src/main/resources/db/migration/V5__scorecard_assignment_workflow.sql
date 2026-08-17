create table scorecard_assignment_plan (
  campaign_id varchar(80) not null references campaign(id),
  group_id varchar(80) not null references scorecard_group(id),
  team_id varchar(80) references review_team(id),
  reviewer_id varchar(80) references app_account(id),
  version integer not null default 0,
  updated_at timestamp with time zone not null,
  updated_by varchar(80) not null references app_account(id),
  primary key (campaign_id, group_id),
  constraint chk_assignment_reviewer_team check (reviewer_id is null or team_id is not null)
);

create table scorecard_applicability (
  campaign_id varchar(80) not null,
  group_id varchar(80) not null,
  unit_group_code varchar(40) not null references unit_group(code),
  primary key (campaign_id, group_id, unit_group_code),
  foreign key (campaign_id, group_id)
    references scorecard_assignment_plan(campaign_id, group_id) on delete cascade
);

create index idx_assignment_team_reviewer
  on scorecard_assignment_plan (campaign_id, team_id, reviewer_id);
create index idx_applicability_unit_group
  on scorecard_applicability (campaign_id, unit_group_code, group_id);

alter table submission add column updated_at timestamp with time zone;
alter table submission add column updated_by varchar(80);
alter table submission add constraint fk_submission_updated_by
  foreign key (updated_by) references app_account(id);

create index idx_submission_line_status
  on submission (campaign_id, line_id, status);
