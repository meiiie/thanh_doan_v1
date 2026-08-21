package vn.haiphong.campaign.review.application;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.haiphong.campaign.access.Actor;
import vn.haiphong.campaign.access.ActorRole;
import vn.haiphong.campaign.access.CurrentActor;
import vn.haiphong.campaign.lifecycle.application.IdempotencyPort;
import vn.haiphong.campaign.lifecycle.application.OptimisticConflict;
import vn.haiphong.campaign.lifecycle.domain.DomainRuleViolation;
import vn.haiphong.campaign.lifecycle.domain.ReviewCase;

@Service
public class ReviewQueueService {
    private final ReviewQueueGateway reviews;
    private final CurrentActor currentActor;
    private final Clock clock;
    private final IdempotencyPort idempotency;

    public ReviewQueueService(ReviewQueueGateway reviews, CurrentActor currentActor, Clock clock,
                              IdempotencyPort idempotency) {
        this.reviews = reviews;
        this.currentActor = currentActor;
        this.clock = clock;
        this.idempotency = idempotency;
    }

    @Transactional(readOnly = true)
    public ReviewQueueView view() {
        Actor actor = requireReviewer();
        ReviewQueueGateway.CampaignRow campaign = reviews.campaign();
        String teamName = reviews.teamName(actor.teamId())
                .orElseThrow(() -> new AccessDeniedException("Reviewer team is unavailable"));
        ReviewQueueView.TeamOverview teamOverview = actor.hasCapability("review.team.overview")
                ? teamOverview(reviews.teamProgress(actor.teamId(), campaign.phase())) : null;
        return new ReviewQueueView(
                campaign.id(), campaign.name(), campaign.phase(), actor.teamId(), teamName,
                teamOverview,
                reviews.criteria(actor.id(), actor.teamId(), campaign.phase()).stream()
                        .map(ReviewQueueService::criterionProgress).toList(),
                reviews.cases(actor.id(), actor.teamId(), campaign.phase()).stream()
                        .map(ReviewQueueService::caseView).toList()
        );
    }

    private static ReviewQueueView.CriterionProgress criterionProgress(
            ReviewQueueGateway.CriterionProgressRow row
    ) {
        return new ReviewQueueView.CriterionProgress(
                row.groupId(), row.code(), row.title(), row.lineCount(), row.expectedCases(),
                row.submittedCases(), row.completedCases(), row.adjustedCases(), row.returnedCases()
        );
    }

    private static ReviewQueueView.TeamOverview teamOverview(
            List<ReviewQueueGateway.TeamMemberProgressRow> rows
    ) {
        List<ReviewQueueView.TeamMemberProgress> members = rows.stream().map(row ->
                new ReviewQueueView.TeamMemberProgress(
                        row.id(), row.displayName(), row.teamMonitor(), row.assignedCriteria(),
                        row.expectedCases(), row.pendingCases(), row.completedCases()
                )
        ).toList();
        return new ReviewQueueView.TeamOverview(
                rows.stream().mapToInt(ReviewQueueGateway.TeamMemberProgressRow::assignedCriteria).sum(),
                rows.stream().mapToInt(ReviewQueueGateway.TeamMemberProgressRow::expectedCases).sum(),
                rows.stream().mapToInt(ReviewQueueGateway.TeamMemberProgressRow::pendingCases).sum(),
                rows.stream().mapToInt(ReviewQueueGateway.TeamMemberProgressRow::completedCases).sum(),
                members
        );
    }

    private static ReviewQueueView.CaseView caseView(ReviewQueueGateway.ReviewCaseRow row) {
        return new ReviewQueueView.CaseView(
                row.id(), row.organizationName(), row.groupCode(), row.lineCode(), row.lineTitle(),
                row.maximumScore(), row.selfScore(), row.evidenceUrl(), row.summary(), row.roundNumber(),
                row.status(), row.version(), row.awardedScore(), row.reason(), row.evidenceChecked(),
                row.decidedByName(), row.decidedAt(), row.roundOneScore(), row.roundOneReason(),
                row.explanationBody(), row.explanationEvidenceUrl(), row.explanationRevision()
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
        ReviewQueueGateway.CaseContext context = reviews.caseContext(caseId, actor.id(), actor.teamId())
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
        ReviewQueueGateway.CaseContext context = reviews.caseContext(caseId, actor.id(), actor.teamId())
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
        ReviewQueueGateway.CaseContext context = reviews.caseContext(caseId, actor.id(), actor.teamId())
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
                !actor.hasCampaign(ReviewQueueGateway.CAMPAIGN_ID)) {
            throw new AccessDeniedException("Review queue requires a team-scoped reviewer account");
        }
        return actor;
    }

    public record Decision(BigDecimal awardedScore, boolean evidenceChecked, String reason,
                           int expectedVersion) {}
    public record ReturnCommand(String reason, int expectedVersion) {}
}
