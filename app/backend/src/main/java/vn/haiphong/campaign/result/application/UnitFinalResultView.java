package vn.haiphong.campaign.result.application;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record UnitFinalResultView(
        String campaignId,
        String campaignName,
        String phase,
        boolean published,
        Integer resultVersion,
        OffsetDateTime publishedAt,
        String organizationId,
        String organizationName,
        String unitGroupCode,
        BigDecimal applicableCoreMaximum,
        BigDecimal coreScore,
        BigDecimal bonusScore,
        BigDecimal totalScore,
        BigDecimal completionRate,
        List<LineResult> lines
) {
    public record LineResult(
            String lineId,
            String groupCode,
            String lineCode,
            String title,
            String section,
            BigDecimal maximumScore,
            BigDecimal selfScore,
            BigDecimal roundOneScore,
            BigDecimal roundTwoScore,
            BigDecimal finalScore
    ) {}
}
