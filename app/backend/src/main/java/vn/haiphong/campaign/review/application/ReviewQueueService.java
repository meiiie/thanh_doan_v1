package vn.haiphong.campaign.review.application;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.OffsetDateTime;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.haiphong.campaign.access.Actor;
import vn.haiphong.campaign.access.ActorRole;
import vn.haiphong.campaign.access.CurrentActor;
import vn.haiphong.campaign.lifecycle.application.OptimisticConflict;
import vn.haiphong.campaign.lifecycle.domain.DomainRuleViolation;
import vn.haiphong.campaign.lifecycle.domain.ReviewCase;
import vn.haiphong.campaign.lifecycle.infrastructure.IdempotencyStore;
import vn.haiphong.campaign.review.infrastructure.ReviewQueueRepository;

@Service
public class ReviewQueueService {
    private final ReviewQueueRepository reviews;
    private final CurrentActor currentActor;
    private final Clock clock;
    private final IdempotencyStore idempotency;

    public ReviewQueueService(ReviewQueueRepository reviews, CurrentActor currentActor, Clock clock,
                              IdempotencyStore idempotency) {
        this.reviews = reviews;
        this.currentActor = currentActor;
        this.clock = clock;
        this.idempotency = idempotency;
    }

    @Transactional(readOnly = true)
    public ReviewQueueView view() {
        Actor actor = requireReviewer();
        ReviewQueueRepository.CampaignRow campaign = reviews.campaign();
        String teamName = reviews.teamName(actor.teamId())
                .orElseThrow(() -> new AccessDeniedException("Reviewer team is unavailable"));
        return new ReviewQueueView(
                campaign.id(), campaign.name(), campaign.phase(), actor.teamId(), teamName,
                reviews.cases(actor.id(), actor.teamId(), campaign.phase())
        );
    }

    @Transactional
    public ReviewQueueView completeRoundOne(String caseId, Decision command, String idempotencyKey) {
        Actor actor = requireReviewer();
        String action = "COMPLETE_ROUND_ONE";
        if (idempotency.isReplay(
                actor.id(), action, idempotencyKey, caseId, command.awardedScore(), command.evidenceChecked(),
                command.reason(), command.expectedVersion()
        )) return view();
        if (!"ROUND_1".equals(reviews.campaign().phase())) {
            throw new DomainRuleViolation("ROUND_ONE_NOT_OPEN", "Chiến dịch chưa mở vòng thẩm định thứ nhất.");
        }
        ReviewQueueRepository.CaseContext context = reviews.caseContext(caseId, actor.id(), actor.teamId())
                .orElseThrow(() -> new AccessDeniedException("Review case is outside the reviewer assignment"));
        if (context.reviewCase().version() != command.expectedVersion()) {
            throw new OptimisticConflict("Hồ sơ thẩm định đã thay đổi. Hãy tải lại.");
        }
        ReviewCase completed = context.reviewCase().completeRoundOne(
                command.awardedScore(), context.selfScore(), context.maximumScore(),
                command.evidenceChecked(), command.reason()
        );
        OffsetDateTime now = OffsetDateTime.now(clock);
        reviews.completeRoundOne(
                context, completed, command.awardedScore(), command.evidenceChecked(), command.reason(),
                actor.id(), now
        );
        idempotency.record(
                actor.id(), action, idempotencyKey, now, caseId, command.awardedScore(),
                command.evidenceChecked(), command.reason(), command.expectedVersion()
        );
        return view();
    }

    @Transactional
    public ReviewQueueView returnToUnit(String caseId, ReturnCommand command, String idempotencyKey) {
        Actor actor = requireReviewer();
        String action = "RETURN_SUBMISSION";
        if (idempotency.isReplay(
                actor.id(), action, idempotencyKey, caseId, command.reason(), command.expectedVersion()
        )) return view();
        if (!"ROUND_1".equals(reviews.campaign().phase())) {
            throw new DomainRuleViolation("ROUND_ONE_NOT_OPEN", "Chỉ được trả hồ sơ trong vòng thẩm định thứ nhất.");
        }
        ReviewQueueRepository.CaseContext context = reviews.caseContext(caseId, actor.id(), actor.teamId())
                .orElseThrow(() -> new AccessDeniedException("Review case is outside the reviewer assignment"));
        if (context.reviewCase().version() != command.expectedVersion()) {
            throw new OptimisticConflict("Hồ sơ thẩm định đã thay đổi. Hãy tải lại.");
        }
        ReviewCase waiting = context.reviewCase().waitForResubmission();
        vn.haiphong.campaign.lifecycle.domain.Submission returned =
                context.submission().returnToUnit(command.reason());
        OffsetDateTime now = OffsetDateTime.now(clock);
        reviews.returnToUnit(context, waiting, returned, command.reason(), actor.id(), now);
        idempotency.record(
                actor.id(), action, idempotencyKey, now, caseId, command.reason(), command.expectedVersion()
        );
        return view();
    }

    @Transactional
    public ReviewQueueView completeRoundTwo(String caseId, Decision command, String idempotencyKey) {
        Actor actor = requireReviewer();
        String action = "COMPLETE_ROUND_TWO";
        if (idempotency.isReplay(
                actor.id(), action, idempotencyKey, caseId, command.awardedScore(), command.evidenceChecked(),
                command.reason(), command.expectedVersion()
        )) return view();
        if (!"ROUND_2".equals(reviews.campaign().phase())) {
            throw new DomainRuleViolation("ROUND_TWO_NOT_OPEN", "Chiến dịch chưa mở vòng thẩm định thứ hai.");
        }
        ReviewQueueRepository.CaseContext context = reviews.caseContext(caseId, actor.id(), actor.teamId())
                .orElseThrow(() -> new AccessDeniedException("Review case is outside the reviewer assignment"));
        if (context.reviewCase().version() != command.expectedVersion()) {
            throw new OptimisticConflict("Hồ sơ thẩm định đã thay đổi. Hãy tải lại.");
        }
        ReviewCase completed = context.reviewCase().completeRoundTwo(
                command.awardedScore(), context.selfScore(), context.maximumScore(),
                command.evidenceChecked(), command.reason()
        );
        OffsetDateTime now = OffsetDateTime.now(clock);
        reviews.completeRoundTwo(
                context, completed, command.awardedScore(), command.evidenceChecked(), command.reason(),
                actor.id(), now
        );
        idempotency.record(
                actor.id(), action, idempotencyKey, now, caseId, command.awardedScore(),
                command.evidenceChecked(), command.reason(), command.expectedVersion()
        );
        return view();
    }

    private Actor requireReviewer() {
        Actor actor = currentActor.required();
        if (actor.role() != ActorRole.REVIEWER || actor.teamId() == null ||
                !actor.hasCampaign(ReviewQueueRepository.CAMPAIGN_ID)) {
            throw new AccessDeniedException("Review queue requires a team-scoped reviewer account");
        }
        return actor;
    }

    public record Decision(BigDecimal awardedScore, boolean evidenceChecked, String reason,
                           int expectedVersion) {}
    public record ReturnCommand(String reason, int expectedVersion) {}
}
