package vn.haiphong.campaign.scorecard.application;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public interface ScorecardCatalogQuery {
    CatalogData current();

    record CatalogData(
            String id,
            String campaignId,
            String campaignName,
            String title,
            String audience,
            String status,
            SourceRow source,
            PolicyRow policy,
            List<UnitGroupRow> unitGroups,
            List<GroupRow> groups
    ) {}

    record SourceRow(String fileName, String sha256, String receivedScope, OffsetDateTime importedAt) {}

    record PolicyRow(
            BigDecimal coreMaximum,
            BigDecimal bonusRawMaximum,
            BigDecimal bonusCap,
            BigDecimal overallMaximum,
            int groupCount,
            int lineCount
    ) {}

    record UnitGroupRow(String code, String name, int documentedUnitCount, String sourceReference) {}

    record GroupRow(
            String id, String code, String title, String section, int displayOrder, List<LineRow> lines
    ) {}

    record LineRow(
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
