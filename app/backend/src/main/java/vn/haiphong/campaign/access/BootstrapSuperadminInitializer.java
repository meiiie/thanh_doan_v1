package vn.haiphong.campaign.access;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class BootstrapSuperadminInitializer implements ApplicationRunner {
    private final AccountRepository accounts;
    private final PasswordEncoder passwords;
    private final Clock clock;
    private final boolean enabled;
    private final String username;
    private final String password;
    private final String displayName;

    public BootstrapSuperadminInitializer(
            AccountRepository accounts,
            PasswordEncoder passwords,
            Clock clock,
            @Value("${app.bootstrap.enabled:false}") boolean enabled,
            @Value("${app.bootstrap.username:superadmin}") String username,
            @Value("${app.bootstrap.password:}") String password,
            @Value("${app.bootstrap.display-name:Quản trị hệ thống}") String displayName
    ) {
        this.accounts = accounts;
        this.passwords = passwords;
        this.clock = clock;
        this.enabled = enabled;
        this.username = username;
        this.password = password;
        this.displayName = displayName;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled) return;
        if (accounts.usernameExists(username)) return;
        if (password == null || password.isBlank()) {
            throw new IllegalStateException("Bootstrap is enabled but APP_BOOTSTRAP_PASSWORD is empty");
        }
        if (password.length() < 15 || password.length() > 72) {
            throw new IllegalStateException("APP_BOOTSTRAP_PASSWORD must contain 15 to 72 characters");
        }
        accounts.insert(
                "account-" + UUID.randomUUID(), username.trim(), displayName.trim(), passwords.encode(password),
                ActorRole.SUPERADMIN, null, null, false, OffsetDateTime.now(clock), null, Set.of(), Set.of()
        );
    }
}
