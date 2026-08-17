package vn.haiphong.campaign.organization;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class OrganizationRepository {
    private final JdbcTemplate jdbc;

    public OrganizationRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<OrganizationView> organizations() {
        return jdbc.query(
                "select o.id, o.code, o.name, o.unit_group_code, ug.name unit_group_name, o.enabled " +
                        "from organization o join unit_group ug on ug.code = o.unit_group_code " +
                        "order by ug.name, o.name",
                (rs, row) -> new OrganizationView(
                        rs.getString("id"), rs.getString("code"), rs.getString("name"),
                        rs.getString("unit_group_code"), rs.getString("unit_group_name"), rs.getBoolean("enabled")
                )
        );
    }

    public List<UnitGroupView> unitGroups() {
        return jdbc.query(
                "select code, name, documented_unit_count from unit_group order by name",
                (rs, row) -> new UnitGroupView(
                        rs.getString("code"), rs.getString("name"), rs.getInt("documented_unit_count")
                )
        );
    }

    public List<TeamView> teams(String campaignId) {
        return jdbc.query(
                "select id, code, name, enabled from review_team where campaign_id = ? order by name",
                (rs, row) -> new TeamView(
                        rs.getString("id"), rs.getString("code"), rs.getString("name"), rs.getBoolean("enabled")
                ),
                campaignId
        );
    }

    public boolean unitGroupExists(String code) {
        return exists("select count(*) from unit_group where code = ?", code);
    }

    public boolean organizationCodeExists(String code) {
        return exists("select count(*) from organization where upper(code) = upper(?)", code);
    }

    public boolean teamCodeExists(String campaignId, String code) {
        Integer count = jdbc.queryForObject(
                "select count(*) from review_team where campaign_id = ? and upper(code) = upper(?)",
                Integer.class, campaignId, code
        );
        return count != null && count > 0;
    }

    public void insertOrganization(
            String id, String code, String name, String unitGroupCode, OffsetDateTime createdAt, String createdBy
    ) {
        jdbc.update(
                "insert into organization " +
                        "(id, code, name, unit_group_code, enabled, created_at, created_by) " +
                        "values (?, ?, ?, ?, true, ?, ?)",
                id, code, name, unitGroupCode, createdAt, createdBy
        );
    }

    public void insertTeam(
            String id, String campaignId, String code, String name, OffsetDateTime createdAt, String createdBy
    ) {
        jdbc.update(
                "insert into review_team " +
                        "(id, campaign_id, code, name, enabled, created_at, created_by) " +
                        "values (?, ?, ?, ?, true, ?, ?)",
                id, campaignId, code, name, createdAt, createdBy
        );
    }

    public void createdAudit(
            OffsetDateTime occurredAt, String actorId, String action, String aggregateType, String aggregateId
    ) {
        jdbc.update(
                "insert into audit_record " +
                        "(occurred_at, actor_id, action, aggregate_type, aggregate_id, from_state, to_state, reason, correlation_id, aggregate_version) " +
                        "values (?, ?, ?, ?, ?, null, 'ACTIVE', null, ?, 0)",
                occurredAt, actorId, action, aggregateType, aggregateId, java.util.UUID.randomUUID().toString()
        );
    }

    private boolean exists(String sql, String value) {
        Integer count = jdbc.queryForObject(sql, Integer.class, value);
        return count != null && count > 0;
    }

    public record OrganizationView(
            String id, String code, String name, String unitGroupCode, String unitGroupName, boolean enabled
    ) {}

    public record TeamView(String id, String code, String name, boolean enabled) {}
    public record UnitGroupView(String code, String name, int documentedUnitCount) {}
}
