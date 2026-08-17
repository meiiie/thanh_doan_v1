package vn.haiphong.campaign.campaign.application;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.haiphong.campaign.access.CurrentActor;

@Service
public class CampaignStatusService {
    private static final String CAMPAIGN_ID = "campaign-summer-2026";
    private final JdbcTemplate jdbc;
    private final CurrentActor currentActor;

    public CampaignStatusService(JdbcTemplate jdbc, CurrentActor currentActor) {
        this.jdbc = jdbc;
        this.currentActor = currentActor;
    }

    @Transactional(readOnly = true)
    public CampaignStatusView current() {
        currentActor.required();
        Header header = jdbc.queryForObject(
                "select c.id, c.name, c.phase, c.version, sv.status scorecard_status " +
                        "from campaign c join scorecard_version sv on sv.id = c.scorecard_version_id where c.id = ?",
                (rs, row) -> new Header(
                        rs.getString("id"), rs.getString("name"), rs.getString("phase"),
                        rs.getInt("version"), rs.getString("scorecard_status")
                ),
                CAMPAIGN_ID
        );
        if (header == null) throw new IllegalStateException("Campaign source seed is missing");
        int groups = count("select count(*) from scorecard_group where scorecard_version_id = 'scorecard-dhcd-v1'");
        int lines = count("select count(*) from scorecard_line where scorecard_version_id = 'scorecard-dhcd-v1'");
        int unitGroups = count("select count(*) from unit_group");
        int documentedUnits = count("select coalesce(sum(documented_unit_count), 0) from unit_group");
        int activeAccounts = count("select count(*) from app_account where enabled = true");
        int submissions = count("select count(*) from submission where campaign_id = 'campaign-summer-2026'");
        int reviewCases = count("select count(*) from review_case");
        int finalResults = count("select count(*) from final_result where campaign_id = 'campaign-summer-2026'");

        return new CampaignStatusView(
                header.id(), header.name(), header.phase(), header.version(), header.scorecardStatus(),
                groups, lines, unitGroups, documentedUnits, activeAccounts, submissions, reviewCases, finalResults,
                List.of(
                        new CampaignStatusView.ReadinessItem(
                                "SOURCE_VERIFIED", "Dữ liệu nguồn", groups == 27 && lines == 55,
                                groups + " hạng mục · " + lines + " dòng chấm · SHA-256 đã lưu"
                        ),
                        new CampaignStatusView.ReadinessItem(
                                "IDENTITIES", "Tài khoản vận hành", activeAccounts > 1,
                                activeAccounts > 1 ? activeAccounts + " tài khoản đang hoạt động" : "Mới có tài khoản bootstrap; Superadmin cần tạo tài khoản thật"
                        ),
                        new CampaignStatusView.ReadinessItem(
                                "ASSIGNMENTS", "Đơn vị và phân công", submissions > 0 || reviewCases > 0,
                                submissions > 0 || reviewCases > 0 ? "Đã có dữ liệu công việc" : "Chưa có đơn vị, hồ sơ hoặc phân công thật; không tạo dữ liệu giả"
                        )
                )
        );
    }

    private int count(String sql) {
        Integer value = jdbc.queryForObject(sql, Integer.class);
        return value == null ? 0 : value;
    }

    private record Header(String id, String name, String phase, int version, String scorecardStatus) {}
}
