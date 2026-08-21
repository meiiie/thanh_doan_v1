package vn.haiphong.campaign;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.util.StopWatch;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.ObjectMapper;

@Tag("capacity")
@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(properties = {
        "app.bootstrap.enabled=true",
        "app.bootstrap.username=superadmin",
        "app.bootstrap.password=Local-Only-Strong-Password-2026",
        "app.bootstrap.display-name=Quản trị hệ thống"
})
@AutoConfigureMockMvc
class CapacityLoadIntegrationTest {
    private static final int ORGANIZATION_COUNT = 134;
    private static final int LINE_COUNT = 55;
    private static final int EXPECTED_TASKS = ORGANIZATION_COUNT * LINE_COUNT;
    private static final int RESULT_VIEW_SAMPLES = 20;
    private static final double RESULT_VIEW_P95_BUDGET_MILLIS = 250;

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:18-alpine")
            .withDatabaseName("campaign_capacity")
            .withUsername("campaign")
            .withPassword("capacity-test-only");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        properties.add("spring.datasource.username", POSTGRES::getUsername);
        properties.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired JdbcTemplate jdbc;
    @Autowired MockMvc http;
    @Autowired ObjectMapper json;

    @BeforeEach
    @AfterEach
    void cleanCapacityData() {
        jdbc.update("delete from final_result_line");
        jdbc.update("delete from final_result_unit");
        jdbc.update("delete from final_result");
        jdbc.update("delete from explanation_revision");
        jdbc.update("delete from submission_return_event");
        jdbc.update("delete from review_decision");
        jdbc.update("delete from review_case");
        jdbc.update("delete from submission_revision");
        jdbc.update("delete from submission");
        jdbc.update("delete from scorecard_applicability");
        jdbc.update("delete from scorecard_assignment_plan");
        jdbc.update("delete from idempotency_record");
        jdbc.update("delete from audit_record");
        jdbc.update("delete from organization where code like 'LOAD%'");
        jdbc.update("delete from review_team where code = 'LOADTEAM'");
        jdbc.update("update campaign set phase = 'PREPARATION', version = 0 where id = 'campaign-summer-2026'");
        jdbc.update("update scorecard_version set status = 'DRAFT_SOURCE', version = 0 where id = 'scorecard-dhcd-v1'");
    }

    @Test
    void snapshot_and_excel_export_handle_134_organizations_by_55_lines() throws Exception {
        String actorId = jdbc.queryForObject(
                "select id from app_account where username = 'superadmin'", String.class
        );
        OffsetDateTime now = OffsetDateTime.parse("2026-08-14T10:00:00+07:00");
        jdbc.update(
                "insert into review_team (id, campaign_id, code, name, enabled, created_at, created_by) " +
                        "values ('load-team','campaign-summer-2026','LOADTEAM','Tổ kiểm thử tải',true,?,?)",
                now, actorId
        );

        List<Map<String, Object>> unitGroups = jdbc.queryForList(
                "select code, documented_unit_count from unit_group order by code"
        );
        List<Object[]> organizations = new ArrayList<>();
        int organizationIndex = 0;
        for (Map<String, Object> unitGroup : unitGroups) {
            String groupCode = unitGroup.get("code").toString();
            int count = ((Number) unitGroup.get("documented_unit_count")).intValue();
            for (int index = 0; index < count; index++) {
                organizationIndex++;
                organizations.add(new Object[]{
                        "load-org-" + organizationIndex,
                        "LOAD" + String.format("%03d", organizationIndex),
                        "Đơn vị kiểm thử tải " + String.format("%03d", organizationIndex),
                        groupCode, now, actorId
                });
            }
        }
        assertEquals(ORGANIZATION_COUNT, organizations.size());
        jdbc.batchUpdate(
                "insert into organization (id, code, name, unit_group_code, enabled, created_at, created_by) " +
                        "values (?,?,?,?,true,?,?)", organizations
        );

        List<String> groupIds = jdbc.queryForList(
                "select id from scorecard_group where scorecard_version_id = 'scorecard-dhcd-v1' order by display_order",
                String.class
        );
        List<Object[]> plans = new ArrayList<>();
        List<Object[]> applicability = new ArrayList<>();
        for (String groupId : groupIds) {
            plans.add(new Object[]{"campaign-summer-2026", groupId, "load-team", actorId, 1, now, actorId});
            for (Map<String, Object> unitGroup : unitGroups) {
                applicability.add(new Object[]{"campaign-summer-2026", groupId, unitGroup.get("code")});
            }
        }
        jdbc.batchUpdate(
                "insert into scorecard_assignment_plan " +
                        "(campaign_id, group_id, team_id, reviewer_id, version, updated_at, updated_by) " +
                        "values (?,?,?,?,?,?,?)", plans
        );
        jdbc.batchUpdate(
                "insert into scorecard_applicability (campaign_id, group_id, unit_group_code) values (?,?,?)",
                applicability
        );

        List<Map<String, Object>> lines = jdbc.queryForList(
                "select id, maximum_score from scorecard_line where scorecard_version_id = 'scorecard-dhcd-v1' " +
                        "order by display_order"
        );
        assertEquals(LINE_COUNT, lines.size());
        List<Object[]> submissions = new ArrayList<>(EXPECTED_TASKS);
        List<Object[]> cases = new ArrayList<>(EXPECTED_TASKS);
        List<Object[]> decisions = new ArrayList<>(EXPECTED_TASKS);
        for (int org = 1; org <= ORGANIZATION_COUNT; org++) {
            for (int line = 0; line < lines.size(); line++) {
                String suffix = String.format("%03d-%02d", org, line + 1);
                String submissionId = "ls-" + suffix;
                String caseId = "lc-" + suffix;
                String lineId = lines.get(line).get("id").toString();
                BigDecimal maximum = new BigDecimal(lines.get(line).get("maximum_score").toString());
                submissions.add(new Object[]{
                        submissionId, "campaign-summer-2026", "load-org-" + org, lineId,
                        "LOCKED", maximum, "https://minhchung.local/" + suffix,
                        "Hồ sơ kiểm thử tải có nguồn và người chịu trách nhiệm.", 1, 1, now, actorId
                });
                cases.add(new Object[]{caseId, submissionId, lineId, "load-team", actorId,
                        "COMPLETED", "NOT_OPEN", 1});
                decisions.add(new Object[]{"ld1-" + suffix, caseId, 1, 1, maximum, null, true, actorId, now});
            }
        }
        jdbc.batchUpdate(
                "insert into submission " +
                        "(id, campaign_id, organization_id, line_id, status, self_score, evidence_url, summary, " +
                        "revision, version, updated_at, updated_by) values (?,?,?,?,?,?,?,?,?,?,?,?)", submissions
        );
        jdbc.batchUpdate(
                "insert into review_case " +
                        "(id, submission_id, line_id, team_id, reviewer_id, round1_status, round2_status, version) " +
                        "values (?,?,?,?,?,?,?,?)", cases
        );
        jdbc.batchUpdate(
                "insert into review_decision " +
                        "(id, review_case_id, round_number, revision, awarded_score, reason, evidence_checked, decided_by, decided_at) " +
                        "values (?,?,?,?,?,?,?,?,?)", decisions
        );
        jdbc.update("update campaign set phase = 'ROUND_2', version = 4 where id = 'campaign-summer-2026'");
        jdbc.update("update scorecard_version set status = 'RELEASED', version = 1 where id = 'scorecard-dhcd-v1'");

        MockHttpSession session = login();
        StopWatch timer = new StopWatch("134x55-capacity");
        timer.start("snapshot");
        http.perform(post("/api/results/current/prepare").session(session).with(csrf())
                        .header("Idempotency-Key", "capacity-prepare-v1")
                        .contentType("application/json").content("{\"expectedCampaignVersion\":4}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.expectedTasks").value(EXPECTED_TASKS))
                .andExpect(jsonPath("$.resolvedTasks").value(EXPECTED_TASKS))
                .andExpect(jsonPath("$.units.length()").value(ORGANIZATION_COUNT));
        timer.stop();
        for (int warmup = 0; warmup < 3; warmup++) {
            http.perform(get("/api/results/current").session(session))
                    .andExpect(status().isOk());
        }
        List<Long> resultViewSamples = new ArrayList<>(RESULT_VIEW_SAMPLES);
        int resultViewBytes = 0;
        for (int sample = 0; sample < RESULT_VIEW_SAMPLES; sample++) {
            long startedAt = System.nanoTime();
            byte[] response = http.perform(get("/api/results/current").session(session))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.units.length()").value(ORGANIZATION_COUNT))
                    .andReturn().getResponse().getContentAsByteArray();
            resultViewSamples.add(System.nanoTime() - startedAt);
            resultViewBytes = response.length;
        }
        double p50Millis = percentileMilliseconds(resultViewSamples, 0.50);
        double p95Millis = percentileMilliseconds(resultViewSamples, 0.95);
        double maxMillis = percentileMilliseconds(resultViewSamples, 1.00);
        System.out.printf(Locale.ROOT,
                "PERF_BASELINE dataset=134x55 operation=result-view samples=%d p50Ms=%.2f p95Ms=%.2f maxMs=%.2f responseBytes=%d%n",
                RESULT_VIEW_SAMPLES, p50Millis, p95Millis, maxMillis, resultViewBytes);

        timer.start("xlsx-export");
        byte[] workbook = http.perform(get("/api/results/current/export").session(session))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray();
        timer.stop();

        assertEquals(EXPECTED_TASKS, jdbc.queryForObject(
                "select count(*) from final_result_line", Integer.class
        ));
        assertEquals(ORGANIZATION_COUNT, jdbc.queryForObject(
                "select count(*) from final_result_unit", Integer.class
        ));
        assertTrue(workbook.length > 100_000, "Workbook phải chứa toàn bộ dữ liệu đối soát");
        assertTrue(timer.getTaskInfo()[0].getTime(TimeUnit.SECONDS) < 20, timer.prettyPrint());
        assertTrue(timer.getTaskInfo()[1].getTime(TimeUnit.SECONDS) < 10, timer.prettyPrint());
        assertTrue(p95Millis < RESULT_VIEW_P95_BUDGET_MILLIS,
                "Result view p95 %.2f ms exceeded %.0f ms".formatted(
                        p95Millis, RESULT_VIEW_P95_BUDGET_MILLIS));
    }

    private static double percentileMilliseconds(List<Long> samples, double percentile) {
        List<Long> ordered = new ArrayList<>(samples);
        ordered.sort(Long::compareTo);
        int index = Math.max(0, (int) Math.ceil(percentile * ordered.size()) - 1);
        return ordered.get(index) / 1_000_000.0;
    }

    private MockHttpSession login() throws Exception {
        return (MockHttpSession) http.perform(post("/api/auth/login").with(csrf())
                        .contentType("application/json")
                        .content(json.writeValueAsString(Map.of(
                                "username", "superadmin", "password", "Local-Only-Strong-Password-2026"
                        ))))
                .andExpect(status().isOk()).andReturn().getRequest().getSession(false);
    }
}
