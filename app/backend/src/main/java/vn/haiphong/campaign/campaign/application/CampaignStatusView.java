package vn.haiphong.campaign.campaign.application;

import java.util.List;

public record CampaignStatusView(
        String id,
        String name,
        String phase,
        int version,
        String scorecardStatus,
        int scorecardGroups,
        int scorecardLines,
        int documentedUnitGroups,
        int documentedUnits,
        int activeAccounts,
        int submissions,
        int reviewCases,
        int finalResults,
        List<ReadinessItem> readiness
) {
    public record ReadinessItem(String code, String label, boolean ready, String detail) {}
}
