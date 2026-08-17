package vn.haiphong.campaign.access;

import java.util.Set;

public record Actor(
        String id,
        String displayName,
        ActorRole role,
        Set<String> campaignIds,
        Set<String> capabilities,
        String organizationId,
        String teamId
) {
    public boolean hasCampaign(String campaignId) {
        return role == ActorRole.SUPERADMIN || campaignIds.contains(campaignId);
    }

    public boolean hasCapability(String capability) {
        return role == ActorRole.SUPERADMIN || capabilities.contains(capability);
    }
}
