package vn.haiphong.campaign.campaign.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.haiphong.campaign.campaign.application.CampaignStatusService;
import vn.haiphong.campaign.campaign.application.CampaignStatusView;

@RestController
@RequestMapping("/api/campaigns")
public final class CampaignStatusController {
    private final CampaignStatusService campaigns;

    public CampaignStatusController(CampaignStatusService campaigns) {
        this.campaigns = campaigns;
    }

    @GetMapping("/current/status")
    CampaignStatusView current() {
        return campaigns.current();
    }
}
