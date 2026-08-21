package vn.haiphong.campaign.submission.infrastructure;

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
import vn.haiphong.campaign.submission.application.UnitTaskGateway;

@Repository
public class UnitTaskRepository implements UnitTaskGateway {
    private final JdbcTemplate jdbc;

    public UnitTaskRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public CampaignRow campaign() {
        return jdbc.queryForObject(
                "select id, name, phase from campaign where id = ?",
                (rs, row) -> new CampaignRow(rs.getString("id"), rs.getString("name"), rs.getString("phase")),
                CAMPAIGN_ID
        );
    }

    public Optional<OrganizationRow> organization(String organizationId) {
        List<OrganizationRow> rows = jdbc.query(
                "select o.id, o.name, o.unit_group_code, ug.name unit_group_name " +
                        "from organization o join unit_group ug on ug.code = o.unit_group_code " +
                        "where o.id = ? and o.enabled = true",
                (rs, row) -> new OrganizationRow(
                        rs.getString("id"), rs.getString("name"), rs.getString("unit_group_code"),
                        rs.getString("unit_group_name")
                ), organizationId
        );
        return rows.stream().findFirst();
    }

    public List<TaskRow> tasks(String organizationId) {
        return jdbc.query(
                "select l.id line_id, g.code group_code, l.code line_code, l.title, l.requirement, " +
                        "l.evidence_hint, l.evidence_policy, l.report_template, l.maximum_score, t.name team_name, " +
                        "s.status, s.self_score, s.evidence_url, s.summary, s.revision, s.version, " +
                        "ret.reason return_reason, ret.returned_at, " +
                        "r1.awarded_score round1_score, r1.reason round1_reason, a1.display_name round1_by, r1.decided_at round1_at, " +
                        "ex.body explanation_body, ex.evidence_url explanation_url, ex.revision explanation_revision, ex.submitted_at explanation_at, " +
                        "r2.awarded_score round2_score, r2.reason round2_reason, a2.display_name round2_by, r2.decided_at round2_at " +
                        "from organization o " +
                        "join scorecard_applicability a on a.campaign_id = ? and a.unit_group_code = o.unit_group_code " +
                        "join scorecard_assignment_plan p on p.campaign_id = a.campaign_id and p.group_id = a.group_id " +
                        "join review_team t on t.id = p.team_id " +
                        "join scorecard_group g on g.id = a.group_id " +
                        "join scorecard_line l on l.group_id = g.id " +
                        "left join submission s on s.campaign_id = a.campaign_id and s.organization_id = o.id and s.line_id = l.id " +
                        "left join review_case rc on rc.submission_id = s.id " +
                        "left join submission_return_event ret on ret.id = (select ret2.id from submission_return_event ret2 " +
                        "where ret2.submission_id = s.id order by ret2.returned_at desc fetch first 1 row only) " +
                        "left join review_decision r1 on r1.id = (select d1.id from review_decision d1 " +
                        "where d1.review_case_id = rc.id and d1.round_number = 1 order by d1.revision desc fetch first 1 row only) " +
                        "left join app_account a1 on a1.id = r1.decided_by " +
                        "left join explanation_revision ex on ex.id = (select ex2.id from explanation_revision ex2 " +
                        "where ex2.review_case_id = rc.id order by ex2.revision desc fetch first 1 row only) " +
                        "left join review_decision r2 on r2.id = (select d2.id from review_decision d2 " +
                        "where d2.review_case_id = rc.id and d2.round_number = 2 order by d2.revision desc fetch first 1 row only) " +
                        "left join app_account a2 on a2.id = r2.decided_by " +
                        "where o.id = ? and o.enabled = true order by g.display_order, l.display_order",
                (rs, row) -> new TaskRow(
                        rs.getString("line_id"), rs.getString("group_code"), rs.getString("line_code"),
                        rs.getString("title"), rs.getString("requirement"), rs.getString("evidence_hint"),
                        rs.getString("evidence_policy"), !"INTERNAL".equals(rs.getString("evidence_policy")),
                        !rs.getString("report_template").isBlank(), rs.getBigDecimal("maximum_score"),
                        rs.getString("team_name"), rs.getString("status") == null ? "NOT_STARTED" : rs.getString("status"),
                        rs.getBigDecimal("self_score"), blank(rs.getString("evidence_url")),
                        blank(rs.getString("summary")), rs.getInt("revision"), rs.getInt("version"),
                        blank(rs.getString("return_reason")), rs.getObject("returned_at", OffsetDateTime.class),
                        rs.getBigDecimal("round1_score"), blank(rs.getString("round1_reason")),
                        blank(rs.getString("round1_by")), rs.getObject("round1_at", OffsetDateTime.class),
                        blank(rs.getString("explanation_body")), blank(rs.getString("explanation_url")),
                        rs.getInt("explanation_revision"), rs.getObject("explanation_at", OffsetDateTime.class),
                        rs.getBigDecimal("round2_score"), blank(rs.getString("round2_reason")),
                        blank(rs.getString("round2_by")), rs.getObject("round2_at", OffsetDateTime.class)
                ), CAMPAIGN_ID, organizationId
        );
    }

    public Optional<ExplanationContext> explanationContext(String organizationId, String lineId) {
        List<ExplanationContext> rows = jdbc.query(
                "select rc.id review_case_id, rc.version review_version, s.self_score, " +
                        "r1.awarded_score round1_score, coalesce(max(ex.revision), 0) explanation_revision " +
                        "from submission s join review_case rc on rc.submission_id = s.id " +
                        "join review_decision r1 on r1.review_case_id = rc.id and r1.round_number = 1 " +
                        "left join explanation_revision ex on ex.review_case_id = rc.id " +
                        "where s.campaign_id = ? and s.organization_id = ? and s.line_id = ? " +
                        "and rc.round1_status = 'COMPLETED' and r1.revision = (select max(r.revision) " +
                        "from review_decision r where r.review_case_id = rc.id and r.round_number = 1) " +
                        "group by rc.id, rc.version, s.self_score, r1.awarded_score",
                (rs, row) -> new ExplanationContext(
                        rs.getString("review_case_id"), rs.getInt("review_version"),
                        rs.getBigDecimal("self_score"), rs.getBigDecimal("round1_score"),
                        rs.getInt("explanation_revision")
                ), CAMPAIGN_ID, organizationId, lineId
        );
        return rows.stream().findFirst();
    }

    public int addExplanation(ExplanationContext context, String body, String evidenceUrl,
                              int expectedRevision, String actorId, OffsetDateTime now) {
        if (context.explanationRevision() != expectedRevision) {
            throw new OptimisticConflict("Giải trình đã thay đổi. Hãy tải lại.");
        }
        int revision = expectedRevision + 1;
        jdbc.update(
                "insert into explanation_revision " +
                        "(id, review_case_id, revision, body, evidence_url, submitted_by, submitted_at) " +
                        "values (?, ?, ?, ?, ?, ?, ?)",
                context.reviewCaseId() + "-ex-r" + revision, context.reviewCaseId(), revision,
                body.trim(), nullable(evidenceUrl), actorId, now
        );
        audit(now, actorId, "SUBMIT_EXPLANATION", "ReviewCase", context.reviewCaseId(),
                expectedRevision == 0 ? null : "REVISION_" + expectedRevision,
                "REVISION_" + revision, revision);
        return revision;
    }

    public Optional<TaskContext> taskContext(String organizationId, String lineId) {
        List<TaskContext> rows = jdbc.query(
                "select l.id line_id, l.maximum_score, l.evidence_policy, l.report_template, " +
                        "p.team_id, p.reviewer_id from organization o " +
                        "join scorecard_applicability a on a.campaign_id = ? and a.unit_group_code = o.unit_group_code " +
                        "join scorecard_assignment_plan p on p.campaign_id = a.campaign_id and p.group_id = a.group_id " +
                        "join scorecard_line l on l.group_id = a.group_id " +
                        "where o.id = ? and o.enabled = true and l.id = ? and p.team_id is not null and p.reviewer_id is not null",
                (rs, row) -> new TaskContext(
                        rs.getString("line_id"), rs.getBigDecimal("maximum_score"),
                        rs.getString("evidence_policy"), !rs.getString("report_template").isBlank(),
                        rs.getString("team_id"), rs.getString("reviewer_id")
                ), CAMPAIGN_ID, organizationId, lineId
        );
        return rows.stream().findFirst();
    }

    public Optional<Submission> submission(String organizationId, String lineId) {
        List<Submission> rows = jdbc.query(
                "select id, campaign_id, organization_id, line_id, status, self_score, evidence_url, summary, " +
                        "revision, version from submission where campaign_id = ? and organization_id = ? and line_id = ?",
                (rs, row) -> new Submission(
                        rs.getString("id"), rs.getString("campaign_id"), rs.getString("organization_id"),
                        rs.getString("line_id"), SubmissionStatus.valueOf(rs.getString("status")),
                        rs.getBigDecimal("self_score"), rs.getString("evidence_url"), rs.getString("summary"),
                        rs.getInt("revision"), rs.getInt("version")
                ), CAMPAIGN_ID, organizationId, lineId
        );
        return rows.stream().findFirst();
    }

    public Submission draft(String organizationId, String lineId, BigDecimal selfScore, String evidenceUrl,
                            String summary, int expectedVersion, String actorId, OffsetDateTime now) {
        Optional<Submission> current = submission(organizationId, lineId);
        if (current.isEmpty()) {
            if (expectedVersion != 0) throw new OptimisticConflict("Hồ sơ đã thay đổi. Hãy tải lại.");
            Submission created = new Submission(
                    "submission-" + UUID.randomUUID(), CAMPAIGN_ID, organizationId, lineId,
                    SubmissionStatus.DRAFT, zero(selfScore), blank(evidenceUrl), blank(summary), 0, 1
            );
            jdbc.update(
                    "insert into submission " +
                            "(id, campaign_id, organization_id, line_id, status, self_score, evidence_url, summary, " +
                            "revision, version, updated_at, updated_by) values (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?)",
                    created.id(), CAMPAIGN_ID, organizationId, lineId, created.status().name(), created.selfScore(),
                    created.evidenceUrl(), created.summary(), now, actorId
            );
            return created;
        }
        Submission previous = current.get();
        if (previous.status() != SubmissionStatus.DRAFT && previous.status() != SubmissionStatus.RETURNED) {
            throw new vn.haiphong.campaign.lifecycle.domain.DomainRuleViolation(
                    "SUBMISSION_NOT_EDITABLE", "Hồ sơ đã nộp và không thể sửa."
            );
        }
        int changed = jdbc.update(
                "update submission set self_score = ?, evidence_url = ?, summary = ?, version = version + 1, " +
                        "updated_at = ?, updated_by = ? where id = ? and version = ?",
                zero(selfScore), blank(evidenceUrl), blank(summary), now, actorId, previous.id(), expectedVersion
        );
        if (changed != 1) throw new OptimisticConflict("Hồ sơ đã thay đổi. Hãy tải lại.");
        return submission(organizationId, lineId).orElseThrow();
    }

    public void submit(Submission previous, Submission submitted, String actorId, OffsetDateTime now,
                       String teamId, String reviewerId) {
        int changed = jdbc.update(
                "update submission set status = ?, self_score = ?, evidence_url = ?, summary = ?, revision = ?, " +
                        "version = ?, updated_at = ?, updated_by = ? where id = ? and version = ?",
                submitted.status().name(), submitted.selfScore(), submitted.evidenceUrl(), submitted.summary(),
                submitted.revision(), submitted.version(), now, actorId, previous.id(), previous.version()
        );
        if (changed != 1) throw new OptimisticConflict("Hồ sơ đã thay đổi. Hãy tải lại.");
        jdbc.update(
                "insert into submission_revision " +
                        "(id, submission_id, revision, self_score, evidence_url, summary, submitted_by, submitted_at) " +
                        "values (?, ?, ?, ?, ?, ?, ?, ?)",
                previous.id() + "-r" + submitted.revision(), previous.id(), submitted.revision(),
                submitted.selfScore(), submitted.evidenceUrl(), submitted.summary(), actorId, now
        );
        Optional<ReviewCase> review = review(previous.id());
        if (review.isEmpty()) {
            jdbc.update(
                    "insert into review_case " +
                            "(id, submission_id, line_id, team_id, reviewer_id, round1_status, round2_status, version) " +
                            "values (?, ?, ?, ?, ?, 'QUEUED', 'NOT_OPEN', 0)",
                    "review-" + UUID.randomUUID(), previous.id(), previous.lineId(), teamId, reviewerId
            );
        } else {
            ReviewCase queued = review.get().queueRoundOne();
            jdbc.update(
                    "update review_case set round1_status = ?, version = ? where id = ? and version = ?",
                    queued.roundOneStatus().name(), queued.version(), review.get().id(), review.get().version()
            );
        }
        audit(now, actorId, "SUBMIT_SUBMISSION", "Submission", previous.id(), previous.status().name(),
                submitted.status().name(), submitted.version());
    }

    public void draftAudit(OffsetDateTime now, String actorId, Submission submission) {
        audit(now, actorId, "SAVE_SUBMISSION_DRAFT", "Submission", submission.id(), null,
                submission.status().name(), submission.version());
    }

    private Optional<ReviewCase> review(String submissionId) {
        List<ReviewCase> rows = jdbc.query(
                "select id, submission_id, line_id, team_id, reviewer_id, round1_status, round2_status, version " +
                        "from review_case where submission_id = ?",
                (rs, row) -> new ReviewCase(
                        rs.getString("id"), rs.getString("submission_id"), rs.getString("line_id"),
                        rs.getString("team_id"), rs.getString("reviewer_id"),
                        ReviewStatus.valueOf(rs.getString("round1_status")),
                        ReviewStatus.valueOf(rs.getString("round2_status")), rs.getInt("version")
                ), submissionId
        );
        return rows.stream().findFirst();
    }

    private void audit(OffsetDateTime now, String actorId, String action, String type, String id,
                       String from, String to, int version) {
        jdbc.update(
                "insert into audit_record " +
                        "(occurred_at, actor_id, action, aggregate_type, aggregate_id, from_state, to_state, reason, correlation_id, aggregate_version) " +
                        "values (?, ?, ?, ?, ?, ?, ?, null, ?, ?)",
                now, actorId, action, type, id, from, to, UUID.randomUUID().toString(), version
        );
    }

    private static String blank(String value) { return value == null ? "" : value.trim(); }
    private static String nullable(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private static BigDecimal zero(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }

}
