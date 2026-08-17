package vn.haiphong.campaign.scorecard.infrastructure;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import vn.haiphong.campaign.scorecard.application.ScorecardCatalogView;

@Repository
public class ScorecardCatalogRepository {
    private static final String VERSION_ID = "scorecard-dhcd-v1";
    private final JdbcTemplate jdbc;

    public ScorecardCatalogRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public ScorecardCatalogView current() {
        Header header = jdbc.queryForObject(
                "select sv.id, sv.campaign_id, c.name campaign_name, sv.title, sv.audience, sv.status, " +
                        "sd.file_name, sd.sha256, sd.received_scope, sd.imported_at, " +
                        "sv.core_maximum, sv.bonus_raw_maximum, sv.bonus_cap " +
                        "from scorecard_version sv " +
                        "join campaign c on c.id = sv.campaign_id " +
                        "join source_document sd on sd.id = sv.source_document_id where sv.id = ?",
                (rs, row) -> new Header(
                        rs.getString("id"), rs.getString("campaign_id"), rs.getString("campaign_name"),
                        rs.getString("title"), rs.getString("audience"), rs.getString("status"),
                        rs.getString("file_name"), rs.getString("sha256"), rs.getString("received_scope"),
                        rs.getObject("imported_at", OffsetDateTime.class), rs.getBigDecimal("core_maximum"),
                        rs.getBigDecimal("bonus_raw_maximum"), rs.getBigDecimal("bonus_cap")
                ),
                VERSION_ID
        );
        if (header == null) throw new IllegalStateException("Scorecard source seed is missing");

        List<ScorecardCatalogView.UnitGroupView> unitGroups = jdbc.query(
                "select code, name, documented_unit_count, source_reference from unit_group order by code",
                (rs, row) -> new ScorecardCatalogView.UnitGroupView(
                        rs.getString("code"), rs.getString("name"), rs.getInt("documented_unit_count"),
                        rs.getString("source_reference")
                )
        );

        Map<String, MutableGroup> groups = new LinkedHashMap<>();
        jdbc.query(
                "select g.id group_id, g.code group_code, g.title group_title, g.section, g.display_order group_order, " +
                        "l.id line_id, l.code line_code, l.title line_title, l.requirement, l.evidence_hint, " +
                        "l.report_template, l.evidence_policy, l.maximum_score, l.source_sheet, l.source_row, l.display_order line_order " +
                        "from scorecard_group g join scorecard_line l on l.group_id = g.id " +
                        "where g.scorecard_version_id = ? order by g.display_order, l.display_order",
                rs -> {
                    String groupId = rs.getString("group_id");
                    MutableGroup group = groups.get(groupId);
                    if (group == null) {
                        group = new MutableGroup(
                                groupId, rs.getString("group_code"), rs.getString("group_title"),
                                rs.getString("section"), rs.getInt("group_order"), new ArrayList<>()
                        );
                        groups.put(groupId, group);
                    }
                    group.lines().add(new ScorecardCatalogView.LineView(
                            rs.getString("line_id"), rs.getString("line_code"), rs.getString("line_title"),
                            rs.getString("requirement"), rs.getString("evidence_hint"),
                            rs.getString("report_template"), rs.getString("evidence_policy"),
                            rs.getBigDecimal("maximum_score"), rs.getString("source_sheet"),
                            rs.getInt("source_row"), rs.getInt("line_order")
                    ));
                },
                VERSION_ID
        );
        List<ScorecardCatalogView.GroupView> groupViews = groups.values().stream().map(MutableGroup::toView).toList();
        int lineCount = groupViews.stream().mapToInt(group -> group.lines().size()).sum();
        return new ScorecardCatalogView(
                header.id(), header.campaignId(), header.campaignName(), header.title(), header.audience(),
                header.status(),
                new ScorecardCatalogView.SourceView(
                        header.fileName(), header.sha256(), header.receivedScope(), header.importedAt()
                ),
                new ScorecardCatalogView.PolicyView(
                        header.coreMaximum(), header.bonusRawMaximum(), header.bonusCap(),
                        header.coreMaximum().add(header.bonusCap()), groupViews.size(), lineCount
                ),
                unitGroups, groupViews
        );
    }

    private record Header(
            String id,
            String campaignId,
            String campaignName,
            String title,
            String audience,
            String status,
            String fileName,
            String sha256,
            String receivedScope,
            OffsetDateTime importedAt,
            BigDecimal coreMaximum,
            BigDecimal bonusRawMaximum,
            BigDecimal bonusCap
    ) {}

    private record MutableGroup(
            String id, String code, String title, String section, int displayOrder,
            List<ScorecardCatalogView.LineView> lines
    ) {
        ScorecardCatalogView.GroupView toView() {
            return new ScorecardCatalogView.GroupView(id, code, title, section, displayOrder, List.copyOf(lines));
        }
    }
}
