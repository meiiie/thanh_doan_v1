package vn.haiphong.campaign.assignment.application;

import java.time.OffsetDateTime;
import java.util.List;

public interface AssignmentGateway {
    String CAMPAIGN_ID = "campaign-summer-2026";

    CampaignRow campaign();

    List<UnitGroupRow> unitGroups();

    List<TeamRow> teams();

    List<ReviewerRow> reviewers();

    List<AssignmentPlanRow> plans();

    boolean groupExists(String groupId);

    boolean unitGroupsExist(List<String> codes);

    boolean assessorBelongsToTeam(String assessorId, String teamId);

    boolean teamExists(String teamId);

    int savePlan(String groupId, List<String> unitGroupCodes, String teamId, String reviewerId,
                 int expectedVersion, OffsetDateTime now, String actorId);

    int totalGroupCount();

    int readyGroupCount();

    Counts counts();

    void release(int expectedCampaignVersion, OffsetDateTime now, String actorId);

    void startReview(int expectedCampaignVersion, OffsetDateTime now, String actorId);

    void openExplanation(int expectedCampaignVersion, OffsetDateTime now, String actorId);

    ExplanationCounts explanationCounts();

    int roundTwoCompletedCount();

    void startRoundTwo(int expectedCampaignVersion, OffsetDateTime now, String actorId);

    void assignmentAudit(OffsetDateTime now, String actorId, String groupId, int version);

    record CampaignRow(String id, String name, String phase, int version, String scorecardStatus) {}

    record Counts(int expected, int submitted, int reviewed) {}

    record ExplanationCounts(int reduced, int explained) {}

    record UnitGroupRow(String code, String name, int documentedUnitCount) {}

    record TeamRow(String id, String name) {}

    record ReviewerRow(String id, String displayName, String teamId, boolean enabled, boolean teamMonitor) {}

    record AssignmentPlanRow(
            String groupId,
            List<String> unitGroupCodes,
            String teamId,
            String reviewerId,
            int version,
            int expectedTasks,
            int submittedTasks,
            int reviewedTasks,
            String lastReviewedBy,
            OffsetDateTime lastReviewedAt
    ) {}
}
