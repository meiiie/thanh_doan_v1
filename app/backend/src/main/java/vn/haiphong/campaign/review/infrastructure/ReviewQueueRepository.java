package vn.haiphong.campaign.review.infrastructure;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import vn.haiphong.campaign.lifecycle.application.OptimisticConflict;
import vn.haiphong.campaign.lifecycle.domain.ReviewCase;
import vn.haiphong.campaign.lifecycle.domain.ReviewStatus;
import vn.haiphong.campaign.lifecycle.domain.Submission;
import vn.haiphong.campaign.lifecycle.domain.SubmissionStatus;
import vn.haiphong.campaign.review.application.ReviewQueueView;

@Repository
public class ReviewQueueRepository {
    public static final String CAMPAIGN_ID = "campaign-summer-2026";
    private final JdbcTemplate jdbc;

    public ReviewQueueRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public CampaignRow campaign() {
        return jdbc.queryForObject(
                "select id, name, phase from campaign where id = ?",
                (rs, row) -> new CampaignRow(rs.getString("id"), rs.getString("name"), rs.getString("phase")),
                CAMPAIGN_ID
        );
    }

    public Optional<String> teamName(String teamId) {
        List<String> rows = jdbc.query(
                "select name from review_team where id = ? and campaign_id = ? and enabled = true",
                (rs, row) -> rs.getString("name"), teamId, CAMPAIGN_ID
        );
        return rows.stream().findFirst();
    }

    public List<ReviewQueueView.CaseView> cases(String reviewerId, String teamId, String phase) {
        int roundNumber = "ROUND_2".equals(phase) || "FINAL_REVIEW".equals(phase) || "PUBLISHED".equals(phase)
                ? 2 : 1;
        String statusColumn = roundNumber == 2 ? "rc.round2_status" : "rc.round1_status";
        return jdbc.query(
                "select rc.id, o.name organization_name, g.code group_code, l.code line_code, l.title line_title, " +
                        "l.maximum_score, s.self_score, s.evidence_url, s.summary, " + statusColumn + " current_status, rc.version, " +
                        "rd.awarded_score, rd.reason, rd.evidence_checked, aa.display_name decided_by_name, rd.decided_at, " +
                        "r1.awarded_score round1_score, r1.reason round1_reason, ex.body explanation_body, " +
                        "ex.evidence_url explanation_url, coalesce(ex.revision, 0) explanation_revision " +
                        "from review_case rc join submission s on s.id = rc.submission_id " +
                        "join organization o on o.id = s.organization_id " +
                        "join scorecard_line l on l.id = rc.line_id join scorecard_group g on g.id = l.group_id " +
                        "left join review_decision rd on rd.id = (select rd2.id from review_decision rd2 " +
                        "where rd2.review_case_id = rc.id and rd2.round_number = ? " +
                        "order by rd2.revision desc fetch first 1 row only) " +
                        "left join app_account aa on aa.id = rd.decided_by " +
                        "left join review_decision r1 on r1.id = (select r12.id from review_decision r12 " +
                        "where r12.review_case_id = rc.id and r12.round_number = 1 " +
                        "order by r12.revision desc fetch first 1 row only) " +
                        "left join explanation_revision ex on ex.id = (select ex2.id from explanation_revision ex2 " +
                        "where ex2.review_case_id = rc.id order by ex2.revision desc fetch first 1 row only) " +
                        "where s.campaign_id = ? and rc.reviewer_id = ? and rc.team_id = ? " +
                        "order by case " + statusColumn + " when 'QUEUED' then 0 when 'IN_PROGRESS' then 1 else 2 end, " +
                        "o.name, g.display_order, l.display_order",
                (rs, row) -> new ReviewQueueView.CaseView(
                        rs.getString("id"), rs.getString("organization_name"), rs.getString("group_code"),
                        rs.getString("line_code"), rs.getString("line_title"), rs.getBigDecimal("maximum_score"),
                        rs.getBigDecimal("self_score"), rs.getString("evidence_url"), rs.getString("summary"),
                        roundNumber, rs.getString("current_status"), rs.getInt("version"), rs.getBigDecimal("awarded_score"),
                        rs.getString("reason"), rs.getBoolean("evidence_checked"),
                        rs.getString("decided_by_name"), rs.getObject("decided_at", OffsetDateTime.class),
                        rs.getBigDecimal("round1_score"), rs.getString("round1_reason"),
                        rs.getString("explanation_body"), rs.getString("explanation_url"),
                        rs.getInt("explanation_revision")
                ), roundNumber, CAMPAIGN_ID, reviewerId, teamId
        );
    }

    public Optional<CaseContext> caseContext(String caseId, String reviewerId, String teamId) {
        List<CaseContext> rows = jdbc.query(
                "select rc.id, rc.submission_id, rc.line_id, rc.team_id, rc.reviewer_id, rc.round1_status, " +
                        "rc.round2_status, rc.version, s.campaign_id, s.organization_id, s.status submission_status, " +
                        "s.self_score, s.evidence_url, s.summary, s.revision submission_revision, " +
                        "s.version submission_version, l.maximum_score " +
                        "from review_case rc join submission s on s.id = rc.submission_id " +
                        "join scorecard_line l on l.id = rc.line_id " +
                        "where rc.id = ? and rc.reviewer_id = ? and rc.team_id = ? and s.campaign_id = ?",
                (rs, row) -> new CaseContext(
                        new ReviewCase(
                                rs.getString("id"), rs.getString("submission_id"), rs.getString("line_id"),
                                rs.getString("team_id"), rs.getString("reviewer_id"),
                                ReviewStatus.valueOf(rs.getString("round1_status")),
                                ReviewStatus.valueOf(rs.getString("round2_status")), rs.getInt("version")
                        ), new Submission(
                                rs.getString("submission_id"), rs.getString("campaign_id"),
                                rs.getString("organization_id"), rs.getString("line_id"),
                                SubmissionStatus.valueOf(rs.getString("submission_status")),
                                rs.getBigDecimal("self_score"), rs.getString("evidence_url"),
                                rs.getString("summary"), rs.getInt("submission_revision"),
                                rs.getInt("submission_version")
                        ), rs.getBigDecimal("maximum_score")
                ), caseId, reviewerId, teamId, CAMPAIGN_ID
        );
        return rows.stream().findFirst();
    }

    public void completeRoundOne(CaseContext context, ReviewCase completed, BigDecimal score,
                                 boolean evidenceChecked, String reason, String actorId, OffsetDateTime now) {
        int changed = jdbc.update(
                "update review_case set round1_status = ?, version = ? where id = ? and version = ?",
                completed.roundOneStatus().name(), completed.version(), context.reviewCase().id(),
                context.reviewCase().version()
        );
        if (changed != 1) throw new OptimisticConflict("Hồ sơ thẩm định đã thay đổi. Hãy tải lại.");
        Integer revision = jdbc.queryForObject(
                "select count(*) + 1 from review_decision where review_case_id = ? and round_number = 1",
                Integer.class, context.reviewCase().id()
        );
        int nextRevision = revision == null ? 1 : revision;
        jdbc.update(
                "insert into review_decision " +
                        "(id, review_case_id, round_number, revision, awarded_score, reason, evidence_checked, decided_by, decided_at) " +
                        "values (?, ?, 1, ?, ?, ?, ?, ?, ?)",
                context.reviewCase().id() + "-round1-r" + nextRevision, context.reviewCase().id(), nextRevision,
                score, blankToNull(reason), evidenceChecked, actorId, now
        );
        jdbc.update(
                "insert into audit_record " +
                        "(occurred_at, actor_id, action, aggregate_type, aggregate_id, from_state, to_state, reason, correlation_id, aggregate_version) " +
                        "values (?, ?, 'COMPLETE_ROUND_ONE', 'ReviewCase', ?, ?, ?, ?, ?, ?)",
                now, actorId, context.reviewCase().id(), context.reviewCase().roundOneStatus().name(),
                completed.roundOneStatus().name(), blankToNull(reason), UUID.randomUUID().toString(), completed.version()
        );
    }

    public void returnToUnit(CaseContext context, ReviewCase waiting, Submission returned,
                             String reason, String actorId, OffsetDateTime now) {
        int caseChanged = jdbc.update(
                "update review_case set round1_status = ?, version = ? where id = ? and version = ?",
                waiting.roundOneStatus().name(), waiting.version(), context.reviewCase().id(),
                context.reviewCase().version()
        );
        if (caseChanged != 1) throw new OptimisticConflict("Hồ sơ thẩm định đã thay đổi. Hãy tải lại.");
        int submissionChanged = jdbc.update(
                "update submission set status = ?, version = ?, updated_at = ?, updated_by = ? " +
                        "where id = ? and version = ?",
                returned.status().name(), returned.version(), now, actorId,
                context.submission().id(), context.submission().version()
        );
        if (submissionChanged != 1) throw new OptimisticConflict("Hồ sơ đã thay đổi. Hãy tải lại.");
        jdbc.update(
                "insert into submission_return_event " +
                        "(id, submission_id, submission_revision, reason, returned_by, returned_at) " +
                        "values (?, ?, ?, ?, ?, ?)",
                context.submission().id() + "-return-r" + context.submission().revision(),
                context.submission().id(), context.submission().revision(), reason.trim(), actorId, now
        );
        audit(now, actorId, "RETURN_SUBMISSION", "Submission", returned.id(),
                context.submission().status().name(), returned.status().name(), reason, returned.version());
    }

    public void completeRoundTwo(CaseContext context, ReviewCase completed, BigDecimal score,
                                 boolean evidenceChecked, String reason, String actorId, OffsetDateTime now) {
        int changed = jdbc.update(
                "update review_case set round2_status = ?, version = ? where id = ? and version = ?",
                completed.roundTwoStatus().name(), completed.version(), context.reviewCase().id(),
                context.reviewCase().version()
        );
        if (changed != 1) throw new OptimisticConflict("Hồ sơ thẩm định đã thay đổi. Hãy tải lại.");
        Integer revision = jdbc.queryForObject(
                "select count(*) + 1 from review_decision where review_case_id = ? and round_number = 2",
                Integer.class, context.reviewCase().id()
        );
        int nextRevision = revision == null ? 1 : revision;
        jdbc.update(
                "insert into review_decision " +
                        "(id, review_case_id, round_number, revision, awarded_score, reason, evidence_checked, decided_by, decided_at) " +
                        "values (?, ?, 2, ?, ?, ?, ?, ?, ?)",
                context.reviewCase().id() + "-round2-r" + nextRevision, context.reviewCase().id(), nextRevision,
                score, blankToNull(reason), evidenceChecked, actorId, now
        );
        audit(now, actorId, "COMPLETE_ROUND_TWO", "ReviewCase", context.reviewCase().id(),
                context.reviewCase().roundTwoStatus().name(), completed.roundTwoStatus().name(), reason,
                completed.version());
    }

    private void audit(OffsetDateTime now, String actorId, String action, String type, String id,
                       String from, String to, String reason, int version) {
        jdbc.update(
                "insert into audit_record " +
                        "(occurred_at, actor_id, action, aggregate_type, aggregate_id, from_state, to_state, reason, correlation_id, aggregate_version) " +
                        "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                now, actorId, action, type, id, from, to, blankToNull(reason), UUID.randomUUID().toString(), version
        );
    }

    private static String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    public record CampaignRow(String id, String name, String phase) {}
    public record CaseContext(ReviewCase reviewCase, Submission submission, BigDecimal maximumScore) {
        public BigDecimal selfScore() { return submission.selfScore(); }
    }
}
