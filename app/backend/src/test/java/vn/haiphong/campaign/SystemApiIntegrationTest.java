package vn.haiphong.campaign;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import vn.haiphong.campaign.access.SessionActorAuthenticationFilter;

@SpringBootTest(properties = {
        "app.bootstrap.enabled=true",
        "app.bootstrap.username=superadmin",
        "app.bootstrap.password=Local-Only-Strong-Password-2026",
        "app.bootstrap.display-name=Quản trị hệ thống"
})
@AutoConfigureMockMvc
class SystemApiIntegrationTest {
    @Autowired MockMvc http;
    @Autowired JdbcTemplate jdbc;

    @Test
    void api_is_deny_by_default_and_login_creates_a_real_session() throws Exception {
        http.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().exists("X-Correlation-ID"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(jsonPath("$.code", is("AUTHENTICATION_REQUIRED")));

        http.perform(post("/api/auth/login").with(csrf())
                        .contentType("application/json")
                        .content("{\"username\":\"superadmin\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code", is("INVALID_CREDENTIALS")));

        http.perform(post("/api/auth/login").with(csrf())
                        .contentType("application/json")
                        .content("{\"username\":\"does-not-exist\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code", is("INVALID_CREDENTIALS")))
                .andExpect(jsonPath("$.detail", is("Tên đăng nhập hoặc mật khẩu không đúng.")));

        MockHttpSession session = login();
        http.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(header().exists(SessionActorAuthenticationFilter.SESSION_EXPIRES_AT_HEADER))
                .andExpect(jsonPath("$.displayName", is("Quản trị hệ thống")))
                .andExpect(jsonPath("$.role", is("SUPERADMIN")))
                .andExpect(jsonPath("$.passwordChangeRequired", is(false)));

        http.perform(post("/api/auth/logout").session(session).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(result -> assertExpiredCookies(result.getResponse().getHeaders("Set-Cookie")));

        http.perform(get("/api/auth/me").session(session))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void absolute_session_lifetime_is_enforced_server_side() throws Exception {
        MockHttpSession session = login();
        session.setAttribute(
                SessionActorAuthenticationFilter.AUTHENTICATED_AT,
                System.currentTimeMillis() - java.time.Duration.ofHours(13).toMillis()
        );

        http.perform(get("/api/auth/me").session(session))
                .andExpect(status().isUnauthorized())
                .andExpect(result -> assertExpiredCookies(result.getResponse().getHeaders("Set-Cookie")));
    }

    @Test
    void source_seed_contains_only_customer_backed_catalog_data() throws Exception {
        MockHttpSession session = login();
        http.perform(get("/api/scorecards/current").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source.sha256", is("8D29B213907C00D5314C5D9B5FD27E4F09019F013B6A2D5A3DADE44361531653")))
                .andExpect(jsonPath("$.policy.groupCount", is(27)))
                .andExpect(jsonPath("$.policy.lineCount", is(55)))
                .andExpect(jsonPath("$.policy.coreMaximum", is(83.0)))
                .andExpect(jsonPath("$.policy.bonusCap", is(25.0)))
                .andExpect(jsonPath("$.unitGroups", hasSize(4)))
                .andExpect(content().string(not(containsString("example.org"))));

        http.perform(get("/api/campaigns/current/status").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.documentedUnits", is(134)))
                .andExpect(jsonPath("$.submissions", is(0)))
                .andExpect(jsonPath("$.reviewCases", is(0)))
                .andExpect(jsonPath("$.finalResults", is(0)));
    }

    @Test
    void superadmin_can_create_a_real_campaign_admin_account_with_audited_defaults() throws Exception {
        jdbc.update("delete from audit_record where action = 'CREATE_ACCOUNT'");
        jdbc.update("delete from account_capability where account_id in (select id from app_account where username = 'admin.haiphong')");
        jdbc.update("delete from account_campaign_scope where account_id in (select id from app_account where username = 'admin.haiphong')");
        jdbc.update("delete from app_account where username = 'admin.haiphong'");
        MockHttpSession session = login();

        http.perform(post("/api/accounts").session(session).with(csrf())
                        .contentType("application/json")
                        .content("""
                                {
                                  "username":"admin.haiphong",
                                  "displayName":"Admin chiến dịch Hải Phòng",
                                  "password":"Temporary-Password-2026",
                                  "role":"CAMPAIGN_ADMIN"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("CAMPAIGN_ADMIN")))
                .andExpect(jsonPath("$.passwordChangeRequired", is(true)))
                .andExpect(jsonPath("$.campaignIds[0]", is("campaign-summer-2026")));

        Integer auditCount = jdbc.queryForObject(
                "select count(*) from audit_record where action = 'CREATE_ACCOUNT'", Integer.class
        );
        org.junit.jupiter.api.Assertions.assertEquals(1, auditCount);
    }

    @Test
    void a_new_account_must_change_its_password_before_reading_business_data() throws Exception {
        removeAccount("first.login.admin");
        MockHttpSession superadmin = login();
        http.perform(post("/api/accounts").session(superadmin).with(csrf())
                        .contentType("application/json")
                        .content("""
                                {
                                  "username":"first.login.admin",
                                  "displayName":"Admin kiá»ƒm tra Ä‘á»•i máº­t kháº©u",
                                  "password":"Temporary-Password-2026",
                                  "role":"CAMPAIGN_ADMIN"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passwordChangeRequired", is(true)));

        MockHttpSession accountSession = (MockHttpSession) http.perform(post("/api/auth/login").with(csrf())
                        .contentType("application/json")
                        .content("{\"username\":\"first.login.admin\",\"password\":\"Temporary-Password-2026\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passwordChangeRequired", is(true)))
                .andReturn().getRequest().getSession(false);

        http.perform(get("/api/scorecards/current").session(accountSession))
                .andExpect(status().is(428))
                .andExpect(jsonPath("$.code", is("PASSWORD_CHANGE_REQUIRED")));

        http.perform(post("/api/auth/change-password").session(accountSession).with(csrf())
                        .contentType("application/json")
                        .content("{\"currentPassword\":\"Temporary-Password-2026\",\"newPassword\":\"Permanent-Password-2026\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passwordChangeRequired", is(false)));

        http.perform(get("/api/scorecards/current").session(accountSession))
                .andExpect(status().isOk());
        removeAccount("first.login.admin");
    }

    @Test
    void superadmin_builds_the_real_directory_before_assigning_unit_or_reviewer_accounts() throws Exception {
        removeAccount("real.unit.user");
        removeAccount("real.reviewer.user");
        jdbc.update("delete from audit_record where aggregate_id in " +
                "(select id from organization where code = 'DHTEST') or aggregate_id in " +
                "(select id from review_team where code = 'TO01')");
        jdbc.update("delete from organization where code = 'DHTEST'");
        jdbc.update("delete from review_team where code = 'TO01'");
        MockHttpSession session = login();

        http.perform(get("/api/organization-directory").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unitGroups", hasSize(4)))
                .andExpect(jsonPath("$.organizations", hasSize(0)))
                .andExpect(jsonPath("$.teams", hasSize(0)));

        http.perform(post("/api/accounts").session(session).with(csrf())
                        .contentType("application/json")
                        .content("""
                                {
                                  "username":"real.unit.user",
                                  "displayName":"TÃ i khoáº£n Ä‘Æ¡n vá»‹",
                                  "password":"Temporary-Password-2026",
                                  "role":"UNIT_MEMBER",
                                  "organizationId":"organization-does-not-exist"
                                }
                                """))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code", is("ORGANIZATION_UNKNOWN")));

        http.perform(post("/api/organization-directory/organizations").session(session).with(csrf())
                        .contentType("application/json")
                        .content("{\"code\":\"DHTEST\",\"name\":\"ÄÆ¡n vá»‹ kiá»ƒm chá»©ng\",\"unitGroupCode\":\"UNIVERSITY\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unitGroupCode", is("UNIVERSITY")));

        http.perform(post("/api/organization-directory/teams").session(session).with(csrf())
                        .contentType("application/json")
                        .content("{\"code\":\"TO01\",\"name\":\"Tá»• kiá»ƒm chá»©ng\"}"))
                .andExpect(status().isOk());

        String organizationId = jdbc.queryForObject(
                "select id from organization where code = 'DHTEST'", String.class
        );
        String teamId = jdbc.queryForObject("select id from review_team where code = 'TO01'", String.class);

        http.perform(post("/api/accounts").session(session).with(csrf())
                        .contentType("application/json")
                        .content("""
                                {
                                  "username":"real.unit.user",
                                  "displayName":"TÃ i khoáº£n Ä‘Æ¡n vá»‹",
                                  "password":"Temporary-Password-2026",
                                  "role":"UNIT_MEMBER",
                                  "organizationId":"%s"
                                }
                                """.formatted(organizationId)))
                .andExpect(status().isOk());

        http.perform(post("/api/accounts").session(session).with(csrf())
                        .contentType("application/json")
                        .content("""
                                {
                                  "username":"real.reviewer.user",
                                  "displayName":"CÃ¡n bá»™ tháº©m Ä‘á»‹nh",
                                  "password":"Temporary-Password-2026",
                                  "role":"REVIEWER",
                                  "teamId":"%s"
                                }
                                """.formatted(teamId)))
                .andExpect(status().isOk());

        removeAccount("real.unit.user");
        removeAccount("real.reviewer.user");
        jdbc.update("delete from audit_record where aggregate_id in (?, ?)", organizationId, teamId);
        jdbc.update("delete from organization where id = ?", organizationId);
        jdbc.update("delete from review_team where id = ?", teamId);
    }

    private MockHttpSession login() throws Exception {
        return (MockHttpSession) http.perform(post("/api/auth/login").with(csrf())
                        .contentType("application/json")
                        .content("{\"username\":\"superadmin\",\"password\":\"Local-Only-Strong-Password-2026\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("SUPERADMIN")))
                .andReturn().getRequest().getSession(false);
    }

    private static void assertExpiredCookies(java.util.Collection<String> cookies) {
        org.junit.jupiter.api.Assertions.assertTrue(
                cookies.stream().anyMatch(value -> value.startsWith("CAMPAIGN_SESSION=;"))
        );
        org.junit.jupiter.api.Assertions.assertTrue(
                cookies.stream().anyMatch(value -> value.startsWith("XSRF-TOKEN=;"))
        );
    }

    private void removeAccount(String username) {
        jdbc.update("delete from audit_record where aggregate_type = 'Account' and aggregate_id in " +
                "(select id from app_account where username = ?)", username);
        jdbc.update("delete from authentication_event where account_id in " +
                "(select id from app_account where username = ?)", username);
        jdbc.update("delete from account_capability where account_id in " +
                "(select id from app_account where username = ?)", username);
        jdbc.update("delete from account_campaign_scope where account_id in " +
                "(select id from app_account where username = ?)", username);
        jdbc.update("delete from app_account where username = ?", username);
    }
}
