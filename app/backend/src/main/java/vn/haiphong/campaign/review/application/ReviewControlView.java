package vn.haiphong.campaign.review.application;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record ReviewControlView(
        String campaignId,
        String campaignName,
        String phase,
        int campaignVersion,
        int roundNumber,
        int expectedCases,
        int submittedCases,
        int completedCases,
        int pendingCases,
        int missingSubmissions,
        int reductionsWithoutReason,
        int assessorsWithPending,
        int outOfRangeCases,
        boolean canOpenExplanation,
        List<CriterionProgress> criteria,
        List<AssessorProgress> assessors
) {
    public record CriterionProgress(
            String groupId,
            String code,
            String title,
            String assessorId,
            String assessorName,
            String teamName,
            int expectedCases,
            int submittedCases,
            int completedCases,
            int remainingCases,
            BigDecimal completionRate
    ) {}

    public record AssessorProgress(
            String assessorId,
            String assessorName,
            String teamName,
            int assignedCriteria,
            int expectedCases,
            int submittedCases,
            int completedCases,
            int remainingCases,
            BigDecimal completionRate
    ) {}

    public record CriterionCases(
            String groupId,
            String code,
            String title,
            String assessorId,
            String assessorName,
            String teamName,
            int roundNumber,
            int expectedCases,
            int submittedCases,
            int completedCases,
            List<CaseDetail> cases
    ) {}

    public record CaseDetail(
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
