create table organization (
  id varchar(80) primary key,
  code varchar(40) not null unique,
  name varchar(240) not null,
  unit_group_code varchar(40) not null references unit_group(code),
  enabled boolean not null default true,
  created_at timestamp with time zone not null,
  created_by varchar(80) not null references app_account(id)
);

create table review_team (
  id varchar(80) primary key,
  campaign_id varchar(80) not null references campaign(id),
  code varchar(40) not null,
  name varchar(240) not null,
  enabled boolean not null default true,
  created_at timestamp with time zone not null,
  created_by varchar(80) not null references app_account(id),
  unique (campaign_id, code)
);

alter table app_account add constraint fk_account_organization
  foreign key (organization_id) references organization(id);
alter table app_account add constraint fk_account_review_team
  foreign key (team_id) references review_team(id);

create index idx_organization_unit_group on organization (unit_group_code, name);
create index idx_review_team_campaign on review_team (campaign_id, name);
