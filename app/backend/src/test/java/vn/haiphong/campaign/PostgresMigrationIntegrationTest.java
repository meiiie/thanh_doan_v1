package vn.haiphong.campaign;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.sql.DriverManager;
import java.sql.SQLException;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers(disabledWithoutDocker = true)
class PostgresMigrationIntegrationTest {
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:18-alpine")
            .withDatabaseName("campaign")
            .withUsername("campaign")
            .withPassword("integration-only");

    @Test
    void production_schema_migrates_and_enforces_critical_constraints() throws Exception {
        Flyway flyway = Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();

        assertEquals(8, flyway.migrate().migrationsExecuted);

        try (var connection = DriverManager.getConnection(
                POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
             var statement = connection.createStatement()) {
            try (var result = statement.executeQuery("select count(*) from scorecard_line")) {
                result.next();
                assertEquals(55, result.getInt(1));
            }
            try (var result = statement.executeQuery(
                    "select count(*) from information_schema.tables where table_name in " +
                            "('submission_return_event','final_result_unit','final_result_line')"
            )) {
                result.next();
                assertEquals(3, result.getInt(1));
            }
            try (var result = statement.executeQuery(
                    "select count(*) from information_schema.columns " +
                            "where table_name in ('organization','review_team','app_account') " +
                            "and column_name in ('source_file_name','source_sha256','source_sheet_name','source_row')"
            )) {
                result.next();
                assertEquals(12, result.getInt(1));
            }
            try (var result = statement.executeQuery(
                    "select count(*) from information_schema.columns where table_name = 'final_result_line' " +
                            "and column_name in ('round2_score','round2_decided_by','round2_decided_by_name'," +
                            "'round2_decided_at') and is_nullable = 'YES'"
            )) {
                result.next();
                assertEquals(4, result.getInt(1));
            }
            assertThrows(SQLException.class, () -> statement.executeUpdate(
                    "update campaign set phase = 'INVALID_PHASE' where id = 'campaign-summer-2026'"
            ));
            assertThrows(SQLException.class, () -> statement.executeUpdate(
                    "insert into scorecard_applicability " +
                            "(campaign_id, group_id, unit_group_code) " +
                            "values ('campaign-summer-2026', 'group-i-01', 'UNIVERSITY')"
            ));
        }
    }
}
