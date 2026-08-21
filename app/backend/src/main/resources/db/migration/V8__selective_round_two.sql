alter table final_result_line alter column round2_score drop not null;
alter table final_result_line alter column round2_decided_by drop not null;
alter table final_result_line alter column round2_decided_by_name drop not null;
alter table final_result_line alter column round2_decided_at drop not null;

update account_capability
set capability = 'explanation.open'
where capability = 'round1.publish';
