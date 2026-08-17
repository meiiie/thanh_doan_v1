package vn.haiphong.campaign.lifecycle.application;

public final class OptimisticConflict extends RuntimeException {
    public OptimisticConflict(String message) {
        super(message);
    }
}
