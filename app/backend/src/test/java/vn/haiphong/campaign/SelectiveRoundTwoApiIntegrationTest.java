package vn.haiphong.campaign;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(properties = {
        "app.bootstrap.enabled=true",
        "app.bootstrap.username=superadmin",
        "app.bootstrap.password=Local-Only-Strong-Password-2026",
        "app.bootstrap.display-name=Quản trị hệ thống"
})
@AutoConfigureMockMvc
class SelectiveRoundTwoApiIntegrationTest {
    private static final String TEMPORARY_PASSWORD = "Temporary-Password-2026";
    private static final String UNIT_PASSWORD = "Permanent-Selective-Unit-2026";
    private static final String REVIEWER_PASSWORD = "Permanent-Selective-Reviewer-2026";

    @Autowired MockMvc http;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper json;

    @BeforeEach
    @AfterEach
    void cleanData() {
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
        jdbc.update("delete from authentication_event where username in ('selective.unit','selective.reviewer')");
        jdbc.update("delete from account_capability where account_id in " +
                "(select id from app_account where username in ('selective.unit','selective.reviewer'))");
        jdbc.update("delete from account_campaign_scope where account_id in " +
                "(select id from app_account where username in ('selective.unit','selective.reviewer'))");
        jdbc.update("delete from app_account where username in ('selective.unit','selective.reviewer')");
        jdbc.update("delete from organization where code = 'SELECTIVE'");
        jdbc.update("delete from review_team where code = 'SELECTIVETEAM'");
        jdbc.update("update campaign set phase = 'PREPARATION', version = 0 where id = 'campaign-summer-2026'");
        jdbc.update("update scorecard_version set status = 'DRAFT_SOURCE', version = 0 " +
                "where id = 'scorecard-dhcd-v1'");
    }

    @Test
    void only_reduced_scores_are_disclosed_explained_and_reopened_in_round_two() throws Exception {
        MockHttpSession superadmin = login("superadmin", "Local-Only-Strong-Password-2026");
        http.perform(post("/api/organization-directory/organizations").session(superadmin).with(csrf())
                        .contentType("application/json")
                        .content("{\"code\":\"SELECTIVE\",\"name\":\"Đơn vị kiểm thử ba biên\"," +
                                "\"unitGroupCode\":\"UNIVERSITY\"}"))
                .andExpect(status().isOk());
        http.perform(post("/api/organization-directory/teams").session(superadmin).with(csrf())
                        .contentType("application/json")
                        .content("{\"code\":\"SELECTIVETEAM\",\"name\":\"Tổ kiểm thử ba biên\"}"))
                .andExpect(status().isOk());

        String organizationId = jdbc.queryForObject(
                "select id from organization where code = 'SELECTIVE'", String.class
        );
        String teamId = jdbc.queryForObject(
                "select id from review_team where code = 'SELECTIVETEAM'", String.class
        );
        createAccount(superadmin, "selective.unit", "Đơn vị ba biên", "UNIT_MEMBER", organizationId, null);
        createAccount(superadmin, "selective.reviewer", "Cán bộ ba biên", "REVIEWER", null, teamId);
        String unitId = jdbc.queryForObject(
                "select id from app_account where username = 'selective.unit'", String.class
        );
        String reviewerId = jdbc.queryForObject(
                "select id from app_account where username = 'selective.reviewer'", String.class
        );
        String adminId = jdbc.queryForObject(
                "select id from app_account where username = 'superadmin'", String.class
        );
        OffsetDateTime now = OffsetDateTime.parse("2026-08-21T09:00:00+07:00");

        List<String> groupIds = List.of("group-i-01", "group-i-02", "group-i-03");
        for (String groupId : groupIds) {
            jdbc.update(
                    "insert into scorecard_assignment_plan " +
                            "(campaign_id, group_id, team_id, reviewer_id, version, updated_at, updated_by) " +
                            "values ('campaign-summer-2026', ?, ?, ?, 1, ?, ?)",
                    groupId, teamId, reviewerId, now, adminId
            );
            jdbc.update(
                    "insert into scorecard_applicability (campaign_id, group_id, unit_group_code) " +
                            "values ('campaign-summer-2026', ?, 'UNIVERSITY')",
                    groupId
            );
        }

        insertCompletedRoundOne("less", "I.01-1", organizationId, teamId, reviewerId, unitId,
                3, 2, "Minh chứng chưa đáp ứng đủ phạm vi.", now);
        insertCompletedRoundOne("equal", "I.02-1", organizationId, teamId, reviewerId, unitId,
                3, 3, null, now.plusMinutes(1));
        insertCompletedRoundOne("greater", "I.03-1", organizationId, teamId, reviewerId, unitId,
                2, 3, null, now.plusMinutes(2));
        jdbc.update("update campaign set phase = 'ROUND_1', version = 2 where id = 'campaign-summer-2026'");
        jdbc.update("update scorecard_version set status = 'RELEASED', version = 1 " +
                "where id = 'scorecard-dhcd-v1'");

        MockHttpSession unit = loginAndChangePassword("selective.unit", TEMPORARY_PASSWORD, UNIT_PASSWORD);
        http.perform(get("/api/unit/tasks").session(unit))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks", hasSize(3)))
                .andExpect(jsonPath("$.tasks[0].roundOneScore").doesNotExist())
                .andExpect(jsonPath("$.tasks[1].roundOneScore").doesNotExist())
                .andExpect(jsonPath("$.tasks[2].roundOneScore").doesNotExist());

        http.perform(post("/api/assignments/current/open-explanation").session(superadmin).with(csrf())
                        .header("Idempotency-Key", "selective-open-explanation-v1")
                        .contentType("application/json").content("{\"expectedVersion\":2}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phase", is("EXPLANATION")));
        http.perform(get("/api/unit/tasks").session(unit))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks[0].roundOneScore", is(2.0)))
                .andExpect(jsonPath("$.tasks[0].roundOneReason", is("Minh chứng chưa đáp ứng đủ phạm vi.")))
                .andExpect(jsonPath("$.tasks[1].roundOneScore").doesNotExist())
                .andExpect(jsonPath("$.tasks[2].roundOneScore").doesNotExist())
                .andExpect(jsonPath("$.tasks[0].roundTwoScore").doesNotExist());

        http.perform(post("/api/unit/tasks/I.02-1/explanation").session(unit).with(csrf())
                        .header("Idempotency-Key", "selective-equal-explanation-v1")
                        .contentType("application/json")
                        .content("{\"body\":\"Không được phép giải trình dòng bằng điểm.\"," +
                                "\"evidenceUrl\":null,\"expectedRevision\":0}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code", is("EXPLANATION_NOT_REQUIRED")));
        http.perform(post("/api/unit/tasks/I.03-1/explanation").session(unit).with(csrf())
                        .header("Idempotency-Key", "selective-greater-explanation-v1")
                        .contentType("application/json")
                        .content("{\"body\":\"Không được phép giải trình dòng tăng điểm.\"," +
                                "\"evidenceUrl\":null,\"expectedRevision\":0}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code", is("EXPLANATION_NOT_REQUIRED")));
        http.perform(post("/api/unit/tasks/I.01-1/explanation").session(unit).with(csrf())
                        .header("Idempotency-Key", "selective-less-explanation-v1")
                        .contentType("application/json")
                        .content("{\"body\":\"Đơn vị bổ sung phạm vi và minh chứng để đối chiếu.\"," +
                                "\"evidenceUrl\":\"https://minhchung.example/bo-sung\",\"expectedRevision\":0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks[0].explanationRevision", is(1)));

        http.perform(post("/api/assignments/current/start-round-two").session(superadmin).with(csrf())
                        .header("Idempotency-Key", "selective-start-round-two-v1")
                        .contentType("application/json").content("{\"expectedVersion\":3}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phase", is("ROUND_2")));
        org.junit.jupiter.api.Assertions.assertEquals(1, jdbc.queryForObject(
                "select count(*) from review_case where round2_status = 'QUEUED'", Integer.class
        ));
        org.junit.jupiter.api.Assertions.assertEquals(2, jdbc.queryForObject(
                "select count(*) from review_case where round2_status = 'NOT_OPEN'", Integer.class
        ));

        MockHttpSession reviewer = loginAndChangePassword(
                "selective.reviewer", TEMPORARY_PASSWORD, REVIEWER_PASSWORD
        );
        http.perform(get("/api/reviewer/queue").session(reviewer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cases", hasSize(1)))
                .andExpect(jsonPath("$.criteria", hasSize(1)))
                .andExpect(jsonPath("$.criteria[0].expectedCases", is(1)));
        http.perform(get("/api/admin/review-control").session(superadmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roundNumber", is(2)))
                .andExpect(jsonPath("$.expectedCases", is(1)))
                .andExpect(jsonPath("$.completedCases", is(0)));

        http.perform(post("/api/reviewer/queue/case-less/round-two").session(reviewer).with(csrf())
                        .header("Idempotency-Key", "selective-complete-round-two-v1")
                        .contentType("application/json")
                        .content("{\"awardedScore\":2.5,\"evidenceChecked\":true," +
                                "\"reason\":\"Đã ghi nhận một phần minh chứng bổ sung.\",\"expectedVersion\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cases[0].status", is("COMPLETED")));

        http.perform(post("/api/results/current/prepare").session(superadmin).with(csrf())
                        .header("Idempotency-Key", "selective-prepare-result-v1")
                        .contentType("application/json").content("{\"expectedCampaignVersion\":4}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resolvedTasks", is(3)))
                .andExpect(jsonPath("$.expectedTasks", is(3)));
        org.junit.jupiter.api.Assertions.assertEquals(3, jdbc.queryForObject(
                "select count(*) from final_result_line", Integer.class
        ));
        org.junit.jupiter.api.Assertions.assertEquals("2.50", jdbc.queryForObject(
                "select cast(effective_score as varchar) from final_result_line where line_id = 'I.01-1'",
                String.class
        ));
        org.junit.jupiter.api.Assertions.assertNull(jdbc.queryForObject(
                "select round2_score from final_result_line where line_id = 'I.02-1'", Object.class
        ));
        org.junit.jupiter.api.Assertions.assertEquals("3.00", jdbc.queryForObject(
                "select cast(effective_score as varchar) from final_result_line where line_id = 'I.03-1'",
                String.class
        ));
    }

    private void insertCompletedRoundOne(
            String suffix, String lineId, String organizationId, String teamId, String reviewerId,
            String unitId, int selfScore, int awardedScore, String reason, OffsetDateTime now
    ) {
        jdbc.update(
                "insert into submission " +
                        "(id, campaign_id, organization_id, line_id, status, self_score, evidence_url, summary, " +
                        "revision, version, updated_at, updated_by) values (?, 'campaign-summer-2026', ?, ?, " +
                        "'LOCKED', ?, ?, ?, 1, 1, ?, ?)",
                "submission-" + suffix, organizationId, lineId, selfScore,
                "https://minhchung.example/" + suffix, "Hồ sơ kiểm thử " + suffix, now, unitId
        );
        jdbc.update(
                "insert into review_case " +
                        "(id, submission_id, line_id, team_id, reviewer_id, round1_status, round2_status, version) " +
                        "values (?, ?, ?, ?, ?, 'COMPLETED', 'NOT_OPEN', 0)",
                "case-" + suffix, "submission-" + suffix, lineId, teamId, reviewerId
        );
        jdbc.update(
                "insert into review_decision " +
                        "(id, review_case_id, round_number, revision, awarded_score, reason, evidence_checked, " +
                        "decided_by, decided_at) values (?, ?, 1, 1, ?, ?, true, ?, ?)",
                "decision-" + suffix, "case-" + suffix, awardedScore, reason, reviewerId, now
        );
    }

    private void createAccount(MockHttpSession admin, String username, String displayName, String role,
                               String organizationId, String teamId) throws Exception {
        Map<String, Object> command = new java.util.HashMap<>();
        command.put("username", username);
        command.put("displayName", displayName);
        command.put("password", TEMPORARY_PASSWORD);
        command.put("role", role);
        if (organizationId != null) command.put("organizationId", organizationId);
        if (teamId != null) command.put("teamId", teamId);
        http.perform(post("/api/accounts").session(admin).with(csrf())
                        .contentType("application/json").content(json.writeValueAsString(command)))
                .andExpect(status().isOk());
    }

    private MockHttpSession loginAndChangePassword(String username, String password, String permanent)
            throws Exception {
        MockHttpSession session = login(username, password);
        http.perform(post("/api/auth/change-password").session(session).with(csrf())
                        .contentType("application/json")
                        .content(json.writeValueAsString(Map.of(
                                "currentPassword", password, "newPassword", permanent
                        ))))
                .andExpect(status().isOk());
        return session;
    }

    private MockHttpSession login(String username, String password) throws Exception {
        return (MockHttpSession) http.perform(post("/api/auth/login").with(csrf())
                        .contentType("application/json")
                        .content(json.writeValueAsString(Map.of("username", username, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getRequest().getSession(false);
    }
}
