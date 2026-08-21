package vn.haiphong.campaign.review.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import vn.haiphong.campaign.lifecycle.domain.DomainRuleViolation;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.haiphong.campaign.access.Actor;
import vn.haiphong.campaign.access.ActorRole;
import vn.haiphong.campaign.access.CurrentActor;

@Service
public class ReviewControlService {
    private final ReviewControlGateway control;
    private final CurrentActor currentActor;

    public ReviewControlService(ReviewControlGateway control, CurrentActor currentActor) {
        this.control = control;
        this.currentActor = currentActor;
    }

    @Transactional(readOnly = true)
    public ReviewControlView view() {
        requireAdministrator();
        ReviewControlGateway.CampaignRow campaign = control.campaign();
        int roundNumber = currentRound(campaign.phase());
        List<ReviewControlView.CriterionProgress> criteria = control.criteria(roundNumber).stream()
                .map(ReviewControlService::criterionView).toList();
        List<ReviewControlView.AssessorProgress> assessors = control.assessors(roundNumber).stream()
                .map(ReviewControlService::assessorView).toList();
        int expected = criteria.stream().mapToInt(ReviewControlView.CriterionProgress::expectedCases).sum();
        int submitted = criteria.stream().mapToInt(ReviewControlView.CriterionProgress::submittedCases).sum();
        int completed = criteria.stream().mapToInt(ReviewControlView.CriterionProgress::completedCases).sum();
        int pending = Math.max(0, submitted - completed);
        int missing = Math.max(0, expected - submitted);
        int assessorsWithPending = (int) assessors.stream().filter(row -> row.remainingCases() > 0).count();
        ReviewControlGateway.IssueCounts issues = control.issues(roundNumber);
        boolean canPublish = "ROUND_1".equals(campaign.phase()) && expected > 0 && expected == completed
                && issues.reductionsWithoutReason() == 0 && issues.outOfRangeCases() == 0;
        return new ReviewControlView(
                campaign.id(), campaign.name(), campaign.phase(), campaign.version(), roundNumber,
                expected, submitted, completed, pending, missing, issues.reductionsWithoutReason(),
                assessorsWithPending, issues.outOfRangeCases(), canPublish, criteria, assessors
        );
    }

    @Transactional(readOnly = true)
    public ReviewControlView.CriterionCases criterionCases(String groupId) {
        requireAdministrator();
        ReviewControlGateway.CampaignRow campaign = control.campaign();
        int roundNumber = currentRound(campaign.phase());
        ReviewControlGateway.CriterionRow criterion = control.criteria(roundNumber).stream()
                .filter(row -> row.groupId().equals(groupId))
                .findFirst()
                .orElseThrow(() -> new DomainRuleViolation(
                        "REVIEW_CRITERION_NOT_FOUND",
                        "Tiêu chí không thuộc phạm vi chiến dịch hiện hành."
                ));
        List<ReviewControlView.CaseDetail> cases = control.cases(groupId, roundNumber).stream()
                .map(ReviewControlService::caseView)
                .toList();
        return new ReviewControlView.CriterionCases(
                criterion.groupId(), criterion.code(), criterion.title(), criterion.assessorId(),
                criterion.assessorName(), criterion.teamName(), roundNumber, criterion.expectedCases(),
                criterion.submittedCases(), criterion.completedCases(), cases
        );
    }

    private static ReviewControlView.CriterionProgress criterionView(
            ReviewControlGateway.CriterionRow row
    ) {
        return new ReviewControlView.CriterionProgress(
                row.groupId(), row.code(), row.title(), row.assessorId(), row.assessorName(), row.teamName(),
                row.expectedCases(), row.submittedCases(), row.completedCases(),
                Math.max(0, row.expectedCases() - row.completedCases()),
                rate(row.completedCases(), row.expectedCases())
        );
    }

    private static ReviewControlView.AssessorProgress assessorView(
            ReviewControlGateway.AssessorRow row
    ) {
        return new ReviewControlView.AssessorProgress(
                row.assessorId(), row.assessorName(), row.teamName(), row.assignedCriteria(),
                row.expectedCases(), row.submittedCases(), row.completedCases(),
                Math.max(0, row.expectedCases() - row.completedCases()),
                rate(row.completedCases(), row.expectedCases())
        );
    }

    private static ReviewControlView.CaseDetail caseView(ReviewControlGateway.CaseRow row) {
        return new ReviewControlView.CaseDetail(
                row.caseId(), row.organizationId(), row.organizationName(), row.unitGroupCode(),
                row.lineId(), row.lineCode(), row.lineTitle(), row.maximumScore(), row.assessorId(),
                row.assessorName(), row.teamName(), row.submissionStatus(), row.submissionRevision(),
                row.selfScore(), row.evidenceUrl(), row.summary(), row.roundNumber(), row.reviewStatus(),
                row.awardedScore(), row.reason(), row.evidenceChecked(), row.decidedByName(), row.decidedAt(),
                row.roundOneScore(), row.roundOneReason(), row.roundOneDecidedByName(),
                row.roundOneDecidedAt(), row.explanationBody(), row.explanationEvidenceUrl(),
                row.explanationRevision(), row.roundTwoScore(), row.roundTwoReason(),
                row.roundTwoDecidedByName(), row.roundTwoDecidedAt()
        );
    }

    private static BigDecimal rate(int completed, int expected) {
        if (expected == 0) return BigDecimal.ZERO;
        return BigDecimal.valueOf(completed).divide(BigDecimal.valueOf(expected), 4, RoundingMode.HALF_UP);
    }

    private static int currentRound(String phase) {
        return "ROUND_2".equals(phase) || "FINAL_REVIEW".equals(phase) || "PUBLISHED".equals(phase)
                ? 2 : 1;
    }

    private Actor requireAdministrator() {
        Actor actor = currentActor.required();
        if (actor.role() != ActorRole.SUPERADMIN && actor.role() != ActorRole.CAMPAIGN_ADMIN) {
            throw new AccessDeniedException("Review control requires campaign administration");
        }
        if (!actor.hasCampaign(ReviewControlGateway.CAMPAIGN_ID)) {
            throw new AccessDeniedException("Campaign is outside the account scope");
        }
        return actor;
    }
}
