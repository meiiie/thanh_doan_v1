package vn.haiphong.campaign.lifecycle.domain;

public record Campaign(
        String id,
        String name,
        CampaignPhase phase,
        String scorecardVersionId,
        int version
) {
    public Campaign releaseScorecard() {
        return move(CampaignPhase.PREPARATION, CampaignPhase.SELF_ASSESSMENT, "CAMPAIGN_NOT_IN_PREPARATION");
    }

    public Campaign startRoundOne() {
        return move(CampaignPhase.SELF_ASSESSMENT, CampaignPhase.ROUND_1, "SELF_ASSESSMENT_NOT_OPEN");
    }

    public Campaign openExplanation() {
        return move(CampaignPhase.ROUND_1, CampaignPhase.EXPLANATION, "ROUND_ONE_NOT_ACTIVE");
    }

    public Campaign startRoundTwo() {
        return move(CampaignPhase.EXPLANATION, CampaignPhase.ROUND_2, "EXPLANATION_NOT_ACTIVE");
    }

    public Campaign startFinalReview() {
        return move(CampaignPhase.ROUND_2, CampaignPhase.FINAL_REVIEW, "ROUND_TWO_NOT_ACTIVE");
    }

    public Campaign publishFinalResult() {
        return move(CampaignPhase.FINAL_REVIEW, CampaignPhase.PUBLISHED, "FINAL_REVIEW_NOT_ACTIVE");
    }

    private Campaign move(CampaignPhase expected, CampaignPhase target, String code) {
        if (phase != expected) {
            throw new DomainRuleViolation(code, "Giai đoạn hiện tại không cho phép thao tác này.");
        }
        return new Campaign(id, name, target, scorecardVersionId, version + 1);
    }
}
