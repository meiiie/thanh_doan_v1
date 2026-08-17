package vn.haiphong.campaign.access;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AccountRepository {
    private final JdbcTemplate jdbc;

    public AccountRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Credentials> credentialsByUsername(String username) {
        List<Credentials> accounts = jdbc.query(
                "select id, username, password_hash, enabled, password_change_required " +
                        "from app_account where lower(username) = lower(?)",
                (rs, row) -> new Credentials(
                        rs.getString("id"), rs.getString("username"), rs.getString("password_hash"),
                        rs.getBoolean("enabled"), rs.getBoolean("password_change_required")
                ),
                username
        );
        return accounts.stream().findFirst();
    }

    public Optional<Credentials> credentialsById(String accountId) {
        List<Credentials> result = jdbc.query(
                "select id, username, password_hash, enabled, password_change_required " +
                        "from app_account where id = ?",
                (rs, row) -> new Credentials(
                        rs.getString("id"), rs.getString("username"), rs.getString("password_hash"),
                        rs.getBoolean("enabled"), rs.getBoolean("password_change_required")
                ),
                accountId
        );
        return result.stream().findFirst();
    }

    public Optional<Actor> actorById(String accountId) {
        List<Actor> actors = jdbc.query(
                "select id, display_name, role, organization_id, team_id from app_account where id = ? and enabled = true",
                (rs, row) -> new Actor(
                        rs.getString("id"),
                        rs.getString("display_name"),
                        ActorRole.valueOf(rs.getString("role")),
                        campaignScopes(rs.getString("id")),
                        capabilities(rs.getString("id")),
                        rs.getString("organization_id"),
                        rs.getString("team_id")
                ),
                accountId
        );
        return actors.stream().findFirst();
    }

    public List<AccountView> all() {
        return jdbc.query(
                "select id, username, display_name, role, organization_id, team_id, enabled, password_change_required, created_at " +
                        "from app_account order by role, display_name",
                (rs, row) -> new AccountView(
                        rs.getString("id"), rs.getString("username"), rs.getString("display_name"),
                        ActorRole.valueOf(rs.getString("role")), rs.getString("organization_id"),
                        rs.getString("team_id"), rs.getBoolean("enabled"),
                        rs.getBoolean("password_change_required"),
                        rs.getObject("created_at", OffsetDateTime.class),
                        campaignScopes(rs.getString("id")), capabilities(rs.getString("id"))
                )
        );
    }

    public boolean usernameExists(String username) {
        Integer count = jdbc.queryForObject(
                "select count(*) from app_account where lower(username) = lower(?)", Integer.class, username
        );
        return count != null && count > 0;
    }

    public boolean organizationExists(String organizationId) {
        Integer count = jdbc.queryForObject(
                "select count(*) from organization where id = ? and enabled = true", Integer.class, organizationId
        );
        return count != null && count > 0;
    }

    public boolean teamExists(String teamId) {
        Integer count = jdbc.queryForObject(
                "select count(*) from review_team where id = ? and enabled = true", Integer.class, teamId
        );
        return count != null && count > 0;
    }

    public void insert(
            String id,
            String username,
            String displayName,
            String passwordHash,
            ActorRole role,
            String organizationId,
            String teamId,
            boolean passwordChangeRequired,
            OffsetDateTime createdAt,
            String createdBy,
            Set<String> campaignIds,
            Set<String> capabilities
    ) {
        jdbc.update(
                "insert into app_account " +
                        "(id, username, display_name, password_hash, role, organization_id, team_id, enabled, password_change_required, created_at, created_by) " +
                        "values (?, ?, ?, ?, ?, ?, ?, true, ?, ?, ?)",
                id, username, displayName, passwordHash, role.name(), blankToNull(organizationId),
                blankToNull(teamId), passwordChangeRequired, createdAt, createdBy
        );
        campaignIds.forEach(campaignId -> jdbc.update(
                "insert into account_campaign_scope (account_id, campaign_id) values (?, ?)", id, campaignId
        ));
        capabilities.forEach(capability -> jdbc.update(
                "insert into account_capability (account_id, capability) values (?, ?)", id, capability
        ));
    }

    public void authenticationEvent(
            OffsetDateTime occurredAt, String accountId, String username, String eventType, String outcome
    ) {
        jdbc.update(
                "insert into authentication_event (occurred_at, account_id, username, event_type, outcome) values (?, ?, ?, ?, ?)",
                occurredAt, accountId, username, eventType, outcome
        );
    }

    public void changePassword(String accountId, String passwordHash) {
        jdbc.update(
                "update app_account set password_hash = ?, password_change_required = false where id = ?",
                passwordHash, accountId
        );
    }

    public void accountCreatedAudit(OffsetDateTime occurredAt, String actorId, String accountId) {
        jdbc.update(
                "insert into audit_record " +
                        "(occurred_at, actor_id, action, aggregate_type, aggregate_id, from_state, to_state, reason, correlation_id, aggregate_version) " +
                        "values (?, ?, 'CREATE_ACCOUNT', 'Account', ?, null, 'ACTIVE', null, ?, 0)",
                occurredAt, actorId, accountId, java.util.UUID.randomUUID().toString()
        );
    }

    private Set<String> campaignScopes(String accountId) {
        return Set.copyOf(jdbc.queryForList(
                "select campaign_id from account_campaign_scope where account_id = ?", String.class, accountId
        ));
    }

    private Set<String> capabilities(String accountId) {
        return Set.copyOf(jdbc.queryForList(
                "select capability from account_capability where account_id = ?", String.class, accountId
        ));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public record Credentials(
            String id, String username, String passwordHash, boolean enabled, boolean passwordChangeRequired
    ) {}

    public record AccountView(
            String id,
            String username,
            String displayName,
            ActorRole role,
            String organizationId,
            String teamId,
            boolean enabled,
            boolean passwordChangeRequired,
            OffsetDateTime createdAt,
            Set<String> campaignIds,
            Set<String> capabilities
    ) {}
}
