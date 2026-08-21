package vn.haiphong.campaign.access;

import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
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

    public Optional<SessionAccount> sessionAccountById(String accountId) {
        return jdbc.query(
                "select a.id, a.display_name, a.role, a.organization_id, a.team_id, " +
                        "a.password_change_required, s.campaign_id, c.capability " +
                        "from app_account a " +
                        "left join account_campaign_scope s on s.account_id = a.id " +
                        "left join account_capability c on c.account_id = a.id " +
                        "where a.id = ? and a.enabled = true",
                resultSet -> {
                    if (!resultSet.next()) return Optional.empty();
                    String id = resultSet.getString("id");
                    String displayName = resultSet.getString("display_name");
                    ActorRole role = ActorRole.valueOf(resultSet.getString("role"));
                    String organizationId = resultSet.getString("organization_id");
                    String teamId = resultSet.getString("team_id");
                    boolean passwordChangeRequired = resultSet.getBoolean("password_change_required");
                    Set<String> campaignIds = new LinkedHashSet<>();
                    Set<String> capabilities = new LinkedHashSet<>();
                    do {
                        String campaignId = resultSet.getString("campaign_id");
                        String capability = resultSet.getString("capability");
                        if (campaignId != null) campaignIds.add(campaignId);
                        if (capability != null) capabilities.add(capability);
                    } while (resultSet.next());
                    Actor actor = new Actor(
                            id, displayName, role, Set.copyOf(campaignIds), Set.copyOf(capabilities),
                            organizationId, teamId
                    );
                    return Optional.of(new SessionAccount(actor, passwordChangeRequired));
                },
                accountId
        );
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
                "select id, username, display_name, role, organization_id, team_id, enabled, " +
                        "password_change_required, created_at, source_file_name, source_sha256, " +
                        "source_sheet_name, source_row " +
                        "from app_account order by role, display_name",
                (rs, row) -> new AccountView(
                        rs.getString("id"), rs.getString("username"), rs.getString("display_name"),
                        ActorRole.valueOf(rs.getString("role")), rs.getString("organization_id"),
                        rs.getString("team_id"), rs.getBoolean("enabled"),
                        rs.getBoolean("password_change_required"),
                        rs.getObject("created_at", OffsetDateTime.class),
                        rs.getString("source_file_name"), rs.getString("source_sha256"),
                        rs.getString("source_sheet_name"), rs.getObject("source_row", Integer.class),
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

    public void setEnabled(String accountId, boolean enabled) {
        int changed = jdbc.update("update app_account set enabled = ? where id = ?", enabled, accountId);
        if (changed != 1) throw new IllegalStateException("Account disappeared during status update");
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
            Set<String> capabilities,
            String sourceFileName,
            String sourceSha256,
            String sourceSheetName,
            Integer sourceRow
    ) {
        jdbc.update(
                "insert into app_account " +
                        "(id, username, display_name, password_hash, role, organization_id, team_id, enabled, " +
                        "password_change_required, created_at, created_by, source_file_name, source_sha256, " +
                        "source_sheet_name, source_row) " +
                        "values (?, ?, ?, ?, ?, ?, ?, true, ?, ?, ?, ?, ?, ?, ?)",
                id, username, displayName, passwordHash, role.name(), blankToNull(organizationId),
                blankToNull(teamId), passwordChangeRequired, createdAt, createdBy,
                sourceFileName, sourceSha256, sourceSheetName, sourceRow
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

    public void accountStatusAudit(OffsetDateTime occurredAt, String actorId, String accountId, boolean enabled) {
        jdbc.update(
                "insert into audit_record " +
                        "(occurred_at, actor_id, action, aggregate_type, aggregate_id, from_state, to_state, " +
                        "reason, correlation_id, aggregate_version) " +
                        "values (?, ?, ?, 'Account', ?, ?, ?, null, ?, 0)",
                occurredAt, actorId, enabled ? "UNLOCK_ACCOUNT" : "LOCK_ACCOUNT", accountId,
                enabled ? "LOCKED" : "ACTIVE", enabled ? "ACTIVE" : "LOCKED",
                java.util.UUID.randomUUID().toString()
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

    public record SessionAccount(Actor actor, boolean passwordChangeRequired) {}

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
            String sourceFileName,
            String sourceSha256,
            String sourceSheetName,
            Integer sourceRow,
            Set<String> campaignIds,
            Set<String> capabilities
    ) {}
}
