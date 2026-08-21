package vn.haiphong.campaign.review.infrastructure;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import vn.haiphong.campaign.review.application.ReviewControlGateway;

@Repository
public class ReviewControlRepository implements ReviewControlGateway {
    private final JdbcTemplate jdbc;

    public ReviewControlRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public CampaignRow campaign() {
        return jdbc.queryForObject(
                "select id, name, phase, version from campaign where id = ?",
                (rs, row) -> new CampaignRow(
                        rs.getString("id"), rs.getString("name"), rs.getString("phase"), rs.getInt("version")
                ), CAMPAIGN_ID
        );
    }

    @Override
    public List<CriterionRow> criteria(int roundNumber) {
        String statusColumn = roundNumber == 2 ? "rc.round2_status" : "rc.round1_status";
        String expectedCases = roundNumber == 2
                ? "count(case when rc.round2_status <> 'NOT_OPEN' then 1 end)"
                : "count(*)";
        String submittedCases = roundNumber == 2
                ? "count(case when rc.round2_status <> 'NOT_OPEN' then 1 end)"
                : "count(rc.id)";
        String having = roundNumber == 2
                ? " having count(case when rc.round2_status <> 'NOT_OPEN' then 1 end) > 0"
                : "";
        return jdbc.query(
                "select g.id group_id, g.code, g.title, p.reviewer_id assessor_id, " +
                        "a.display_name assessor_name, t.name team_name, " + expectedCases + " expected_cases, " +
                        submittedCases + " submitted_cases, " +
                        "count(case when " + statusColumn + " = 'COMPLETED' then 1 end) completed_cases " +
                        "from scorecard_assignment_plan p " +
                        "join scorecard_group g on g.id = p.group_id " +
                        "join scorecard_line l on l.group_id = g.id " +
                        "join scorecard_applicability ap on ap.campaign_id = p.campaign_id " +
                        "and ap.group_id = p.group_id " +
                        "join organization o on o.unit_group_code = ap.unit_group_code and o.enabled = true " +
                        "join app_account a on a.id = p.reviewer_id " +
                        "join review_team t on t.id = p.team_id " +
                        "left join submission s on s.campaign_id = p.campaign_id and s.organization_id = o.id " +
                        "and s.line_id = l.id and s.revision > 0 " +
                        "left join review_case rc on rc.submission_id = s.id and rc.reviewer_id = p.reviewer_id " +
                        "and rc.team_id = p.team_id " +
                        "where p.campaign_id = ? and p.reviewer_id is not null and p.team_id is not null " +
                        "group by g.id, g.code, g.title, g.display_order, p.reviewer_id, a.display_name, t.name " +
                        having + " order by g.display_order",
                (rs, row) -> new CriterionRow(
                        rs.getString("group_id"), rs.getString("code"), rs.getString("title"),
                        rs.getString("assessor_id"), rs.getString("assessor_name"), rs.getString("team_name"),
                        rs.getInt("expected_cases"), rs.getInt("submitted_cases"), rs.getInt("completed_cases")
                ), CAMPAIGN_ID
        );
    }

    @Override
    public List<AssessorRow> assessors(int roundNumber) {
        String statusColumn = roundNumber == 2 ? "rc.round2_status" : "rc.round1_status";
        String assignedCriteria = roundNumber == 2
                ? "count(distinct case when rc.round2_status <> 'NOT_OPEN' then p.group_id end)"
                : "count(distinct p.group_id)";
        String expectedCases = roundNumber == 2
                ? "count(case when rc.round2_status <> 'NOT_OPEN' then 1 end)"
                : "count(*)";
        String submittedCases = roundNumber == 2
                ? "count(case when rc.round2_status <> 'NOT_OPEN' then 1 end)"
                : "count(rc.id)";
        String having = roundNumber == 2
                ? " having count(case when rc.round2_status <> 'NOT_OPEN' then 1 end) > 0"
                : "";
        return jdbc.query(
                "select a.id assessor_id, a.display_name assessor_name, t.name team_name, " +
                        assignedCriteria + " assigned_criteria, " + expectedCases + " expected_cases, " +
                        submittedCases + " submitted_cases, " +
                        "count(case when " + statusColumn + " = 'COMPLETED' then 1 end) completed_cases " +
                        "from scorecard_assignment_plan p " +
                        "join scorecard_group g on g.id = p.group_id " +
                        "join scorecard_line l on l.group_id = g.id " +
                        "join scorecard_applicability ap on ap.campaign_id = p.campaign_id " +
                        "and ap.group_id = p.group_id " +
                        "join organization o on o.unit_group_code = ap.unit_group_code and o.enabled = true " +
                        "join app_account a on a.id = p.reviewer_id and a.enabled = true " +
                        "join review_team t on t.id = p.team_id " +
                        "left join submission s on s.campaign_id = p.campaign_id and s.organization_id = o.id " +
                        "and s.line_id = l.id and s.revision > 0 " +
                        "left join review_case rc on rc.submission_id = s.id and rc.reviewer_id = p.reviewer_id " +
                        "and rc.team_id = p.team_id " +
                        "where p.campaign_id = ? and p.reviewer_id is not null and p.team_id is not null " +
                        "group by a.id, a.display_name, t.name" + having + " order by a.display_name",
                (rs, row) -> new AssessorRow(
                        rs.getString("assessor_id"), rs.getString("assessor_name"), rs.getString("team_name"),
                        rs.getInt("assigned_criteria"), rs.getInt("expected_cases"),
                        rs.getInt("submitted_cases"), rs.getInt("completed_cases")
                ), CAMPAIGN_ID
        );
    }

    @Override
    public IssueCounts issues(int roundNumber) {
        return jdbc.queryForObject(
                "select count(case when d.awarded_score < s.self_score " +
                        "and (d.reason is null or trim(d.reason) = '') then 1 end) reductions_without_reason, " +
                        "count(case when d.awarded_score < 0 or d.awarded_score > l.maximum_score then 1 end) " +
                        "out_of_range_cases from review_case rc " +
                        "join submission s on s.id = rc.submission_id " +
                        "join scorecard_line l on l.id = rc.line_id " +
                        "left join review_decision d on d.id = (select d2.id from review_decision d2 " +
                        "where d2.review_case_id = rc.id and d2.round_number = ? " +
                        "order by d2.revision desc fetch first 1 row only) " +
                        "where s.campaign_id = ?",
                (rs, row) -> new IssueCounts(
                        rs.getInt("reductions_without_reason"), rs.getInt("out_of_range_cases")
                ), roundNumber, CAMPAIGN_ID
        );
    }

    @Override
    public List<CaseRow> cases(String groupId, int roundNumber) {
        String statusColumn = roundNumber == 2 ? "rc.round2_status" : "rc.round1_status";
        String roundEligibility = roundNumber == 2 ? "and rc.round2_status <> 'NOT_OPEN' " : "";
        return jdbc.query(
                "select rc.id case_id, o.id organization_id, o.name organization_name, " +
                        "o.unit_group_code, l.id line_id, l.code line_code, l.title line_title, " +
                        "l.maximum_score, p.reviewer_id assessor_id, assessor.display_name assessor_name, " +
                        "t.name team_name, coalesce(s.status, 'NOT_SUBMITTED') submission_status, " +
                        "coalesce(s.revision, 0) submission_revision, s.self_score, s.evidence_url, s.summary, " +
                        "case when s.id is null then 'NOT_SUBMITTED' when rc.id is null then 'WAITING_FOR_REVIEW' " +
                        "else " + statusColumn + " end review_status, current_decision.awarded_score, " +
                        "current_decision.reason, coalesce(current_decision.evidence_checked, false) evidence_checked, " +
                        "current_actor.display_name decided_by_name, current_decision.decided_at, " +
                        "round_one.awarded_score round_one_score, round_one.reason round_one_reason, " +
                        "round_one_actor.display_name round_one_decided_by_name, round_one.decided_at round_one_decided_at, " +
                        "ex.body explanation_body, ex.evidence_url explanation_evidence_url, " +
                        "coalesce(ex.revision, 0) explanation_revision, round_two.awarded_score round_two_score, " +
                        "round_two.reason round_two_reason, round_two_actor.display_name round_two_decided_by_name, " +
                        "round_two.decided_at round_two_decided_at " +
                        "from scorecard_assignment_plan p " +
                        "join scorecard_group g on g.id = p.group_id " +
                        "join scorecard_line l on l.group_id = g.id " +
                        "join scorecard_applicability ap on ap.campaign_id = p.campaign_id " +
                        "and ap.group_id = p.group_id " +
                        "join organization o on o.unit_group_code = ap.unit_group_code and o.enabled = true " +
                        "join app_account assessor on assessor.id = p.reviewer_id " +
                        "join review_team t on t.id = p.team_id " +
                        "left join submission s on s.campaign_id = p.campaign_id and s.organization_id = o.id " +
                        "and s.line_id = l.id and s.revision > 0 " +
                        "left join review_case rc on rc.submission_id = s.id and rc.reviewer_id = p.reviewer_id " +
                        "and rc.team_id = p.team_id " +
                        "left join review_decision current_decision on current_decision.id = " +
                        "(select cd.id from review_decision cd where cd.review_case_id = rc.id " +
                        "and cd.round_number = ? order by cd.revision desc fetch first 1 row only) " +
                        "left join app_account current_actor on current_actor.id = current_decision.decided_by " +
                        "left join review_decision round_one on round_one.id = " +
                        "(select r1.id from review_decision r1 where r1.review_case_id = rc.id " +
                        "and r1.round_number = 1 order by r1.revision desc fetch first 1 row only) " +
                        "left join app_account round_one_actor on round_one_actor.id = round_one.decided_by " +
                        "left join explanation_revision ex on ex.id = " +
                        "(select er.id from explanation_revision er where er.review_case_id = rc.id " +
                        "order by er.revision desc fetch first 1 row only) " +
                        "left join review_decision round_two on round_two.id = " +
                        "(select r2.id from review_decision r2 where r2.review_case_id = rc.id " +
                        "and r2.round_number = 2 order by r2.revision desc fetch first 1 row only) " +
                        "left join app_account round_two_actor on round_two_actor.id = round_two.decided_by " +
                        "where p.campaign_id = ? and p.group_id = ? and p.reviewer_id is not null " +
                        "and p.team_id is not null " + roundEligibility +
                        "order by o.name, l.display_order",
                (rs, row) -> new CaseRow(
                        rs.getString("case_id"), rs.getString("organization_id"),
                        rs.getString("organization_name"), rs.getString("unit_group_code"),
                        rs.getString("line_id"), rs.getString("line_code"), rs.getString("line_title"),
                        rs.getBigDecimal("maximum_score"), rs.getString("assessor_id"),
                        rs.getString("assessor_name"), rs.getString("team_name"),
                        rs.getString("submission_status"), rs.getInt("submission_revision"),
                        rs.getBigDecimal("self_score"), rs.getString("evidence_url"), rs.getString("summary"),
                        roundNumber, rs.getString("review_status"), rs.getBigDecimal("awarded_score"),
                        rs.getString("reason"), rs.getBoolean("evidence_checked"),
                        rs.getString("decided_by_name"), rs.getObject("decided_at", OffsetDateTime.class),
                        rs.getBigDecimal("round_one_score"), rs.getString("round_one_reason"),
                        rs.getString("round_one_decided_by_name"),
                        rs.getObject("round_one_decided_at", OffsetDateTime.class),
                        rs.getString("explanation_body"), rs.getString("explanation_evidence_url"),
                        rs.getInt("explanation_revision"), rs.getBigDecimal("round_two_score"),
                        rs.getString("round_two_reason"), rs.getString("round_two_decided_by_name"),
                        rs.getObject("round_two_decided_at", OffsetDateTime.class)
                ), roundNumber, CAMPAIGN_ID, groupId
        );
    }
}
