package vn.haiphong.campaign.lifecycle.domain;

import java.math.BigDecimal;
import java.net.URI;

public record Submission(
        String id,
        String campaignId,
        String organizationId,
        String lineId,
        SubmissionStatus status,
        BigDecimal selfScore,
        String evidenceUrl,
        String summary,
        int revision,
        int version
) {
    public Submission submit(BigDecimal maximumScore) {
        return submit(maximumScore, selfScore, evidenceUrl, summary);
    }

    public Submission submit(BigDecimal maximumScore, BigDecimal nextSelfScore,
                             String nextEvidenceUrl, String nextSummary) {
        return submit(maximumScore, true, true, nextSelfScore, nextEvidenceUrl, nextSummary);
    }

    public Submission submit(BigDecimal maximumScore, boolean evidenceRequired, boolean summaryRequired,
                             BigDecimal nextSelfScore, String nextEvidenceUrl, String nextSummary) {
        if (status != SubmissionStatus.DRAFT && status != SubmissionStatus.RETURNED) {
            throw new DomainRuleViolation("SUBMISSION_NOT_EDITABLE", "Hồ sơ không ở trạng thái có thể nộp.");
        }
        if (nextSelfScore == null || nextSelfScore.signum() < 0 || nextSelfScore.compareTo(maximumScore) > 0) {
            throw new DomainRuleViolation("SELF_SCORE_OUT_OF_RANGE", "Điểm tự chấm phải nằm trong khung điểm.");
        }
        if (evidenceRequired && !isHttpUrl(nextEvidenceUrl)) {
            throw new DomainRuleViolation("EVIDENCE_URL_INVALID", "Link minh chứng phải dùng http hoặc https.");
        }
        if (!evidenceRequired && nextEvidenceUrl != null && !nextEvidenceUrl.isBlank() && !isHttpUrl(nextEvidenceUrl)) {
            throw new DomainRuleViolation("EVIDENCE_URL_INVALID", "Link minh chứng phải dùng http hoặc https.");
        }
        if (summaryRequired && (nextSummary == null || nextSummary.isBlank())) {
            throw new DomainRuleViolation("SUMMARY_REQUIRED", "Báo cáo tóm tắt là bắt buộc.");
        }
        SubmissionStatus submittedStatus = revision == 0
                ? SubmissionStatus.SUBMITTED
                : SubmissionStatus.RESUBMITTED;
        return new Submission(
                id, campaignId, organizationId, lineId, submittedStatus,
                nextSelfScore, trim(nextEvidenceUrl), trim(nextSummary), revision + 1, version + 1
        );
    }

    public Submission returnToUnit(String reason) {
        if (status != SubmissionStatus.SUBMITTED && status != SubmissionStatus.RESUBMITTED) {
            throw new DomainRuleViolation("SUBMISSION_NOT_RETURNABLE", "Chỉ hồ sơ đã nộp mới có thể trả về.");
        }
        if (reason == null || reason.isBlank()) {
            throw new DomainRuleViolation("RETURN_REASON_REQUIRED", "Trả hồ sơ phải có lý do cụ thể.");
        }
        if (reason.length() > 4000) {
            throw new DomainRuleViolation("RETURN_REASON_TOO_LONG", "Lý do trả hồ sơ không quá 4.000 ký tự.");
        }
        return new Submission(
                id, campaignId, organizationId, lineId, SubmissionStatus.RETURNED,
                selfScore, evidenceUrl, summary, revision, version + 1
        );
    }

    private static boolean isHttpUrl(String value) {
        try {
            URI uri = URI.create(value == null ? "" : value.trim());
            return ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                    && uri.getHost() != null;
        } catch (IllegalArgumentException ignored) {
            return false;
        }
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }
}
