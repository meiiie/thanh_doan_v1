package vn.haiphong.campaign.submission.application;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record UnitTaskView(
        String campaignId,
        String campaignName,
        String phase,
        String organizationId,
        String organizationName,
        String unitGroupName,
        List<TaskView> tasks
) {
    public record TaskView(
            String lineId,
            String groupCode,
            String lineCode,
            String title,
            String requirement,
            String evidenceHint,
            String evidencePolicy,
            boolean evidenceRequired,
            boolean summaryRequired,
            BigDecimal maximumScore,
            String reviewTeamName,
            String status,
            BigDecimal selfScore,
            String evidenceUrl,
            String summary,
            int revision,
            int version,
            String returnReason,
            OffsetDateTime returnedAt,
            BigDecimal roundOneScore,
            String roundOneReason,
            String roundOneDecidedBy,
            OffsetDateTime roundOneDecidedAt,
            String explanationBody,
            String explanationEvidenceUrl,
            int explanationRevision,
            OffsetDateTime explanationSubmittedAt,
            BigDecimal roundTwoScore,
            String roundTwoReason,
            String roundTwoDecidedBy,
            OffsetDateTime roundTwoDecidedAt
    ) {}
}
