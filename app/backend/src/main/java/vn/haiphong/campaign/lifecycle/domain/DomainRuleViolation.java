package vn.haiphong.campaign.lifecycle.domain;

public final class DomainRuleViolation extends RuntimeException {
    private final String code;

    public DomainRuleViolation(String code, String message) {
        super(message);
        this.code = code;
    }

    public String code() {
        return code;
    }
}
