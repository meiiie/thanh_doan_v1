package vn.haiphong.campaign.assignment.application;

import java.time.OffsetDateTime;
import java.util.List;

public record AssignmentWorkbenchView(
        String campaignId,
        String campaignName,
        String phase,
        int campaignVersion,
        String scorecardStatus,
        List<UnitGroupView> unitGroups,
        List<TeamView> teams,
        List<ReviewerView> reviewers,
        List<PlanView> plans,
        ProgressView progress
) {
    public record UnitGroupView(String code, String name, int documentedUnitCount) {}
    public record TeamView(
            String id,
            String name,
            String monitorId,
            String monitorName,
            int availableAssessorCount,
            int lockedAssessorCount
    ) {}
    public record ReviewerView(
            String id, String displayName, String teamId, boolean enabled, boolean teamMonitor
    ) {}
    public record PlanView(
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
    public record ProgressView(
            int totalGroups,
            int readyGroups,
            int expectedTasks,
            int submittedTasks,
            int reviewedTasks
    ) {}
}
