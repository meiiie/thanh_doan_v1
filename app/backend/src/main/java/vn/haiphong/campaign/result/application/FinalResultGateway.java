package vn.haiphong.campaign.result.application;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import vn.haiphong.campaign.lifecycle.domain.FinalResult;

public interface FinalResultGateway {
    String CAMPAIGN_ID = "campaign-summer-2026";

    CampaignRow campaign();

    int expectedTasks();

    int resolvedTasks();

    BigDecimal bonusCap();

    List<SnapshotLine> sourceLines();

    int nextResultVersion();

    void insertSnapshot(String resultId, int resultVersion, BigDecimal aggregateTotal, String checksum,
                        String actorId, OffsetDateTime now, int expectedCampaignVersion,
                        List<UnitSnapshot> units, List<SnapshotLine> lines);

    Optional<ResultHeader> current();

    int snapshotTaskCount(String resultId);

    List<UnitSnapshot> units(String resultId);

    List<SnapshotLine> snapshotLines(String resultId);

    void approve(ResultHeader current, FinalResult approved, String actorId, OffsetDateTime now);

    void publish(ResultHeader current, FinalResult published, int expectedCampaignVersion,
                 String actorId, OffsetDateTime now);

    record CampaignRow(String id, String name, String phase, int version) {}

    record ResultHeader(FinalResult result, String preparedByName, OffsetDateTime preparedAt,
                        String approvedByName, OffsetDateTime approvedAt,
                        String publishedByName, OffsetDateTime publishedAt) {}

    record UnitSnapshot(String organizationId, String organizationCode, String organizationName,
                        String unitGroupCode, BigDecimal applicableCoreMaximum, BigDecimal coreScore,
                        BigDecimal bonusRawScore, BigDecimal bonusCappedScore, BigDecimal totalScore,
                        BigDecimal completionRate) {}

    record SnapshotLine(
            String organizationId, String organizationCode, String organizationName, String unitGroupCode,
            String lineId, String groupCode, String lineCode, String lineTitle, String section,
            BigDecimal maximumScore, BigDecimal selfScore, BigDecimal roundOneScore, String roundOneReason,
            String explanationBody, String explanationEvidenceUrl, BigDecimal roundTwoScore,
            String roundTwoReason, BigDecimal effectiveScore, String submissionEvidenceUrl,
            String submissionSummary, int submissionRevision, String roundOneDecidedBy,
            String roundOneDecidedByName, OffsetDateTime roundOneDecidedAt, String roundTwoDecidedBy,
            String roundTwoDecidedByName, OffsetDateTime roundTwoDecidedAt
    ) {}
}
