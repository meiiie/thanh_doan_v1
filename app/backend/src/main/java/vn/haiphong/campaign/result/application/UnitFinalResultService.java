package vn.haiphong.campaign.result.application;

import java.util.List;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.haiphong.campaign.access.Actor;
import vn.haiphong.campaign.access.ActorRole;
import vn.haiphong.campaign.access.CurrentActor;
import vn.haiphong.campaign.lifecycle.domain.FinalResultStatus;

@Service
public class UnitFinalResultService {
    private final FinalResultGateway results;
    private final CurrentActor currentActor;

    public UnitFinalResultService(FinalResultGateway results, CurrentActor currentActor) {
        this.results = results;
        this.currentActor = currentActor;
    }

    @Transactional(readOnly = true)
    public UnitFinalResultView view() {
        Actor actor = requireUnit();
        FinalResultGateway.CampaignRow campaign = results.campaign();
        var header = results.current()
                .filter(value -> value.result().status() == FinalResultStatus.PUBLISHED)
                .orElse(null);
        if (header == null) {
            return unpublished(campaign, actor.organizationId());
        }

        var unit = results.units(header.result().id()).stream()
                .filter(value -> value.organizationId().equals(actor.organizationId()))
                .findFirst()
                .orElseThrow(() -> new AccessDeniedException("Published result is outside the organization scope"));
        List<UnitFinalResultView.LineResult> lines = results.snapshotLines(header.result().id()).stream()
                .filter(value -> value.organizationId().equals(actor.organizationId()))
                .map(value -> new UnitFinalResultView.LineResult(
                        value.lineId(), value.groupCode(), value.lineCode(), value.lineTitle(), value.section(),
                        value.maximumScore(), value.selfScore(), value.roundOneScore(), value.roundTwoScore(),
                        value.effectiveScore()
                ))
                .toList();
        return new UnitFinalResultView(
                campaign.id(), campaign.name(), campaign.phase(), true, header.result().resultVersion(),
                header.publishedAt(), unit.organizationId(), unit.organizationName(), unit.unitGroupCode(),
                unit.applicableCoreMaximum(), unit.coreScore(), unit.bonusCappedScore(), unit.totalScore(),
                unit.completionRate(), lines
        );
    }

    private Actor requireUnit() {
        Actor actor = currentActor.required();
        if (actor.role() != ActorRole.UNIT_MEMBER || actor.organizationId() == null ||
                !actor.hasCampaign(FinalResultGateway.CAMPAIGN_ID)) {
            throw new AccessDeniedException("Unit result requires an organization-scoped account");
        }
        return actor;
    }

    private static UnitFinalResultView unpublished(FinalResultGateway.CampaignRow campaign,
                                                    String organizationId) {
        return new UnitFinalResultView(
                campaign.id(), campaign.name(), campaign.phase(), false, null, null, organizationId, null, null,
                null, null, null, null, null, List.of()
        );
    }
}
