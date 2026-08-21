package vn.haiphong.campaign.submission.application;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import vn.haiphong.campaign.lifecycle.domain.Submission;

public interface UnitTaskGateway {
    String CAMPAIGN_ID = "campaign-summer-2026";

    CampaignRow campaign();

    Optional<OrganizationRow> organization(String organizationId);

    List<TaskRow> tasks(String organizationId);

    Optional<ExplanationContext> explanationContext(String organizationId, String lineId);

    int addExplanation(ExplanationContext context, String body, String evidenceUrl,
                       int expectedRevision, String actorId, OffsetDateTime now);

    Optional<TaskContext> taskContext(String organizationId, String lineId);

    Optional<Submission> submission(String organizationId, String lineId);

    Submission draft(String organizationId, String lineId, BigDecimal selfScore, String evidenceUrl,
                     String summary, int expectedVersion, String actorId, OffsetDateTime now);

    void submit(Submission previous, Submission submitted, String actorId, OffsetDateTime now,
                String teamId, String reviewerId);

    void draftAudit(OffsetDateTime now, String actorId, Submission submission);

    record CampaignRow(String id, String name, String phase) {}

    record OrganizationRow(String id, String name, String unitGroupCode, String unitGroupName) {}

    record TaskContext(String lineId, BigDecimal maximumScore, String evidencePolicy,
                       boolean summaryRequired, String teamId, String reviewerId) {}

    record ExplanationContext(String reviewCaseId, int reviewVersion, BigDecimal selfScore,
                              BigDecimal roundOneScore, int explanationRevision) {}

    record TaskRow(
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
