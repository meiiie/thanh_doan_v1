package vn.haiphong.campaign.review.application;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record ReviewQueueView(
        String campaignId,
        String campaignName,
        String phase,
        String teamId,
        String teamName,
        TeamOverview teamOverview,
        List<CriterionProgress> criteria,
        List<CaseView> cases
) {
    public record TeamOverview(
            int assignedCriteria,
            int expectedCases,
            int pendingCases,
            int completedCases,
            List<TeamMemberProgress> members
    ) {}

    public record TeamMemberProgress(
            String id,
            String displayName,
            boolean teamMonitor,
            int assignedCriteria,
            int expectedCases,
            int pendingCases,
            int completedCases
    ) {}

    public record CriterionProgress(
            String groupId,
            String code,
            String title,
            int lineCount,
            int expectedCases,
            int submittedCases,
            int completedCases,
            int adjustedCases,
            int returnedCases
    ) {}

    public record CaseView(
            String id,
            String organizationName,
            String groupCode,
            String lineCode,
            String lineTitle,
            BigDecimal maximumScore,
            BigDecimal selfScore,
            String evidenceUrl,
            String summary,
            int roundNumber,
            String status,
            int version,
            BigDecimal awardedScore,
            String reason,
            boolean evidenceChecked,
            String decidedByName,
            OffsetDateTime decidedAt,
            BigDecimal roundOneScore,
            String roundOneReason,
            String explanationBody,
            String explanationEvidenceUrl,
            int explanationRevision
    ) {}
}
