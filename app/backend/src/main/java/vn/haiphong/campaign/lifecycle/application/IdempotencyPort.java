package vn.haiphong.campaign.lifecycle.application;

import java.time.OffsetDateTime;

public interface IdempotencyPort {
    boolean isReplay(String actorId, String command, String key, Object... fingerprintValues);

    void record(String actorId, String command, String key, OffsetDateTime now, Object... fingerprintValues);
}
