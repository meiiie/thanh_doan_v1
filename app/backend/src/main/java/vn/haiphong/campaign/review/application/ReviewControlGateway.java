package vn.haiphong.campaign.review.application;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public interface ReviewControlGateway {
    String CAMPAIGN_ID = "campaign-summer-2026";

    CampaignRow campaign();

    List<CriterionRow> criteria(int roundNumber);

    List<AssessorRow> assessors(int roundNumber);

    IssueCounts issues(int roundNumber);

    List<CaseRow> cases(String groupId, int roundNumber);

    record CampaignRow(String id, String name, String phase, int version) {}

    record CriterionRow(
            String groupId,
            String code,
            String title,
            String assessorId,
            String assessorName,
            String teamName,
            int expectedCases,
            int submittedCases,
            int completedCases
    ) {}

    record AssessorRow(
            String assessorId,
            String assessorName,
            String teamName,
            int assignedCriteria,
            int expectedCases,
            int submittedCases,
            int completedCases
    ) {}

    record IssueCounts(int reductionsWithoutReason, int outOfRangeCases) {}

    record CaseRow(
            String caseId,
            String organizationId,
            String organizationName,
            String unitGroupCode,
            String lineId,
            String lineCode,
            String lineTitle,
            BigDecimal maximumScore,
            String assessorId,
            String assessorName,
            String teamName,
            String submissionStatus,
            int submissionRevision,
            BigDecimal selfScore,
            String evidenceUrl,
            String summary,
            int roundNumber,
            String reviewStatus,
            BigDecimal awardedScore,
            String reason,
            boolean evidenceChecked,
            String decidedByName,
            OffsetDateTime decidedAt,
            BigDecimal roundOneScore,
            String roundOneReason,
            String roundOneDecidedByName,
            OffsetDateTime roundOneDecidedAt,
            String explanationBody,
            String explanationEvidenceUrl,
            int explanationRevision,
            BigDecimal roundTwoScore,
            String roundTwoReason,
            String roundTwoDecidedByName,
            OffsetDateTime roundTwoDecidedAt
    ) {}
}
