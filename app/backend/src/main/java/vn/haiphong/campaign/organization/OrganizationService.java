package vn.haiphong.campaign.organization;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.haiphong.campaign.access.Actor;
import vn.haiphong.campaign.access.ActorRole;
import vn.haiphong.campaign.access.CurrentActor;
import vn.haiphong.campaign.lifecycle.domain.DomainRuleViolation;

@Service
public class OrganizationService {
    private static final String CAMPAIGN_ID = "campaign-summer-2026";
    private static final Pattern CODE = Pattern.compile("[A-Z0-9][A-Z0-9._-]{1,39}");
    private static final Pattern SHA256 = Pattern.compile("[a-f0-9]{64}");

    private final OrganizationRepository organizations;
    private final CurrentActor currentActor;
    private final Clock clock;

    public OrganizationService(OrganizationRepository organizations, CurrentActor currentActor, Clock clock) {
        this.organizations = organizations;
        this.currentActor = currentActor;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public DirectoryView directory() {
        requireSuperadmin();
        return new DirectoryView(
                organizations.unitGroups(), organizations.organizations(), organizations.teams(CAMPAIGN_ID)
        );
    }

    @Transactional
    public OrganizationRepository.OrganizationView createOrganization(CreateOrganization command) {
        Actor actor = requireSuperadmin();
        String code = normalizeCode(command.code());
        String name = normalizeName(command.name());
        String unitGroupCode = normalizeCode(command.unitGroupCode());
        if (!organizations.unitGroupExists(unitGroupCode)) {
            throw new DomainRuleViolation("UNIT_GROUP_UNKNOWN", "Khối đơn vị không tồn tại trong dữ liệu nguồn.");
        }
        if (organizations.organizationCodeExists(code)) {
            throw new DomainRuleViolation("ORGANIZATION_CODE_EXISTS", "Mã đơn vị đã tồn tại.");
        }
        String id = "organization-" + UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now(clock);
        SourceReference source = source(command.sourceFileName(), command.sourceSha256(),
                command.sourceSheetName(), command.sourceRow());
        organizations.insertOrganization(
                id, code, name, unitGroupCode, now, actor.id(),
                source.fileName(), source.sha256(), source.sheetName(), source.row()
        );
        organizations.createdAudit(now, actor.id(), "CREATE_ORGANIZATION", "Organization", id);
        return organizations.organizations().stream().filter(item -> item.id().equals(id)).findFirst().orElseThrow();
    }

    @Transactional
    public OrganizationRepository.TeamView createTeam(CreateTeam command) {
        Actor actor = requireSuperadmin();
        String code = normalizeCode(command.code());
        String name = normalizeName(command.name());
        if (organizations.teamCodeExists(CAMPAIGN_ID, code)) {
            throw new DomainRuleViolation("TEAM_CODE_EXISTS", "Mã tổ theo dõi đã tồn tại.");
        }
        String id = "review-team-" + UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now(clock);
        SourceReference source = source(command.sourceFileName(), command.sourceSha256(),
                command.sourceSheetName(), command.sourceRow());
        organizations.insertTeam(
                id, CAMPAIGN_ID, code, name, now, actor.id(),
                source.fileName(), source.sha256(), source.sheetName(), source.row()
        );
        organizations.createdAudit(now, actor.id(), "CREATE_REVIEW_TEAM", "ReviewTeam", id);
        return organizations.teams(CAMPAIGN_ID).stream().filter(item -> item.id().equals(id)).findFirst().orElseThrow();
    }

    private Actor requireSuperadmin() {
        Actor actor = currentActor.required();
        if (actor.role() != ActorRole.SUPERADMIN) {
            throw new AccessDeniedException("Organization directory requires Superadmin");
        }
        return actor;
    }

    private static String normalizeCode(String value) {
        String code = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!CODE.matcher(code).matches()) {
            throw new DomainRuleViolation("CODE_INVALID", "Mã cần 2–40 ký tự: chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.");
        }
        return code;
    }

    private static String normalizeName(String value) {
        String name = value == null ? "" : value.trim();
        if (name.length() < 2 || name.length() > 240) {
            throw new DomainRuleViolation("NAME_INVALID", "Tên cần từ 2 đến 240 ký tự.");
        }
        return name;
    }

    private static SourceReference source(String fileName, String sha256, String sheetName, Integer row) {
        boolean empty = blank(fileName) && blank(sha256) && blank(sheetName) && row == null;
        if (empty) return new SourceReference(null, null, null, null);
        String normalizedFileName = fileName == null ? "" : fileName.trim();
        String normalizedSha256 = sha256 == null ? "" : sha256.trim().toLowerCase(Locale.ROOT);
        String normalizedSheetName = sheetName == null ? "" : sheetName.trim();
        if (normalizedFileName.isEmpty() || normalizedFileName.length() > 240 ||
                !SHA256.matcher(normalizedSha256).matches() ||
                normalizedSheetName.isEmpty() || normalizedSheetName.length() > 120 ||
                row == null || row < 1) {
            throw new DomainRuleViolation(
                    "SOURCE_REFERENCE_INVALID",
                    "Nguồn cần đủ tên tệp, SHA-256, tên sheet và số dòng dương."
            );
        }
        return new SourceReference(normalizedFileName, normalizedSha256, normalizedSheetName, row);
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }

    public record DirectoryView(
            List<OrganizationRepository.UnitGroupView> unitGroups,
            List<OrganizationRepository.OrganizationView> organizations,
            List<OrganizationRepository.TeamView> teams
    ) {}
    public record CreateOrganization(
            String code, String name, String unitGroupCode,
            String sourceFileName, String sourceSha256, String sourceSheetName, Integer sourceRow
    ) {}
    public record CreateTeam(
            String code, String name,
            String sourceFileName, String sourceSha256, String sourceSheetName, Integer sourceRow
    ) {}
    private record SourceReference(String fileName, String sha256, String sheetName, Integer row) {}
}
