package vn.haiphong.campaign.scorecard.application;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.haiphong.campaign.access.Actor;
import vn.haiphong.campaign.access.ActorRole;
import vn.haiphong.campaign.access.CurrentActor;

@Service
public class ScorecardCatalogService {
    private final ScorecardCatalogQuery scorecards;
    private final CurrentActor currentActor;

    public ScorecardCatalogService(ScorecardCatalogQuery scorecards, CurrentActor currentActor) {
        this.scorecards = scorecards;
        this.currentActor = currentActor;
    }

    @Transactional(readOnly = true)
    public ScorecardCatalogView current() {
        Actor actor = currentActor.required();
        if (actor.role() != ActorRole.SUPERADMIN && actor.role() != ActorRole.CAMPAIGN_ADMIN) {
            throw new AccessDeniedException("The source scorecard is restricted to administrators");
        }
        ScorecardCatalogQuery.CatalogData catalog = scorecards.current();
        return new ScorecardCatalogView(
                catalog.id(), catalog.campaignId(), catalog.campaignName(), catalog.title(), catalog.audience(),
                catalog.status(),
                new ScorecardCatalogView.SourceView(
                        catalog.source().fileName(), catalog.source().sha256(),
                        catalog.source().receivedScope(), catalog.source().importedAt()
                ),
                new ScorecardCatalogView.PolicyView(
                        catalog.policy().coreMaximum(), catalog.policy().bonusRawMaximum(),
                        catalog.policy().bonusCap(), catalog.policy().overallMaximum(),
                        catalog.policy().groupCount(), catalog.policy().lineCount()
                ),
                catalog.unitGroups().stream().map(row -> new ScorecardCatalogView.UnitGroupView(
                        row.code(), row.name(), row.documentedUnitCount(), row.sourceReference()
                )).toList(),
                catalog.groups().stream().map(group -> new ScorecardCatalogView.GroupView(
                        group.id(), group.code(), group.title(), group.section(), group.displayOrder(),
                        group.lines().stream().map(line -> new ScorecardCatalogView.LineView(
                                line.id(), line.code(), line.title(), line.requirement(), line.evidenceHint(),
                                line.reportTemplate(), line.evidencePolicy(), line.maximumScore(),
                                line.sourceSheet(), line.sourceRow(), line.displayOrder()
                        )).toList()
                )).toList()
        );
    }
}
