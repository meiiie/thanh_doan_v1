package vn.haiphong.campaign.review.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.haiphong.campaign.review.application.ReviewControlService;
import vn.haiphong.campaign.review.application.ReviewControlView;

@RestController
@RequestMapping("/api/admin/review-control")
public final class ReviewControlController {
    private final ReviewControlService control;

    public ReviewControlController(ReviewControlService control) {
        this.control = control;
    }

    @GetMapping
    ReviewControlView view() {
        return control.view();
    }

    @GetMapping("/criteria/{groupId}/cases")
    ReviewControlView.CriterionCases criterionCases(@PathVariable String groupId) {
        return control.criterionCases(groupId);
    }
}
