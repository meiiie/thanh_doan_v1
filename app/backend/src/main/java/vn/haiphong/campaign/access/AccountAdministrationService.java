package vn.haiphong.campaign.access;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.haiphong.campaign.lifecycle.domain.DomainRuleViolation;

@Service
public class AccountAdministrationService {
    private static final Pattern USERNAME = Pattern.compile("[a-z0-9][a-z0-9._-]{2,39}");
    private static final String CAMPAIGN_ID = "campaign-summer-2026";

    private final AccountRepository accounts;
    private final CurrentActor currentActor;
    private final PasswordEncoder passwords;
    private final Clock clock;

    public AccountAdministrationService(
            AccountRepository accounts, CurrentActor currentActor, PasswordEncoder passwords, Clock clock
    ) {
        this.accounts = accounts;
        this.currentActor = currentActor;
        this.passwords = passwords;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<AccountRepository.AccountView> list() {
        requireSuperadmin();
        return accounts.all();
    }

    @Transactional
    public AccountRepository.AccountView create(CreateAccount command) {
        Actor creator = requireSuperadmin();
        String username = command.username() == null ? "" : command.username().trim().toLowerCase();
        String displayName = command.displayName() == null ? "" : command.displayName().trim();
        if (!USERNAME.matcher(username).matches()) {
            throw new DomainRuleViolation("USERNAME_INVALID", "Tên đăng nhập cần 3–40 ký tự: chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang.");
        }
        if (displayName.length() < 2 || displayName.length() > 240) {
            throw new DomainRuleViolation("DISPLAY_NAME_INVALID", "Tên hiển thị cần từ 2 đến 240 ký tự.");
        }
        if (command.password() == null || command.password().length() < 15 || command.password().length() > 72) {
            throw new DomainRuleViolation(
                    "PASSWORD_LENGTH_INVALID",
                    "Mật khẩu khởi tạo phải có từ 15 đến 72 ký tự."
            );
        }
        if (command.role() == null) {
            throw new DomainRuleViolation("ROLE_INVALID", "Vai trò tài khoản không hợp lệ.");
        }
        if (accounts.usernameExists(username)) {
            throw new DomainRuleViolation("USERNAME_EXISTS", "Tên đăng nhập đã tồn tại.");
        }
        if (command.role() == ActorRole.UNIT_MEMBER && blank(command.organizationId())) {
            throw new DomainRuleViolation("ORGANIZATION_REQUIRED", "Tài khoản đơn vị phải gắn với mã đơn vị.");
        }
        if (command.role() == ActorRole.REVIEWER && blank(command.teamId())) {
            throw new DomainRuleViolation("TEAM_REQUIRED", "Tài khoản thẩm định phải gắn với mã tổ.");
        }
        if (command.role() == ActorRole.UNIT_MEMBER && !accounts.organizationExists(command.organizationId())) {
            throw new DomainRuleViolation("ORGANIZATION_UNKNOWN", "Đơn vị chưa tồn tại hoặc đã bị khóa.");
        }
        if (command.role() == ActorRole.REVIEWER && !accounts.teamExists(command.teamId())) {
            throw new DomainRuleViolation("TEAM_UNKNOWN", "Tổ theo dõi chưa tồn tại hoặc đã bị khóa.");
        }

        String id = "account-" + UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now(clock);
        Set<String> campaignIds = command.role() == ActorRole.SUPERADMIN ? Set.of() : Set.of(CAMPAIGN_ID);
        Set<String> capabilities = defaultCapabilities(command.role());
        accounts.insert(
                id, username, displayName, passwords.encode(command.password()), command.role(),
                command.organizationId(), command.teamId(), true, now, creator.id(), campaignIds, capabilities
        );
        accounts.accountCreatedAudit(now, creator.id(), id);
        return accounts.all().stream().filter(account -> account.id().equals(id)).findFirst().orElseThrow();
    }

    private Actor requireSuperadmin() {
        Actor actor = currentActor.required();
        if (actor.role() != ActorRole.SUPERADMIN) {
            throw new AccessDeniedException("Account administration requires Superadmin");
        }
        return actor;
    }

    private static Set<String> defaultCapabilities(ActorRole role) {
        return switch (role) {
            case SUPERADMIN -> Set.of();
            case CAMPAIGN_ADMIN -> Set.of(
                    "scorecard.release", "submission.return", "round1.start", "round1.publish",
                    "round2.start", "result.prepare", "result.approve", "campaign.publish"
            );
            case REVIEWER -> Set.of("review.round1", "review.round2");
            case UNIT_MEMBER -> Set.of("submission.submit", "explanation.submit");
        };
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }

    public record CreateAccount(
            String username,
            String displayName,
            String password,
            ActorRole role,
            String organizationId,
            String teamId
    ) {}
}
