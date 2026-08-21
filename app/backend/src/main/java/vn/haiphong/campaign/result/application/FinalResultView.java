package vn.haiphong.campaign.result.application;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record FinalResultView(
        String campaignId,
        String campaignName,
        String phase,
        int campaignVersion,
        int expectedTasks,
        int resolvedTasks,
        String resultId,
        Integer resultVersion,
        String status,
        BigDecimal aggregateTotal,
        String checksum,
        String preparedBy,
        OffsetDateTime preparedAt,
        String approvedBy,
        OffsetDateTime approvedAt,
        String publishedBy,
        OffsetDateTime publishedAt,
        int version,
        List<UnitResultView> units
) {
    public record UnitResultView(
            String organizationId,
            String organizationCode,
            String organizationName,
            String unitGroupCode,
            BigDecimal applicableCoreMaximum,
            BigDecimal coreScore,
            BigDecimal bonusRawScore,
            BigDecimal bonusCappedScore,
            BigDecimal totalScore,
            BigDecimal completionRate
    ) {}
}
