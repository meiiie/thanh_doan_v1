package vn.haiphong.campaign.lifecycle.domain;

import java.math.BigDecimal;

public record ReviewCase(
        String id,
        String submissionId,
        String lineId,
        String teamId,
        String reviewerId,
        ReviewStatus roundOneStatus,
        ReviewStatus roundTwoStatus,
        int version
) {
    public ReviewCase queueRoundOne() {
        if (roundOneStatus != ReviewStatus.WAITING_FOR_SUBMISSION) {
            throw new DomainRuleViolation("ROUND_ONE_ALREADY_QUEUED", "Hồ sơ đã vào hàng chờ vòng 1.");
        }
        return new ReviewCase(
                id, submissionId, lineId, teamId, reviewerId,
                ReviewStatus.QUEUED, roundTwoStatus, version + 1
        );
    }

    public ReviewCase waitForResubmission() {
        if (roundOneStatus != ReviewStatus.QUEUED || roundTwoStatus != ReviewStatus.NOT_OPEN) {
            throw new DomainRuleViolation(
                    "REVIEW_NOT_RETURNABLE", "Chỉ case đang chờ vòng 1 mới có thể trả về đơn vị."
            );
        }
        return new ReviewCase(
                id, submissionId, lineId, teamId, reviewerId,
                ReviewStatus.WAITING_FOR_SUBMISSION, roundTwoStatus, version + 1
        );
    }

    public ReviewCase completeRoundOne(BigDecimal score, BigDecimal selfScore, BigDecimal maximum,
                                       boolean evidenceChecked, String reason) {
        validateDecision(roundOneStatus, score, selfScore, maximum, evidenceChecked, reason, "ROUND_ONE_NOT_QUEUED");
        return new ReviewCase(
                id, submissionId, lineId, teamId, reviewerId,
                ReviewStatus.COMPLETED, roundTwoStatus, version + 1
        );
    }

    public ReviewCase openRoundTwo() {
        if (roundOneStatus != ReviewStatus.COMPLETED || roundTwoStatus != ReviewStatus.NOT_OPEN) {
            throw new DomainRuleViolation("ROUND_TWO_CANNOT_OPEN", "Vòng 2 chỉ mở sau khi vòng 1 hoàn tất.");
        }
        return new ReviewCase(
                id, submissionId, lineId, teamId, reviewerId,
                roundOneStatus, ReviewStatus.QUEUED, version + 1
        );
    }

    public ReviewCase completeRoundTwo(BigDecimal score, BigDecimal selfScore, BigDecimal maximum,
                                       boolean evidenceChecked, String reason) {
        validateDecision(roundTwoStatus, score, selfScore, maximum, evidenceChecked, reason, "ROUND_TWO_NOT_QUEUED");
        return new ReviewCase(
                id, submissionId, lineId, teamId, reviewerId,
                roundOneStatus, ReviewStatus.COMPLETED, version + 1
        );
    }

    private static void validateDecision(ReviewStatus status, BigDecimal score, BigDecimal selfScore,
                                         BigDecimal maximum, boolean evidenceChecked, String reason,
                                         String stateCode) {
        if (status != ReviewStatus.QUEUED && status != ReviewStatus.IN_PROGRESS) {
            throw new DomainRuleViolation(stateCode, "Hồ sơ chưa ở hàng chờ của vòng chấm này.");
        }
        if (score == null || score.signum() < 0 || score.compareTo(maximum) > 0) {
            throw new DomainRuleViolation("REVIEW_SCORE_OUT_OF_RANGE", "Điểm thẩm định phải nằm trong khung điểm.");
        }
        if (!evidenceChecked) {
            throw new DomainRuleViolation("EVIDENCE_NOT_CHECKED", "Cần xác nhận đã kiểm tra minh chứng.");
        }
        if (score.compareTo(selfScore) < 0 && (reason == null || reason.isBlank())) {
            throw new DomainRuleViolation("REDUCTION_REASON_REQUIRED", "Giảm điểm phải có lý do.");
        }
        if (reason != null && reason.length() > 4000) {
            throw new DomainRuleViolation("REVIEW_REASON_TOO_LONG", "Lý do thẩm định không quá 4.000 ký tự.");
        }
    }
}
