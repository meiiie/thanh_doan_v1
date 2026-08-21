package vn.haiphong.campaign;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
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
class WorkflowApiIntegrationTest {
    private static final String TEMPORARY_PASSWORD = "Temporary-Password-2026";
    private static final String UNIT_PASSWORD = "Permanent-Unit-Password-2026";
    private static final String REVIEWER_PASSWORD = "Permanent-Reviewer-Password-2026";
    private static final String APPROVER_PASSWORD = "Permanent-Approver-Password-2026";

    @Autowired MockMvc http;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper json;

    @BeforeEach
    @AfterEach
    void cleanWorkflowData() {
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
        jdbc.update("delete from authentication_event where username in " +
                "('workflow.unit','workflow.reviewer','workflow.outsider','workflow.approver')");
        jdbc.update("delete from account_capability where account_id in " +
                "(select id from app_account where username in " +
                "('workflow.unit','workflow.reviewer','workflow.outsider','workflow.approver'))");
        jdbc.update("delete from account_campaign_scope where account_id in " +
                "(select id from app_account where username in " +
                "('workflow.unit','workflow.reviewer','workflow.outsider','workflow.approver'))");
        jdbc.update("delete from app_account where username in " +
                "('workflow.unit','workflow.reviewer','workflow.outsider','workflow.approver')");
        jdbc.update("delete from organization where code = 'WORKFLOWUNIT'");
        jdbc.update("delete from review_team where code = 'WORKFLOWTEAM'");
        jdbc.update("update campaign set phase = 'PREPARATION', version = 0 where id = 'campaign-summer-2026'");
        jdbc.update("update scorecard_version set status = 'DRAFT_SOURCE', version = 0 where id = 'scorecard-dhcd-v1'");
    }

    @Test
    void assignment_submission_review_and_admin_progress_form_one_scoped_audited_flow() throws Exception {
        MockHttpSession superadmin = login("superadmin", "Local-Only-Strong-Password-2026");

        http.perform(post("/api/organization-directory/organizations").session(superadmin).with(csrf())
                        .contentType("application/json")
                        .content("{\"code\":\"WORKFLOWUNIT\",\"name\":\"Đơn vị kiểm chứng luồng\",\"unitGroupCode\":\"UNIVERSITY\"}"))
                .andExpect(status().isOk());
        http.perform(post("/api/organization-directory/teams").session(superadmin).with(csrf())
                        .contentType("application/json")
                        .content("{\"code\":\"WORKFLOWTEAM\",\"name\":\"Tổ kiểm chứng luồng\"}"))
                .andExpect(status().isOk());

        String organizationId = jdbc.queryForObject(
                "select id from organization where code = 'WORKFLOWUNIT'", String.class
        );
        String teamId = jdbc.queryForObject(
                "select id from review_team where code = 'WORKFLOWTEAM'", String.class
        );
        createAccount(superadmin, "workflow.unit", "Cán bộ đơn vị", "UNIT_MEMBER", organizationId, null, false);
        createAccount(superadmin, "workflow.reviewer", "Người theo dõi Tổ", "REVIEWER", null, teamId, true);
        createAccount(superadmin, "workflow.outsider", "Cán bộ ngoài phân công", "REVIEWER", null, teamId, false);
        createAccount(superadmin, "workflow.approver", "Lãnh đạo phê duyệt", "CAMPAIGN_ADMIN", null, null, false);
        String reviewerId = jdbc.queryForObject(
                "select id from app_account where username = 'workflow.reviewer'", String.class
        );

        List<String> groupIds = jdbc.queryForList(
                "select id from scorecard_group where scorecard_version_id = 'scorecard-dhcd-v1' order by display_order",
                String.class
        );
        List<Map<String, Object>> versions = groupIds.stream()
                .map(groupId -> Map.<String, Object>of("groupId", groupId, "expectedVersion", 0)).toList();
        http.perform(put("/api/assignments/current/bulk").session(superadmin).with(csrf())
                        .contentType("application/json")
                        .content(json.writeValueAsString(Map.of(
                                "groups", versions,
                                "unitGroupCodes", List.of("COMMUNE"),
                                "teamId", teamId,
                                "reviewerId", reviewerId
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.progress.readyGroups", is(27)));

        String firstGroupId = groupIds.getFirst();
        http.perform(put("/api/assignments/current/groups/{groupId}", firstGroupId)
                        .session(superadmin).with(csrf()).contentType("application/json")
                        .content(json.writeValueAsString(Map.of(
                                "unitGroupCodes", List.of("UNIVERSITY"),
                                "teamId", teamId,
                                "reviewerId", reviewerId,
                                "expectedVersion", 1
                        ))))
                .andExpect(status().isOk());

        http.perform(post("/api/assignments/current/release").session(superadmin).with(csrf())
                        .header("Idempotency-Key", "release-workflow-v1")
                        .contentType("application/json").content("{\"expectedVersion\":0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phase", is("SELF_ASSESSMENT")))
                .andExpect(jsonPath("$.progress.expectedTasks", is(1)));
        http.perform(post("/api/assignments/current/release").session(superadmin).with(csrf())
                        .header("Idempotency-Key", "release-workflow-v1")
                        .contentType("application/json").content("{\"expectedVersion\":0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phase", is("SELF_ASSESSMENT")));
        http.perform(get("/api/admin/review-control/criteria/{groupId}/cases", firstGroupId)
                        .session(superadmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cases", hasSize(1)))
                .andExpect(jsonPath("$.cases[0].reviewStatus", is("NOT_SUBMITTED")))
                .andExpect(jsonPath("$.cases[0].submissionRevision", is(0)))
                .andExpect(jsonPath("$.cases[0].evidenceUrl").doesNotExist());

        MockHttpSession unit = loginAndChangePassword("workflow.unit", TEMPORARY_PASSWORD, UNIT_PASSWORD);
        String unitResponse = http.perform(get("/api/unit/tasks").session(unit))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks", hasSize(1)))
                .andReturn().getResponse().getContentAsString();
        http.perform(get("/api/unit/results/final").session(unit))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.published", is(false)))
                .andExpect(jsonPath("$.lines", hasSize(0)));
        String lineId = json.readTree(unitResponse).path("tasks").get(0).path("lineId").asText();
        http.perform(post("/api/unit/tasks/{lineId}/submit", lineId).session(unit).with(csrf())
                        .header("Idempotency-Key", "submit-workflow-line-v1")
                        .contentType("application/json")
                        .content("{\"selfScore\":1,\"evidenceUrl\":\"https://minhchung.example/ho-so-01\"," +
                                "\"summary\":\"Đơn vị đã hoàn thành nội dung theo yêu cầu.\",\"expectedVersion\":0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks[0].status", is("SUBMITTED")));
        http.perform(post("/api/unit/tasks/{lineId}/submit", lineId).session(unit).with(csrf())
                        .header("Idempotency-Key", "submit-workflow-line-v1")
                        .contentType("application/json")
                        .content("{\"selfScore\":1,\"evidenceUrl\":\"https://minhchung.example/ho-so-01\"," +
                                "\"summary\":\"Đơn vị đã hoàn thành nội dung theo yêu cầu.\",\"expectedVersion\":0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks[0].revision", is(1)));

        http.perform(post("/api/assignments/current/start-review").session(superadmin).with(csrf())
                        .header("Idempotency-Key", "start-review-workflow-v1")
                        .contentType("application/json").content("{\"expectedVersion\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phase", is("ROUND_1")));

        MockHttpSession reviewer = loginAndChangePassword(
                "workflow.reviewer", TEMPORARY_PASSWORD, REVIEWER_PASSWORD
        );
        String queueResponse = http.perform(get("/api/reviewer/queue").session(reviewer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.criteria", hasSize(1)))
                .andExpect(jsonPath("$.criteria[0].expectedCases", is(1)))
                .andExpect(jsonPath("$.criteria[0].submittedCases", is(1)))
                .andExpect(jsonPath("$.criteria[0].completedCases", is(0)))
                .andExpect(jsonPath("$.cases", hasSize(1)))
                .andExpect(jsonPath("$.teamOverview.assignedCriteria", is(27)))
                .andExpect(jsonPath("$.teamOverview.expectedCases", is(1)))
                .andExpect(jsonPath("$.teamOverview.pendingCases", is(1)))
                .andExpect(jsonPath("$.teamOverview.members", hasSize(2)))
                .andExpect(jsonPath("$.teamOverview.members[0].teamMonitor", is(true)))
                .andReturn().getResponse().getContentAsString();
        http.perform(get("/api/admin/review-control").session(superadmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.expectedCases", is(1)))
                .andExpect(jsonPath("$.submittedCases", is(1)))
                .andExpect(jsonPath("$.completedCases", is(0)))
                .andExpect(jsonPath("$.canOpenExplanation", is(false)));
        http.perform(get("/api/admin/review-control/criteria/{groupId}/cases", firstGroupId)
                        .session(superadmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.groupId", is(firstGroupId)))
                .andExpect(jsonPath("$.cases", hasSize(1)))
                .andExpect(jsonPath("$.cases[0].organizationName", is("Đơn vị kiểm chứng luồng")))
                .andExpect(jsonPath("$.cases[0].evidenceUrl", is("https://minhchung.example/ho-so-01")))
                .andExpect(jsonPath("$.cases[0].assessorName", is("Người theo dõi Tổ")))
                .andExpect(jsonPath("$.cases[0].awardedScore").doesNotExist());
        MockHttpSession campaignAdmin = loginAndChangePassword(
                "workflow.approver", TEMPORARY_PASSWORD, APPROVER_PASSWORD
        );
        http.perform(get("/api/admin/review-control/criteria/{groupId}/cases", firstGroupId)
                        .session(campaignAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cases[0].evidenceUrl",
                        is("https://minhchung.example/ho-so-01")));
        http.perform(get("/api/admin/review-control/criteria/{groupId}/cases", firstGroupId)
                        .session(unit))
                .andExpect(status().isForbidden());
        String caseId = json.readTree(queueResponse).path("cases").get(0).path("id").asText();
        MockHttpSession outsider = loginAndChangePassword(
                "workflow.outsider", TEMPORARY_PASSWORD, "Permanent-Outsider-Password-2026"
        );
        http.perform(get("/api/reviewer/queue").session(outsider))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamOverview").doesNotExist())
                .andExpect(jsonPath("$.cases", hasSize(0)));
        http.perform(post("/api/reviewer/queue/{caseId}/round-one", caseId).session(outsider).with(csrf())
                        .header("Idempotency-Key", "outsider-review-attempt-v1")
                        .contentType("application/json")
                        .content("{\"awardedScore\":1,\"evidenceChecked\":true,\"reason\":\"\",\"expectedVersion\":0}"))
                .andExpect(status().isForbidden());
        http.perform(post("/api/reviewer/queue/{caseId}/return", caseId).session(reviewer).with(csrf())
                        .header("Idempotency-Key", "return-workflow-case-v1")
                        .contentType("application/json")
                        .content("{\"reason\":\"Cần bổ sung ảnh có thời gian và địa điểm.\",\"expectedVersion\":0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cases[0].status", is("WAITING_FOR_SUBMISSION")));
        http.perform(get("/api/unit/tasks").session(unit))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks[0].status", is("RETURNED")))
                .andExpect(jsonPath("$.tasks[0].returnReason", startsWith("Cần bổ sung")));
        http.perform(post("/api/unit/tasks/{lineId}/submit", lineId).session(unit).with(csrf())
                        .header("Idempotency-Key", "resubmit-workflow-line-v2")
                        .contentType("application/json")
                        .content("{\"selfScore\":1,\"evidenceUrl\":\"https://minhchung.example/ho-so-01-bo-sung\"," +
                                "\"summary\":\"Đã bổ sung ảnh có thời gian và địa điểm.\",\"expectedVersion\":3}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks[0].status", is("RESUBMITTED")))
                .andExpect(jsonPath("$.tasks[0].revision", is(2)));
        http.perform(post("/api/reviewer/queue/{caseId}/round-one", caseId).session(reviewer).with(csrf())
                        .header("Idempotency-Key", "review-workflow-case-v1")
                        .contentType("application/json")
                        .content("{\"awardedScore\":0.5,\"evidenceChecked\":true," +
                                "\"reason\":\"Minh chứng chỉ xác nhận một phần kết quả.\",\"expectedVersion\":2}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cases[0].status", is("COMPLETED")));
        http.perform(post("/api/reviewer/queue/{caseId}/round-one", caseId).session(reviewer).with(csrf())
                        .header("Idempotency-Key", "review-workflow-case-v1")
                        .contentType("application/json")
                        .content("{\"awardedScore\":0.5,\"evidenceChecked\":true," +
                                "\"reason\":\"Minh chứng chỉ xác nhận một phần kết quả.\",\"expectedVersion\":2}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cases[0].status", is("COMPLETED")));
        http.perform(get("/api/unit/tasks").session(unit))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks[0].roundOneScore").doesNotExist())
                .andExpect(jsonPath("$.tasks[0].roundOneReason").doesNotExist());
        http.perform(get("/api/admin/review-control").session(superadmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedCases", is(1)))
                .andExpect(jsonPath("$.reductionsWithoutReason", is(0)))
                .andExpect(jsonPath("$.canOpenExplanation", is(true)));
        http.perform(get("/api/admin/review-control/criteria/{groupId}/cases", firstGroupId)
                        .session(superadmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cases[0].evidenceUrl",
                        is("https://minhchung.example/ho-so-01-bo-sung")))
                .andExpect(jsonPath("$.cases[0].awardedScore", is(0.5)))
                .andExpect(jsonPath("$.cases[0].reason", startsWith("Minh chứng chỉ")))
                .andExpect(jsonPath("$.cases[0].decidedByName", is("Người theo dõi Tổ")))
                .andExpect(jsonPath("$.cases[0].roundOneScore", is(0.5)));

        http.perform(get("/api/assignments/current").session(superadmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.progress.reviewedTasks", is(1)))
                .andExpect(jsonPath("$.plans[0].lastReviewedBy", is("Người theo dõi Tổ")));

        http.perform(post("/api/assignments/current/open-explanation").session(superadmin).with(csrf())
                        .header("Idempotency-Key", "open-explanation-workflow-v1")
                        .contentType("application/json").content("{\"expectedVersion\":2}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phase", is("EXPLANATION")));
        http.perform(get("/api/unit/tasks").session(unit))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks[0].roundOneScore", is(0.5)))
                .andExpect(jsonPath("$.tasks[0].roundTwoScore").doesNotExist());
        http.perform(post("/api/unit/tasks/{lineId}/explanation", lineId).session(unit).with(csrf())
                        .header("Idempotency-Key", "explanation-workflow-v1")
                        .contentType("application/json")
                        .content("{\"body\":\"Đơn vị giải trình và đề nghị đối chiếu ảnh bổ sung.\"," +
                                "\"evidenceUrl\":\"https://minhchung.example/giai-trinh-01\",\"expectedRevision\":0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks[0].explanationRevision", is(1)));
        http.perform(post("/api/assignments/current/start-round-two").session(superadmin).with(csrf())
                        .header("Idempotency-Key", "start-round-two-workflow-v1")
                        .contentType("application/json").content("{\"expectedVersion\":3}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phase", is("ROUND_2")));
        http.perform(get("/api/reviewer/queue").session(reviewer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cases[0].roundNumber", is(2)))
                .andExpect(jsonPath("$.cases[0].explanationRevision", is(1)));
        http.perform(post("/api/reviewer/queue/{caseId}/round-two", caseId).session(reviewer).with(csrf())
                        .header("Idempotency-Key", "review-round-two-workflow-v1")
                        .contentType("application/json")
                        .content("{\"awardedScore\":0.75,\"evidenceChecked\":true," +
                                "\"reason\":\"Đã ghi nhận một phần giải trình bổ sung.\",\"expectedVersion\":4}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cases[0].status", is("COMPLETED")));
        http.perform(get("/api/admin/review-control/criteria/{groupId}/cases", firstGroupId)
                        .session(superadmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roundNumber", is(2)))
                .andExpect(jsonPath("$.cases[0].awardedScore", is(0.75)))
                .andExpect(jsonPath("$.cases[0].roundOneScore", is(0.5)))
                .andExpect(jsonPath("$.cases[0].roundTwoScore", is(0.75)))
                .andExpect(jsonPath("$.cases[0].explanationRevision", is(1)))
                .andExpect(jsonPath("$.cases[0].explanationEvidenceUrl",
                        is("https://minhchung.example/giai-trinh-01")));
        http.perform(get("/api/unit/tasks").session(unit))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks[0].roundOneScore", is(0.5)))
                .andExpect(jsonPath("$.tasks[0].roundTwoScore").doesNotExist());

        http.perform(post("/api/results/current/prepare").session(superadmin).with(csrf())
                        .header("Idempotency-Key", "prepare-result-workflow-v1")
                        .contentType("application/json").content("{\"expectedCampaignVersion\":4}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phase", is("FINAL_REVIEW")))
                .andExpect(jsonPath("$.status", is("PENDING_APPROVAL")))
                .andExpect(jsonPath("$.units", hasSize(1)));
        http.perform(post("/api/results/current/approve").session(superadmin).with(csrf())
                        .header("Idempotency-Key", "illegal-self-approval-v1")
                        .contentType("application/json").content("{\"expectedResultVersion\":1}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code", is("FOUR_EYES_REQUIRED")));
        http.perform(post("/api/results/current/approve").session(campaignAdmin).with(csrf())
                        .header("Idempotency-Key", "approve-result-workflow-v1")
                        .contentType("application/json").content("{\"expectedResultVersion\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")))
                .andExpect(jsonPath("$.approvedBy", is("Lãnh đạo phê duyệt")));
        http.perform(post("/api/results/current/publish").session(superadmin).with(csrf())
                        .header("Idempotency-Key", "publish-result-workflow-v1")
                        .contentType("application/json")
                        .content("{\"expectedResultVersion\":2,\"expectedCampaignVersion\":5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phase", is("PUBLISHED")))
                .andExpect(jsonPath("$.status", is("PUBLISHED")));
        http.perform(get("/api/unit/results/final").session(unit))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.published", is(true)))
                .andExpect(jsonPath("$.resultVersion", is(1)))
                .andExpect(jsonPath("$.organizationName", is("Đơn vị kiểm chứng luồng")))
                .andExpect(jsonPath("$.lines", hasSize(1)))
                .andExpect(jsonPath("$.lines[0].finalScore", is(0.75)));
        byte[] export = http.perform(get("/api/results/current/export").session(superadmin))
                .andExpect(status().isOk())
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertTrue(
                        result.getResponse().getContentType().contains("spreadsheetml")
                ))
                .andReturn().getResponse().getContentAsByteArray();
        org.junit.jupiter.api.Assertions.assertEquals('P', export[0]);
        org.junit.jupiter.api.Assertions.assertEquals('K', export[1]);
        Map<String, String> workbookParts = unzipXml(export);
        org.junit.jupiter.api.Assertions.assertTrue(workbookParts.keySet().containsAll(List.of(
                "[Content_Types].xml", "xl/workbook.xml", "xl/styles.xml",
                "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml", "xl/worksheets/sheet3.xml"
        )));
        org.junit.jupiter.api.Assertions.assertTrue(
                workbookParts.get("xl/workbook.xml").contains("Tổng hợp đơn vị")
        );
        org.junit.jupiter.api.Assertions.assertTrue(
                workbookParts.get("xl/worksheets/sheet2.xml").contains("https://minhchung.example/ho-so-01-bo-sung")
        );
        org.junit.jupiter.api.Assertions.assertTrue(
                workbookParts.get("xl/worksheets/sheet2.xml").contains("Người theo dõi Tổ")
        );
        org.junit.jupiter.api.Assertions.assertTrue(
                workbookParts.get("xl/worksheets/sheet3.xml").contains("SHA-256")
        );

        Integer auditCount = jdbc.queryForObject(
                "select count(*) from audit_record where action in " +
                        "('CONFIGURE_SCORECARD_ASSIGNMENT','RELEASE_ASSIGNMENT_SNAPSHOT','SUBMIT_SUBMISSION'," +
                        "'START_ROUND_ONE','RETURN_SUBMISSION','COMPLETE_ROUND_ONE','OPEN_EXPLANATION'," +
                        "'SUBMIT_EXPLANATION','START_ROUND_TWO','COMPLETE_ROUND_TWO','PREPARE_FINAL_RESULT'," +
                        "'APPROVE_FINAL_RESULT','PUBLISH_FINAL_RESULT')", Integer.class
        );
        org.junit.jupiter.api.Assertions.assertTrue(auditCount != null && auditCount >= 31);
    }

    private static Map<String, String> unzipXml(byte[] workbook) throws Exception {
        Map<String, String> parts = new HashMap<>();
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(workbook), StandardCharsets.UTF_8)) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if (!entry.isDirectory() && entry.getName().endsWith(".xml")) {
                    parts.put(entry.getName(), new String(zip.readAllBytes(), StandardCharsets.UTF_8));
                }
            }
        }
        return parts;
    }

    private void createAccount(MockHttpSession superadmin, String username, String displayName, String role,
                               String organizationId, String teamId, boolean teamMonitor) throws Exception {
        java.util.HashMap<String, Object> command = new java.util.HashMap<>();
        command.put("username", username);
        command.put("displayName", displayName);
        command.put("password", TEMPORARY_PASSWORD);
        command.put("role", role);
        if (organizationId != null) command.put("organizationId", organizationId);
        if (teamId != null) command.put("teamId", teamId);
        if (teamMonitor) command.put("teamMonitor", true);
        http.perform(post("/api/accounts").session(superadmin).with(csrf())
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
