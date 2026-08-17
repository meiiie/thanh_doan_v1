package vn.haiphong.campaign.scorecard.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.haiphong.campaign.scorecard.application.ScorecardCatalogService;
import vn.haiphong.campaign.scorecard.application.ScorecardCatalogView;

@RestController
@RequestMapping("/api/scorecards")
public final class ScorecardCatalogController {
    private final ScorecardCatalogService scorecards;

    public ScorecardCatalogController(ScorecardCatalogService scorecards) {
        this.scorecards = scorecards;
    }

    @GetMapping("/current")
    ScorecardCatalogView current() {
        return scorecards.current();
    }
}
