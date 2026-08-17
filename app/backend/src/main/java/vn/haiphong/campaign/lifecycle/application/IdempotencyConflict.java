package vn.haiphong.campaign.lifecycle.application;

public final class IdempotencyConflict extends RuntimeException {
    public IdempotencyConflict() {
        super("Idempotency key đã được dùng với nội dung khác.");
    }
}
