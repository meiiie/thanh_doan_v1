alter table organization add column source_file_name varchar(240);
alter table organization add column source_sha256 varchar(64);
alter table organization add column source_sheet_name varchar(120);
alter table organization add column source_row integer;

alter table review_team add column source_file_name varchar(240);
alter table review_team add column source_sha256 varchar(64);
alter table review_team add column source_sheet_name varchar(120);
alter table review_team add column source_row integer;

alter table app_account add column source_file_name varchar(240);
alter table app_account add column source_sha256 varchar(64);
alter table app_account add column source_sheet_name varchar(120);
alter table app_account add column source_row integer;

create index idx_organization_source on organization(source_sha256, source_sheet_name, source_row);
create index idx_review_team_source on review_team(source_sha256, source_sheet_name, source_row);
create index idx_app_account_source on app_account(source_sha256, source_sheet_name, source_row);
