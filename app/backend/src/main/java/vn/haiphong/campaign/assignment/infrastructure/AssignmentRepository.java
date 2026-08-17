package vn.haiphong.campaign.assignment.infrastructure;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import vn.haiphong.campaign.assignment.application.AssignmentWorkbenchView;
import vn.haiphong.campaign.lifecycle.application.OptimisticConflict;

@Repository
public class AssignmentRepository {
    public static final String CAMPAIGN_ID = "campaign-summer-2026";
    private static final String SCORECARD_ID = "scorecard-dhcd-v1";
    private final JdbcTemplate jdbc;

    public AssignmentRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public CampaignRow campaign() {
        return jdbc.queryForObject(
                "select c.id, c.name, c.phase, c.version, sv.status scorecard_status " +
                        "from campaign c join scorecard_version sv on sv.id = c.scorecard_version_id where c.id = ?",
                (rs, row) -> new CampaignRow(
                        rs.getString("id"), rs.getString("name"), rs.getString("phase"),
                        rs.getInt("version"), rs.getString("scorecard_status")
                ), CAMPAIGN_ID
        );
    }

    public List<AssignmentWorkbenchView.UnitGroupView> unitGroups() {
        return jdbc.query(
                "select code, name, documented_unit_count from unit_group order by name",
                (rs, row) -> new AssignmentWorkbenchView.UnitGroupView(
                        rs.getString("code"), rs.getString("name"), rs.getInt("documented_unit_count")
                )
        );
    }

    public List<AssignmentWorkbenchView.TeamView> teams() {
        return jdbc.query(
                "select id, name from review_team where campaign_id = ? and enabled = true order by name",
                (rs, row) -> new AssignmentWorkbenchView.TeamView(rs.getString("id"), rs.getString("name")),
                CAMPAIGN_ID
        );
    }

    public List<AssignmentWorkbenchView.ReviewerView> reviewers() {
        return jdbc.query(
                "select id, display_name, team_id from app_account " +
                        "where role = 'REVIEWER' and enabled = true and team_id is not null order by display_name",
                (rs, row) -> new AssignmentWorkbenchView.ReviewerView(
                        rs.getString("id"), rs.getString("display_name"), rs.getString("team_id")
                )
        );
    }

    public List<AssignmentWorkbenchView.PlanView> plans() {
        Map<String, MutablePlan> plans = new LinkedHashMap<>();
        jdbc.query(
                "select g.id group_id, p.team_id, p.reviewer_id, coalesce(p.version, 0) version, " +
                        "a.unit_group_code from scorecard_group g " +
                        "left join scorecard_assignment_plan p on p.campaign_id = ? and p.group_id = g.id " +
                        "left join scorecard_applicability a on a.campaign_id = p.campaign_id and a.group_id = p.group_id " +
                        "where g.scorecard_version_id = ? order by g.display_order, a.unit_group_code",
                rs -> {
                    String groupId = rs.getString("group_id");
                    String teamId = rs.getString("team_id");
                    String reviewerId = rs.getString("reviewer_id");
                    int version = rs.getInt("version");
                    MutablePlan plan = plans.computeIfAbsent(groupId, ignored -> new MutablePlan(
                            groupId, teamId, reviewerId, version, new ArrayList<>()
                    ));
                    String code = rs.getString("unit_group_code");
                    if (code != null) plan.unitGroupCodes().add(code);
                }, CAMPAIGN_ID, SCORECARD_ID
        );
        Map<String, ProgressRow> progress = progressByGroup();
        return plans.values().stream().map(plan -> {
            ProgressRow value = progress.getOrDefault(plan.groupId(), ProgressRow.EMPTY);
            return new AssignmentWorkbenchView.PlanView(
                    plan.groupId(), List.copyOf(plan.unitGroupCodes()), plan.teamId(), plan.reviewerId(),
                    plan.version(), value.expected(), value.submitted(), value.reviewed(),
                    value.lastReviewedBy(), value.lastReviewedAt()
            );
        }).toList();
    }

    public Optional<PlanRow> plan(String groupId) {
        List<PlanRow> rows = jdbc.query(
                "select team_id, reviewer_id, version from scorecard_assignment_plan " +
                        "where campaign_id = ? and group_id = ?",
                (rs, row) -> new PlanRow(
                        groupId, rs.getString("team_id"), rs.getString("reviewer_id"), rs.getInt("version")
                ), CAMPAIGN_ID, groupId
        );
        return rows.stream().findFirst();
    }

    public boolean groupExists(String groupId) {
        return exists("select count(*) from scorecard_group where id = ? and scorecard_version_id = ?", groupId, SCORECARD_ID);
    }

    public boolean unitGroupsExist(List<String> codes) {
        if (codes.isEmpty()) return true;
        String placeholders = String.join(",", java.util.Collections.nCopies(codes.size(), "?"));
        Integer count = jdbc.queryForObject(
                "select count(*) from unit_group where code in (" + placeholders + ")",
                Integer.class, codes.toArray()
        );
        return count != null && count == codes.size();
    }

    public boolean reviewerBelongsToTeam(String reviewerId, String teamId) {
        return exists(
                "select count(*) from app_account a join review_team t on t.id = a.team_id " +
                        "where a.id = ? and a.role = 'REVIEWER' and a.enabled = true " +
                        "and t.id = ? and t.campaign_id = ? and t.enabled = true",
                reviewerId, teamId, CAMPAIGN_ID
        );
    }

    public boolean teamExists(String teamId) {
        return exists(
                "select count(*) from review_team where id = ? and campaign_id = ? and enabled = true",
                teamId, CAMPAIGN_ID
        );
    }

    public int savePlan(String groupId, List<String> unitGroupCodes, String teamId, String reviewerId,
                        int expectedVersion, OffsetDateTime now, String actorId) {
        Optional<PlanRow> current = plan(groupId);
        int nextVersion;
        if (current.isEmpty()) {
            if (expectedVersion != 0) throw new OptimisticConflict("Phân công đã thay đổi. Hãy tải lại bảng.");
            jdbc.update(
                    "insert into scorecard_assignment_plan " +
                            "(campaign_id, group_id, team_id, reviewer_id, version, updated_at, updated_by) " +
                            "values (?, ?, ?, ?, 1, ?, ?)",
                    CAMPAIGN_ID, groupId, teamId, reviewerId, now, actorId
            );
            nextVersion = 1;
        } else {
            int changed = jdbc.update(
                    "update scorecard_assignment_plan set team_id = ?, reviewer_id = ?, version = version + 1, " +
                            "updated_at = ?, updated_by = ? where campaign_id = ? and group_id = ? and version = ?",
                    teamId, reviewerId, now, actorId, CAMPAIGN_ID, groupId, expectedVersion
            );
            if (changed != 1) throw new OptimisticConflict("Phân công đã thay đổi. Hãy tải lại bảng.");
            nextVersion = expectedVersion + 1;
        }
        jdbc.update("delete from scorecard_applicability where campaign_id = ? and group_id = ?", CAMPAIGN_ID, groupId);
        for (String code : unitGroupCodes) {
            jdbc.update(
                    "insert into scorecard_applicability (campaign_id, group_id, unit_group_code) values (?, ?, ?)",
                    CAMPAIGN_ID, groupId, code
            );
        }
        return nextVersion;
    }

    public int totalGroupCount() {
        Integer value = jdbc.queryForObject(
                "select count(*) from scorecard_group where scorecard_version_id = ?", Integer.class, SCORECARD_ID
        );
        return value == null ? 0 : value;
    }

    public int readyGroupCount() {
        Integer value = jdbc.queryForObject(
                "select count(*) from scorecard_assignment_plan p where p.campaign_id = ? " +
                        "and p.team_id is not null and p.reviewer_id is not null " +
                        "and exists (select 1 from scorecard_applicability a " +
                        "where a.campaign_id = p.campaign_id and a.group_id = p.group_id)",
                Integer.class, CAMPAIGN_ID
        );
        return value == null ? 0 : value;
    }

    public Counts counts() {
        Integer expected = jdbc.queryForObject(
                "select count(*) from scorecard_applicability a " +
                        "join organization o on o.unit_group_code = a.unit_group_code and o.enabled = true " +
                        "join scorecard_line l on l.group_id = a.group_id where a.campaign_id = ?",
                Integer.class, CAMPAIGN_ID
        );
        Integer submitted = jdbc.queryForObject(
                "select count(*) from submission where campaign_id = ? and status in ('SUBMITTED','RESUBMITTED','LOCKED')",
                Integer.class, CAMPAIGN_ID
        );
        Integer reviewed = jdbc.queryForObject(
                "select count(*) from review_case rc join submission s on s.id = rc.submission_id " +
                        "where s.campaign_id = ? and rc.round1_status = 'COMPLETED'",
                Integer.class, CAMPAIGN_ID
        );
        return new Counts(value(expected), value(submitted), value(reviewed));
    }

    public void release(int expectedCampaignVersion, OffsetDateTime now, String actorId) {
        int campaignChanged = jdbc.update(
                "update campaign set phase = 'SELF_ASSESSMENT', version = version + 1 " +
                        "where id = ? and phase = 'PREPARATION' and version = ?",
                CAMPAIGN_ID, expectedCampaignVersion
        );
        if (campaignChanged != 1) throw new OptimisticConflict("Chiến dịch đã thay đổi. Hãy tải lại.");
        jdbc.update("update scorecard_version set status = 'RELEASED', version = version + 1 where id = ?", SCORECARD_ID);
        audit(now, actorId, "RELEASE_ASSIGNMENT_SNAPSHOT", "Campaign", CAMPAIGN_ID,
                "PREPARATION", "SELF_ASSESSMENT", null, expectedCampaignVersion + 1);
    }

    public void startReview(int expectedCampaignVersion, OffsetDateTime now, String actorId) {
        int changed = jdbc.update(
                "update campaign set phase = 'ROUND_1', version = version + 1 " +
                        "where id = ? and phase = 'SELF_ASSESSMENT' and version = ?",
                CAMPAIGN_ID, expectedCampaignVersion
        );
        if (changed != 1) throw new OptimisticConflict("Chiến dịch đã thay đổi. Hãy tải lại.");
        audit(now, actorId, "START_ROUND_ONE", "Campaign", CAMPAIGN_ID,
                "SELF_ASSESSMENT", "ROUND_1", null, expectedCampaignVersion + 1);
    }

    public void publishRoundOne(int expectedCampaignVersion, OffsetDateTime now, String actorId) {
        int changed = jdbc.update(
                "update campaign set phase = 'EXPLANATION', version = version + 1 " +
                        "where id = ? and phase = 'ROUND_1' and version = ?",
                CAMPAIGN_ID, expectedCampaignVersion
        );
        if (changed != 1) throw new OptimisticConflict("Chiến dịch đã thay đổi. Hãy tải lại.");
        jdbc.update(
                "update submission set status = 'LOCKED', version = version + 1, updated_at = ?, updated_by = ? " +
                        "where campaign_id = ? and status in ('SUBMITTED','RESUBMITTED')",
                now, actorId, CAMPAIGN_ID
        );
        audit(now, actorId, "PUBLISH_ROUND_ONE", "Campaign", CAMPAIGN_ID,
                "ROUND_1", "EXPLANATION", null, expectedCampaignVersion + 1);
    }

    public ExplanationCounts explanationCounts() {
        Integer reduced = jdbc.queryForObject(
                "select count(*) from review_case rc join submission s on s.id = rc.submission_id " +
                        "join review_decision rd on rd.review_case_id = rc.id and rd.round_number = 1 " +
                        "and rd.revision = (select max(d.revision) from review_decision d " +
                        "where d.review_case_id = rc.id and d.round_number = 1) " +
                        "where s.campaign_id = ? and rd.awarded_score < s.self_score",
                Integer.class, CAMPAIGN_ID
        );
        Integer explained = jdbc.queryForObject(
                "select count(*) from review_case rc join submission s on s.id = rc.submission_id " +
                        "join review_decision rd on rd.review_case_id = rc.id and rd.round_number = 1 " +
                        "and rd.revision = (select max(d.revision) from review_decision d " +
                        "where d.review_case_id = rc.id and d.round_number = 1) " +
                        "where s.campaign_id = ? and rd.awarded_score < s.self_score " +
                        "and exists (select 1 from explanation_revision ex where ex.review_case_id = rc.id)",
                Integer.class, CAMPAIGN_ID
        );
        return new ExplanationCounts(value(reduced), value(explained));
    }

    public int roundTwoCompletedCount() {
        Integer value = jdbc.queryForObject(
                "select count(*) from review_case rc join submission s on s.id = rc.submission_id " +
                        "where s.campaign_id = ? and rc.round2_status = 'COMPLETED'",
                Integer.class, CAMPAIGN_ID
        );
        return value(value);
    }

    public void startRoundTwo(int expectedCampaignVersion, OffsetDateTime now, String actorId) {
        int campaignChanged = jdbc.update(
                "update campaign set phase = 'ROUND_2', version = version + 1 " +
                        "where id = ? and phase = 'EXPLANATION' and version = ?",
                CAMPAIGN_ID, expectedCampaignVersion
        );
        if (campaignChanged != 1) throw new OptimisticConflict("Chiến dịch đã thay đổi. Hãy tải lại.");
        jdbc.update(
                "update review_case set round2_status = 'QUEUED', version = version + 1 " +
                        "where round1_status = 'COMPLETED' and round2_status = 'NOT_OPEN' " +
                        "and submission_id in (select id from submission where campaign_id = ?)",
                CAMPAIGN_ID
        );
        audit(now, actorId, "START_ROUND_TWO", "Campaign", CAMPAIGN_ID,
                "EXPLANATION", "ROUND_2", null, expectedCampaignVersion + 1);
    }

    public void assignmentAudit(OffsetDateTime now, String actorId, String groupId, int version) {
        audit(now, actorId, "CONFIGURE_SCORECARD_ASSIGNMENT", "ScorecardAssignment", groupId,
                null, "DRAFT", null, version);
    }

    private Map<String, ProgressRow> progressByGroup() {
        Map<String, ProgressRow> values = new LinkedHashMap<>();
        jdbc.query(
                "select g.id group_id, " +
                        "count(distinct o.id || ':' || l.id) expected_tasks, " +
                        "count(distinct case when s.status in ('SUBMITTED','RESUBMITTED','LOCKED') then s.id end) submitted_tasks, " +
                        "count(distinct case when rc.round1_status = 'COMPLETED' then rc.id end) reviewed_tasks, " +
                        "max(case when rc.round1_status = 'COMPLETED' then aa.display_name end) last_reviewed_by, " +
                        "max(rd.decided_at) last_reviewed_at " +
                        "from scorecard_group g " +
                        "left join scorecard_applicability a on a.campaign_id = ? and a.group_id = g.id " +
                        "left join organization o on o.unit_group_code = a.unit_group_code and o.enabled = true " +
                        "left join scorecard_line l on l.group_id = g.id " +
                        "left join submission s on s.campaign_id = a.campaign_id and s.organization_id = o.id and s.line_id = l.id " +
                        "left join review_case rc on rc.submission_id = s.id " +
                        "left join app_account aa on aa.id = rc.reviewer_id " +
                        "left join review_decision rd on rd.review_case_id = rc.id and rd.round_number = 1 " +
                        "where g.scorecard_version_id = ? group by g.id",
                rs -> {
                    values.put(rs.getString("group_id"), new ProgressRow(
                            rs.getInt("expected_tasks"), rs.getInt("submitted_tasks"),
                            rs.getInt("reviewed_tasks"), rs.getString("last_reviewed_by"),
                            rs.getObject("last_reviewed_at", OffsetDateTime.class)
                    ));
                }, CAMPAIGN_ID, SCORECARD_ID
        );
        return values;
    }

    private boolean exists(String sql, Object... args) {
        Integer count = jdbc.queryForObject(sql, Integer.class, args);
        return count != null && count > 0;
    }

    private void audit(OffsetDateTime now, String actorId, String action, String type, String id,
                       String from, String to, String reason, int version) {
        jdbc.update(
                "insert into audit_record " +
                        "(occurred_at, actor_id, action, aggregate_type, aggregate_id, from_state, to_state, reason, correlation_id, aggregate_version) " +
                        "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                now, actorId, action, type, id, from, to, reason, java.util.UUID.randomUUID().toString(), version
        );
    }

    private static int value(Integer number) { return number == null ? 0 : number; }

    public record CampaignRow(String id, String name, String phase, int version, String scorecardStatus) {}
    public record PlanRow(String groupId, String teamId, String reviewerId, int version) {}
    public record Counts(int expected, int submitted, int reviewed) {}
    public record ExplanationCounts(int reduced, int explained) {}
    private record MutablePlan(String groupId, String teamId, String reviewerId, int version,
                               List<String> unitGroupCodes) {}
    private record ProgressRow(int expected, int submitted, int reviewed, String lastReviewedBy,
                               OffsetDateTime lastReviewedAt) {
        private static final ProgressRow EMPTY = new ProgressRow(0, 0, 0, null, null);
    }
}
