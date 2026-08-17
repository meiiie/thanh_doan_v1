package vn.haiphong.campaign.scorecard.application;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.haiphong.campaign.access.Actor;
import vn.haiphong.campaign.access.ActorRole;
import vn.haiphong.campaign.access.CurrentActor;
import vn.haiphong.campaign.scorecard.infrastructure.ScorecardCatalogRepository;

@Service
public class ScorecardCatalogService {
    private final ScorecardCatalogRepository scorecards;
    private final CurrentActor currentActor;

    public ScorecardCatalogService(ScorecardCatalogRepository scorecards, CurrentActor currentActor) {
        this.scorecards = scorecards;
        this.currentActor = currentActor;
    }

    @Transactional(readOnly = true)
    public ScorecardCatalogView current() {
        Actor actor = currentActor.required();
        if (actor.role() != ActorRole.SUPERADMIN && actor.role() != ActorRole.CAMPAIGN_ADMIN) {
            throw new AccessDeniedException("The source scorecard is restricted to administrators");
        }
        return scorecards.current();
    }
}
