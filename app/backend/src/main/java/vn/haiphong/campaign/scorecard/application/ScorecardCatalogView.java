package vn.haiphong.campaign.scorecard.application;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record ScorecardCatalogView(
        String id,
        String campaignId,
        String campaignName,
        String title,
        String audience,
        String status,
        SourceView source,
        PolicyView policy,
        List<UnitGroupView> unitGroups,
        List<GroupView> groups
) {
    public record SourceView(
            String fileName, String sha256, String receivedScope, OffsetDateTime importedAt
    ) {}

    public record PolicyView(
            BigDecimal coreMaximum,
            BigDecimal bonusRawMaximum,
            BigDecimal bonusCap,
            BigDecimal overallMaximum,
            int groupCount,
            int lineCount
    ) {}

    public record UnitGroupView(String code, String name, int documentedUnitCount, String sourceReference) {}

    public record GroupView(
            String id, String code, String title, String section, int displayOrder, List<LineView> lines
    ) {}

    public record LineView(
            String id,
            String code,
            String title,
            String requirement,
            String evidenceHint,
            String reportTemplate,
            String evidencePolicy,
            BigDecimal maximumScore,
            String sourceSheet,
            int sourceRow,
            int displayOrder
    ) {}
}
