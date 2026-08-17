package vn.haiphong.campaign.lifecycle.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class LifecycleDomainTest {
    @Test
    void campaign_rejects_transition_out_of_order() {
        Campaign campaign = new Campaign("c1", "Campaign", CampaignPhase.PREPARATION, "s1", 0);

        DomainRuleViolation error = assertThrows(DomainRuleViolation.class, campaign::startRoundOne);

        assertEquals("SELF_ASSESSMENT_NOT_OPEN", error.code());
    }

    @Test
    void submitted_revision_requires_valid_score_evidence_and_summary() {
        Submission invalid = new Submission(
                "sub1", "c1", "org1", "line1", SubmissionStatus.DRAFT,
                new BigDecimal("11"), "not-a-link", "", 0, 0
        );

        DomainRuleViolation scoreError = assertThrows(
                DomainRuleViolation.class,
                () -> invalid.submit(BigDecimal.TEN)
        );

        assertEquals("SELF_SCORE_OUT_OF_RANGE", scoreError.code());
    }

    @Test
    void returned_submission_requires_a_reason_and_resubmits_as_a_new_revision() {
        Submission submitted = new Submission(
                "sub1", "c1", "org1", "line1", SubmissionStatus.SUBMITTED,
                new BigDecimal("8"), "https://example.org/evidence-1", "Bản đầu", 1, 1
        );

        DomainRuleViolation missingReason = assertThrows(
                DomainRuleViolation.class, () -> submitted.returnToUnit(" ")
        );
        Submission returned = submitted.returnToUnit("Cần bổ sung biên bản");
        Submission resubmitted = returned.submit(
                BigDecimal.TEN, new BigDecimal("8"), "https://example.org/evidence-2", "Đã bổ sung"
        );

        assertEquals("RETURN_REASON_REQUIRED", missingReason.code());
        assertEquals(SubmissionStatus.RETURNED, returned.status());
        assertEquals(1, returned.revision());
        assertEquals(SubmissionStatus.RESUBMITTED, resubmitted.status());
        assertEquals(2, resubmitted.revision());
    }

    @Test
    void returned_case_waits_for_the_new_submission_revision() {
        ReviewCase queued = queuedReview();

        ReviewCase waiting = queued.waitForResubmission();
        ReviewCase requeued = waiting.queueRoundOne();

        assertEquals(ReviewStatus.WAITING_FOR_SUBMISSION, waiting.roundOneStatus());
        assertEquals(ReviewStatus.QUEUED, requeued.roundOneStatus());
    }

    @Test
    void review_requires_evidence_confirmation_and_reason_when_score_is_reduced() {
        ReviewCase review = queuedReview();

        DomainRuleViolation evidenceError = assertThrows(
                DomainRuleViolation.class,
                () -> review.completeRoundOne(new BigDecimal("8"), new BigDecimal("8"), BigDecimal.TEN, false, null)
        );
        assertEquals("EVIDENCE_NOT_CHECKED", evidenceError.code());

        DomainRuleViolation reasonError = assertThrows(
                DomainRuleViolation.class,
                () -> review.completeRoundOne(new BigDecimal("7"), new BigDecimal("8"), BigDecimal.TEN, true, "")
        );
        assertEquals("REDUCTION_REASON_REQUIRED", reasonError.code());
    }

    @Test
    void result_preparer_cannot_approve_own_snapshot() {
        FinalResult result = new FinalResult(
                "r1", "c1", 1, FinalResultStatus.PENDING_APPROVAL,
                new BigDecimal("8"), "checksum", "admin-a", null, null, 0
        );

        DomainRuleViolation error = assertThrows(DomainRuleViolation.class, () -> result.approve("admin-a"));

        assertEquals("FOUR_EYES_REQUIRED", error.code());
    }

    @Test
    void round_two_creates_a_new_effective_state_without_changing_round_one() {
        ReviewCase roundOneComplete = queuedReview().completeRoundOne(
                new BigDecimal("7"), new BigDecimal("8"), BigDecimal.TEN, true, "Thiếu một biên bản"
        );
        ReviewCase roundTwoOpen = roundOneComplete.openRoundTwo();
        ReviewCase completed = roundTwoOpen.completeRoundTwo(
                new BigDecimal("8"), new BigDecimal("8"), BigDecimal.TEN, true, "Đã bổ sung biên bản"
        );

        assertEquals(ReviewStatus.COMPLETED, completed.roundOneStatus());
        assertEquals(ReviewStatus.COMPLETED, completed.roundTwoStatus());
    }

    private static ReviewCase queuedReview() {
        return new ReviewCase(
                "review1", "sub1", "line1", "team1", "reviewer1",
                ReviewStatus.QUEUED, ReviewStatus.NOT_OPEN, 0
        );
    }
}
