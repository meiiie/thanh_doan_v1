package vn.haiphong.campaign.review.application;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import vn.haiphong.campaign.lifecycle.domain.ReviewCase;
import vn.haiphong.campaign.lifecycle.domain.Submission;

public interface ReviewQueueGateway {
    String CAMPAIGN_ID = "campaign-summer-2026";

    CampaignRow campaign();

    Optional<String> teamName(String teamId);

    List<ReviewCaseRow> cases(String reviewerId, String teamId, String phase);

    List<CriterionProgressRow> criteria(String reviewerId, String teamId, String phase);

    List<TeamMemberProgressRow> teamProgress(String teamId, String phase);

    Optional<CaseContext> caseContext(String caseId, String reviewerId, String teamId);

    void completeRoundOne(CaseContext context, ReviewCase completed, BigDecimal score,
                          boolean evidenceChecked, String reason, String actorId, OffsetDateTime now);

    void returnToUnit(CaseContext context, ReviewCase waiting, Submission returned,
                      String reason, String actorId, OffsetDateTime now);

    void completeRoundTwo(CaseContext context, ReviewCase completed, BigDecimal score,
                          boolean evidenceChecked, String reason, String actorId, OffsetDateTime now);

    record CampaignRow(String id, String name, String phase) {}

    record TeamMemberProgressRow(
            String id,
            String displayName,
            boolean teamMonitor,
            int assignedCriteria,
            int expectedCases,
            int pendingCases,
            int completedCases
    ) {}

    record CriterionProgressRow(
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

    record CaseContext(ReviewCase reviewCase, Submission submission, BigDecimal maximumScore) {
        public BigDecimal selfScore() {
            return submission.selfScore();
        }
    }

    record ReviewCaseRow(
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
