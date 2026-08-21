package vn.haiphong.campaign.result.infrastructure;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import vn.haiphong.campaign.lifecycle.application.OptimisticConflict;
import vn.haiphong.campaign.lifecycle.domain.FinalResult;
import vn.haiphong.campaign.lifecycle.domain.FinalResultStatus;
import vn.haiphong.campaign.result.application.FinalResultGateway;

@Repository
public class FinalResultRepository implements FinalResultGateway {
    private final JdbcTemplate jdbc;

    public FinalResultRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public CampaignRow campaign() {
        return jdbc.queryForObject(
                "select id, name, phase, version from campaign where id = ?",
                (rs, row) -> new CampaignRow(
                        rs.getString("id"), rs.getString("name"), rs.getString("phase"), rs.getInt("version")
                ), CAMPAIGN_ID
        );
    }

    public int expectedTasks() {
        Integer value = jdbc.queryForObject(
                "select count(*) from scorecard_applicability a " +
                        "join organization o on o.unit_group_code = a.unit_group_code and o.enabled = true " +
                        "join scorecard_line l on l.group_id = a.group_id where a.campaign_id = ?",
                Integer.class, CAMPAIGN_ID
        );
        return value == null ? 0 : value;
    }

    public int resolvedTasks() {
        Integer value = jdbc.queryForObject(
                "select count(*) from review_case rc join submission s on s.id = rc.submission_id " +
                        "join review_decision r1 on r1.review_case_id = rc.id and r1.round_number = 1 " +
                        "and r1.revision = (select max(d.revision) from review_decision d " +
                        "where d.review_case_id = rc.id and d.round_number = 1) " +
                        "where s.campaign_id = ? and rc.round1_status = 'COMPLETED' and " +
                        "((r1.awarded_score >= s.self_score and rc.round2_status = 'NOT_OPEN') or " +
                        "(r1.awarded_score < s.self_score and rc.round2_status = 'COMPLETED'))",
                Integer.class, CAMPAIGN_ID
        );
        return value == null ? 0 : value;
    }

    public BigDecimal bonusCap() {
        return jdbc.queryForObject(
                "select bonus_cap from scorecard_version where id = 'scorecard-dhcd-v1'", BigDecimal.class
        );
    }

    public List<SnapshotLine> sourceLines() {
        return jdbc.query(
                "select o.id organization_id, o.code organization_code, o.name organization_name, " +
                        "o.unit_group_code, l.id line_id, g.code group_code, l.code line_code, l.title line_title, " +
                        "g.section, l.maximum_score, s.self_score, r1.awarded_score round1_score, " +
                        "r1.reason round1_reason, ex.body explanation_body, ex.evidence_url explanation_url, " +
                        "case when r1.awarded_score < s.self_score then r2.awarded_score end round2_score, " +
                        "case when r1.awarded_score < s.self_score then r2.reason end round2_reason, " +
                        "case when r1.awarded_score < s.self_score then r2.awarded_score " +
                        "else r1.awarded_score end effective_score, " +
                        "s.evidence_url submission_evidence_url, s.summary submission_summary, s.revision submission_revision, " +
                        "r1.decided_by round1_by, a1.display_name round1_by_name, r1.decided_at round1_at, " +
                        "case when r1.awarded_score < s.self_score then r2.decided_by end round2_by, " +
                        "case when r1.awarded_score < s.self_score then a2.display_name end round2_by_name, " +
                        "case when r1.awarded_score < s.self_score then r2.decided_at end round2_at " +
                        "from submission s join organization o on o.id = s.organization_id " +
                        "join scorecard_line l on l.id = s.line_id join scorecard_group g on g.id = l.group_id " +
                        "join review_case rc on rc.submission_id = s.id " +
                        "join review_decision r1 on r1.review_case_id = rc.id and r1.round_number = 1 " +
                        "and r1.revision = (select max(d1.revision) from review_decision d1 " +
                        "where d1.review_case_id = rc.id and d1.round_number = 1) " +
                        "join app_account a1 on a1.id = r1.decided_by " +
                        "left join explanation_revision ex on ex.review_case_id = rc.id and ex.revision = " +
                        "(select max(e.revision) from explanation_revision e where e.review_case_id = rc.id) " +
                        "left join review_decision r2 on r2.review_case_id = rc.id and r2.round_number = 2 " +
                        "and r2.revision = (select max(d2.revision) from review_decision d2 " +
                        "where d2.review_case_id = rc.id and d2.round_number = 2) " +
                        "left join app_account a2 on a2.id = r2.decided_by " +
                        "where s.campaign_id = ? and rc.round1_status = 'COMPLETED' and " +
                        "((r1.awarded_score >= s.self_score and rc.round2_status = 'NOT_OPEN') or " +
                        "(r1.awarded_score < s.self_score and rc.round2_status = 'COMPLETED' and r2.id is not null)) " +
                        "order by o.code, g.display_order, l.display_order",
                (rs, row) -> new SnapshotLine(
                        rs.getString("organization_id"), rs.getString("organization_code"),
                        rs.getString("organization_name"), rs.getString("unit_group_code"),
                        rs.getString("line_id"), rs.getString("group_code"), rs.getString("line_code"),
                        rs.getString("line_title"), rs.getString("section"), rs.getBigDecimal("maximum_score"),
                        rs.getBigDecimal("self_score"), rs.getBigDecimal("round1_score"),
                        rs.getString("round1_reason"), rs.getString("explanation_body"),
                        rs.getString("explanation_url"), rs.getBigDecimal("round2_score"),
                        rs.getString("round2_reason"), rs.getBigDecimal("effective_score"),
                        rs.getString("submission_evidence_url"), rs.getString("submission_summary"),
                        rs.getInt("submission_revision"), rs.getString("round1_by"),
                        rs.getString("round1_by_name"), rs.getObject("round1_at", OffsetDateTime.class),
                        rs.getString("round2_by"), rs.getString("round2_by_name"),
                        rs.getObject("round2_at", OffsetDateTime.class)
                ), CAMPAIGN_ID
        );
    }

    public int nextResultVersion() {
        Integer value = jdbc.queryForObject(
                "select coalesce(max(result_version), 0) + 1 from final_result where campaign_id = ?",
                Integer.class, CAMPAIGN_ID
        );
        return value == null ? 1 : value;
    }

    public void insertSnapshot(String resultId, int resultVersion, BigDecimal aggregateTotal, String checksum,
                               String actorId, OffsetDateTime now, int expectedCampaignVersion,
                               List<UnitSnapshot> units, List<SnapshotLine> lines) {
        int changed = jdbc.update(
                "update campaign set phase = 'FINAL_REVIEW', version = version + 1 " +
                        "where id = ? and phase = 'ROUND_2' and version = ?",
                CAMPAIGN_ID, expectedCampaignVersion
        );
        if (changed != 1) throw new OptimisticConflict("Chiến dịch đã thay đổi. Hãy tải lại.");
        jdbc.update(
                "insert into final_result " +
                        "(id, campaign_id, result_version, status, total_score, checksum, prepared_by, prepared_at, version) " +
                        "values (?, ?, ?, 'PENDING_APPROVAL', ?, ?, ?, ?, 1)",
                resultId, CAMPAIGN_ID, resultVersion, aggregateTotal, checksum, actorId, now
        );
        jdbc.batchUpdate(
                "insert into final_result_unit " +
                        "(final_result_id, organization_id, organization_code, organization_name, unit_group_code, " +
                        "applicable_core_maximum, core_score, bonus_raw_score, bonus_capped_score, total_score, completion_rate) " +
                        "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                new BatchPreparedStatementSetter() {
                    @Override public void setValues(PreparedStatement ps, int index) throws SQLException {
                        UnitSnapshot unit = units.get(index);
                        ps.setString(1, resultId); ps.setString(2, unit.organizationId());
                        ps.setString(3, unit.organizationCode()); ps.setString(4, unit.organizationName());
                        ps.setString(5, unit.unitGroupCode()); ps.setBigDecimal(6, unit.applicableCoreMaximum());
                        ps.setBigDecimal(7, unit.coreScore()); ps.setBigDecimal(8, unit.bonusRawScore());
                        ps.setBigDecimal(9, unit.bonusCappedScore()); ps.setBigDecimal(10, unit.totalScore());
                        ps.setBigDecimal(11, unit.completionRate());
                    }
                    @Override public int getBatchSize() { return units.size(); }
                }
        );
        jdbc.batchUpdate(
                "insert into final_result_line " +
                        "(final_result_id, organization_id, organization_code, organization_name, unit_group_code, " +
                        "line_id, group_code, line_code, line_title, section, maximum_score, self_score, " +
                        "round1_score, round1_reason, explanation_body, explanation_evidence_url, round2_score, " +
                        "round2_reason, effective_score, submission_evidence_url, submission_summary, submission_revision, " +
                        "round1_decided_by, round1_decided_by_name, round1_decided_at, round2_decided_by, " +
                        "round2_decided_by_name, round2_decided_at) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                new BatchPreparedStatementSetter() {
                    @Override public void setValues(PreparedStatement ps, int index) throws SQLException {
                        SnapshotLine line = lines.get(index);
                        int p = 1;
                        ps.setString(p++, resultId); ps.setString(p++, line.organizationId());
                        ps.setString(p++, line.organizationCode()); ps.setString(p++, line.organizationName());
                        ps.setString(p++, line.unitGroupCode()); ps.setString(p++, line.lineId());
                        ps.setString(p++, line.groupCode()); ps.setString(p++, line.lineCode());
                        ps.setString(p++, line.lineTitle()); ps.setString(p++, line.section());
                        ps.setBigDecimal(p++, line.maximumScore()); ps.setBigDecimal(p++, line.selfScore());
                        ps.setBigDecimal(p++, line.roundOneScore()); ps.setString(p++, line.roundOneReason());
                        ps.setString(p++, line.explanationBody()); ps.setString(p++, line.explanationEvidenceUrl());
                        ps.setBigDecimal(p++, line.roundTwoScore()); ps.setString(p++, line.roundTwoReason());
                        ps.setBigDecimal(p++, line.effectiveScore()); ps.setString(p++, line.submissionEvidenceUrl());
                        ps.setString(p++, line.submissionSummary()); ps.setInt(p++, line.submissionRevision());
                        ps.setString(p++, line.roundOneDecidedBy()); ps.setString(p++, line.roundOneDecidedByName());
                        ps.setObject(p++, line.roundOneDecidedAt()); ps.setString(p++, line.roundTwoDecidedBy());
                        ps.setString(p++, line.roundTwoDecidedByName()); ps.setObject(p, line.roundTwoDecidedAt());
                    }
                    @Override public int getBatchSize() { return lines.size(); }
                }
        );
        audit(now, actorId, "PREPARE_FINAL_RESULT", "FinalResult", resultId, null,
                "PENDING_APPROVAL", checksum, 1);
        audit(now, actorId, "START_FINAL_REVIEW", "Campaign", CAMPAIGN_ID, "ROUND_2",
                "FINAL_REVIEW", null, expectedCampaignVersion + 1);
    }

    public Optional<ResultHeader> current() {
        List<ResultHeader> rows = jdbc.query(
                "select fr.id, fr.campaign_id, fr.result_version, fr.status, fr.total_score, fr.checksum, " +
                        "fr.prepared_by, p.display_name prepared_by_name, fr.prepared_at, " +
                        "fr.approved_by, a.display_name approved_by_name, fr.approved_at, " +
                        "fr.published_by, u.display_name published_by_name, fr.published_at, fr.version " +
                        "from final_result fr join app_account p on p.id = fr.prepared_by " +
                        "left join app_account a on a.id = fr.approved_by left join app_account u on u.id = fr.published_by " +
                        "where fr.campaign_id = ? order by fr.result_version desc fetch first 1 row only",
                (rs, row) -> new ResultHeader(
                        new FinalResult(
                                rs.getString("id"), rs.getString("campaign_id"), rs.getInt("result_version"),
                                FinalResultStatus.valueOf(rs.getString("status")), rs.getBigDecimal("total_score"),
                                rs.getString("checksum"), rs.getString("prepared_by"), rs.getString("approved_by"),
                                rs.getString("published_by"), rs.getInt("version")
                        ), rs.getString("prepared_by_name"), rs.getObject("prepared_at", OffsetDateTime.class),
                        rs.getString("approved_by_name"), rs.getObject("approved_at", OffsetDateTime.class),
                        rs.getString("published_by_name"), rs.getObject("published_at", OffsetDateTime.class)
                ), CAMPAIGN_ID
        );
        return rows.stream().findFirst();
    }

    public int snapshotTaskCount(String resultId) {
        Integer value = jdbc.queryForObject(
                "select count(*) from final_result_line where final_result_id = ?", Integer.class, resultId
        );
        return value == null ? 0 : value;
    }

    public List<UnitSnapshot> units(String resultId) {
        return jdbc.query(
                "select organization_id, organization_code, organization_name, unit_group_code, " +
                        "applicable_core_maximum, core_score, bonus_raw_score, bonus_capped_score, total_score, completion_rate " +
                        "from final_result_unit where final_result_id = ? order by total_score desc, organization_name",
                (rs, row) -> new UnitSnapshot(
                        rs.getString("organization_id"), rs.getString("organization_code"),
                        rs.getString("organization_name"), rs.getString("unit_group_code"),
                        rs.getBigDecimal("applicable_core_maximum"), rs.getBigDecimal("core_score"),
                        rs.getBigDecimal("bonus_raw_score"), rs.getBigDecimal("bonus_capped_score"),
                        rs.getBigDecimal("total_score"), rs.getBigDecimal("completion_rate")
                ), resultId
        );
    }

    public List<SnapshotLine> snapshotLines(String resultId) {
        return jdbc.query(
                "select organization_id, organization_code, organization_name, unit_group_code, line_id, " +
                        "group_code, line_code, line_title, section, maximum_score, self_score, round1_score, " +
                        "round1_reason, explanation_body, explanation_evidence_url, round2_score, round2_reason, " +
                        "effective_score, submission_evidence_url, submission_summary, submission_revision, " +
                        "round1_decided_by, round1_decided_by_name, round1_decided_at, round2_decided_by, " +
                        "round2_decided_by_name, round2_decided_at from final_result_line where final_result_id = ? " +
                        "order by organization_code, group_code, line_code",
                (rs, row) -> new SnapshotLine(
                        rs.getString("organization_id"), rs.getString("organization_code"),
                        rs.getString("organization_name"), rs.getString("unit_group_code"),
                        rs.getString("line_id"), rs.getString("group_code"), rs.getString("line_code"),
                        rs.getString("line_title"), rs.getString("section"), rs.getBigDecimal("maximum_score"),
                        rs.getBigDecimal("self_score"), rs.getBigDecimal("round1_score"),
                        rs.getString("round1_reason"), rs.getString("explanation_body"),
                        rs.getString("explanation_evidence_url"), rs.getBigDecimal("round2_score"),
                        rs.getString("round2_reason"), rs.getBigDecimal("effective_score"),
                        rs.getString("submission_evidence_url"), rs.getString("submission_summary"),
                        rs.getInt("submission_revision"), rs.getString("round1_decided_by"),
                        rs.getString("round1_decided_by_name"), rs.getObject("round1_decided_at", OffsetDateTime.class),
                        rs.getString("round2_decided_by"), rs.getString("round2_decided_by_name"),
                        rs.getObject("round2_decided_at", OffsetDateTime.class)
                ), resultId
        );
    }

    public void approve(ResultHeader current, FinalResult approved, String actorId, OffsetDateTime now) {
        int changed = jdbc.update(
                "update final_result set status = ?, approved_by = ?, approved_at = ?, version = ? " +
                        "where id = ? and version = ?",
                approved.status().name(), actorId, now, approved.version(), approved.id(), current.result().version()
        );
        if (changed != 1) throw new OptimisticConflict("Kết quả đã thay đổi. Hãy tải lại.");
        audit(now, actorId, "APPROVE_FINAL_RESULT", "FinalResult", approved.id(),
                current.result().status().name(), approved.status().name(), null, approved.version());
    }

    public void publish(ResultHeader current, FinalResult published, int expectedCampaignVersion,
                        String actorId, OffsetDateTime now) {
        int resultChanged = jdbc.update(
                "update final_result set status = ?, published_by = ?, published_at = ?, version = ? " +
                        "where id = ? and version = ?",
                published.status().name(), actorId, now, published.version(), published.id(), current.result().version()
        );
        if (resultChanged != 1) throw new OptimisticConflict("Kết quả đã thay đổi. Hãy tải lại.");
        int campaignChanged = jdbc.update(
                "update campaign set phase = 'PUBLISHED', version = version + 1 " +
                        "where id = ? and phase = 'FINAL_REVIEW' and version = ?",
                CAMPAIGN_ID, expectedCampaignVersion
        );
        if (campaignChanged != 1) throw new OptimisticConflict("Chiến dịch đã thay đổi. Hãy tải lại.");
        audit(now, actorId, "PUBLISH_FINAL_RESULT", "FinalResult", published.id(),
                current.result().status().name(), published.status().name(), null, published.version());
        audit(now, actorId, "PUBLISH_CAMPAIGN", "Campaign", CAMPAIGN_ID, "FINAL_REVIEW",
                "PUBLISHED", null, expectedCampaignVersion + 1);
    }

    private void audit(OffsetDateTime now, String actorId, String action, String type, String id,
                       String from, String to, String reason, int version) {
        jdbc.update(
                "insert into audit_record " +
                        "(occurred_at, actor_id, action, aggregate_type, aggregate_id, from_state, to_state, reason, correlation_id, aggregate_version) " +
                        "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                now, actorId, action, type, id, from, to, reason, UUID.randomUUID().toString(), version
        );
    }

}
