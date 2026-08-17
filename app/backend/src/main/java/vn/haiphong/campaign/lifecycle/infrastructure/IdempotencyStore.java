package vn.haiphong.campaign.lifecycle.infrastructure;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import vn.haiphong.campaign.lifecycle.application.IdempotencyConflict;
import vn.haiphong.campaign.lifecycle.domain.DomainRuleViolation;

@Repository
public class IdempotencyStore {
    private final JdbcTemplate jdbc;

    public IdempotencyStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean isReplay(String actorId, String command, String key, Object... fingerprintValues) {
        requireKey(key);
        String fingerprint = fingerprint(command, fingerprintValues);
        List<String> existing = jdbc.query(
                "select request_fingerprint from idempotency_record " +
                        "where actor_id = ? and command_name = ? and idempotency_key = ?",
                (rs, row) -> rs.getString("request_fingerprint"), actorId, command, key.trim()
        );
        if (existing.isEmpty()) return false;
        if (!existing.getFirst().equals(fingerprint)) {
            throw new IdempotencyConflict();
        }
        return true;
    }

    public void record(String actorId, String command, String key, OffsetDateTime now,
                       Object... fingerprintValues) {
        jdbc.update(
                "insert into idempotency_record " +
                        "(actor_id, command_name, idempotency_key, request_fingerprint, created_at) values (?, ?, ?, ?, ?)",
                actorId, command, key.trim(), fingerprint(command, fingerprintValues), now
        );
    }

    private static void requireKey(String key) {
        if (key == null || key.isBlank() || key.length() > 120) {
            throw new DomainRuleViolation(
                    "IDEMPOTENCY_KEY_INVALID", "Idempotency-Key cần từ 1 đến 120 ký tự."
            );
        }
    }

    private static String fingerprint(String command, Object... values) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(command.getBytes(StandardCharsets.UTF_8));
            for (Object value : values) {
                digest.update((byte) 0);
                digest.update(String.valueOf(value).getBytes(StandardCharsets.UTF_8));
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 must be available", exception);
        }
    }
}
