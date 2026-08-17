package vn.haiphong.campaign.review.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import vn.haiphong.campaign.review.application.ReviewQueueService;
import vn.haiphong.campaign.review.application.ReviewQueueView;

@RestController
@RequestMapping("/api/reviewer/queue")
public final class ReviewQueueController {
    private final ReviewQueueService reviews;

    public ReviewQueueController(ReviewQueueService reviews) {
        this.reviews = reviews;
    }

    @GetMapping
    ReviewQueueView view() {
        return reviews.view();
    }

    @PostMapping("/{caseId}/round-one")
    ReviewQueueView completeRoundOne(
            @PathVariable String caseId,
            @RequestBody ReviewQueueService.Decision command,
            @RequestHeader("Idempotency-Key") String idempotencyKey
    ) {
        return reviews.completeRoundOne(caseId, command, idempotencyKey);
    }

    @PostMapping("/{caseId}/return")
    ReviewQueueView returnToUnit(
            @PathVariable String caseId,
            @RequestBody ReviewQueueService.ReturnCommand command,
            @RequestHeader("Idempotency-Key") String idempotencyKey
    ) {
        return reviews.returnToUnit(caseId, command, idempotencyKey);
    }

    @PostMapping("/{caseId}/round-two")
    ReviewQueueView completeRoundTwo(
            @PathVariable String caseId,
            @RequestBody ReviewQueueService.Decision command,
            @RequestHeader("Idempotency-Key") String idempotencyKey
    ) {
        return reviews.completeRoundTwo(caseId, command, idempotencyKey);
    }
}
