package vn.haiphong.campaign.lifecycle.domain;

import java.math.BigDecimal;

public record FinalResult(
        String id,
        String campaignId,
        int resultVersion,
        FinalResultStatus status,
        BigDecimal totalScore,
        String checksum,
        String preparedBy,
        String approvedBy,
        String publishedBy,
        int version
) {
    public FinalResult approve(String actorId) {
        if (status != FinalResultStatus.PENDING_APPROVAL) {
            throw new DomainRuleViolation("RESULT_NOT_PENDING_APPROVAL", "Kết quả chưa ở trạng thái chờ duyệt.");
        }
        if (preparedBy.equals(actorId)) {
            throw new DomainRuleViolation("FOUR_EYES_REQUIRED", "Người lập kết quả không được tự duyệt.");
        }
        return new FinalResult(
                id, campaignId, resultVersion, FinalResultStatus.APPROVED,
                totalScore, checksum, preparedBy, actorId, publishedBy, version + 1
        );
    }

    public FinalResult publish(String actorId) {
        if (status != FinalResultStatus.APPROVED) {
            throw new DomainRuleViolation("RESULT_NOT_APPROVED", "Kết quả phải được duyệt trước khi công bố.");
        }
        return new FinalResult(
                id, campaignId, resultVersion, FinalResultStatus.PUBLISHED,
                totalScore, checksum, preparedBy, approvedBy, actorId, version + 1
        );
    }
}
