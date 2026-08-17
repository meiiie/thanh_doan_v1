package vn.haiphong.campaign.access;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.haiphong.campaign.lifecycle.domain.DomainRuleViolation;

@Service
public class AuthenticationService {
    private final AccountRepository accounts;
    private final PasswordEncoder passwords;
    private final CurrentActor currentActor;
    private final Clock clock;
    private final String dummyPasswordHash;

    public AuthenticationService(
            AccountRepository accounts, PasswordEncoder passwords, CurrentActor currentActor, Clock clock
    ) {
        this.accounts = accounts;
        this.passwords = passwords;
        this.currentActor = currentActor;
        this.clock = clock;
        this.dummyPasswordHash = passwords.encode(UUID.randomUUID().toString());
    }

    @Transactional
    public SessionAccount login(String username, String password, HttpServletRequest request) {
        String normalized = normalizeUsername(username);
        AccountRepository.Credentials credentials = accounts.credentialsByUsername(normalized).orElse(null);
        String candidate = boundedPassword(password);
        String storedHash = credentials == null ? dummyPasswordHash : credentials.passwordHash();
        boolean passwordMatches = passwords.matches(candidate, storedHash);
        if (credentials == null || !credentials.enabled() || !passwordMatches || candidate.isEmpty()) {
            accounts.authenticationEvent(now(), credentials == null ? null : credentials.id(), normalized, "LOGIN", "DENIED");
            throw new BadCredentialsException("Invalid credentials");
        }
        HttpSession previous = request.getSession(false);
        if (previous != null) previous.invalidate();
        HttpSession session = request.getSession(true);
        session.setAttribute(SessionActorAuthenticationFilter.ACCOUNT_ID, credentials.id());
        session.setAttribute(SessionActorAuthenticationFilter.AUTHENTICATED_AT, clock.millis());
        accounts.authenticationEvent(now(), credentials.id(), credentials.username(), "LOGIN", "SUCCEEDED");
        return new SessionAccount(accounts.actorById(credentials.id()).orElseThrow(), credentials.passwordChangeRequired());
    }

    @Transactional
    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return;
        Object accountId = session.getAttribute(SessionActorAuthenticationFilter.ACCOUNT_ID);
        if (accountId instanceof String id) {
            accounts.credentialsById(id).ifPresent(credentials ->
                    accounts.authenticationEvent(
                            now(), credentials.id(), credentials.username(), "LOGOUT", "SUCCEEDED"
                    )
            );
        }
        session.invalidate();
    }

    @Transactional(readOnly = true)
    public SessionAccount me() {
        Actor actor = currentActor.required();
        AccountRepository.Credentials credentials = accounts.credentialsById(actor.id()).orElseThrow();
        return new SessionAccount(actor, credentials.passwordChangeRequired());
    }

    @Transactional
    public SessionAccount changePassword(String currentPassword, String newPassword) {
        Actor actor = currentActor.required();
        AccountRepository.Credentials credentials = accounts.credentialsById(actor.id()).orElseThrow();
        if (!passwords.matches(currentPassword == null ? "" : currentPassword, credentials.passwordHash())) {
            accounts.authenticationEvent(now(), actor.id(), credentials.username(), "PASSWORD_CHANGE", "DENIED");
            throw new BadCredentialsException("Invalid current password");
        }
        if (newPassword == null || newPassword.length() < 15 || newPassword.length() > 72) {
            throw new DomainRuleViolation(
                    "PASSWORD_LENGTH_INVALID",
                    "Mật khẩu mới phải có từ 15 đến 72 ký tự."
            );
        }
        if (passwords.matches(newPassword, credentials.passwordHash())) {
            throw new DomainRuleViolation("PASSWORD_UNCHANGED", "Mật khẩu mới phải khác mật khẩu hiện tại.");
        }
        accounts.changePassword(actor.id(), passwords.encode(newPassword));
        accounts.authenticationEvent(now(), actor.id(), credentials.username(), "PASSWORD_CHANGE", "SUCCEEDED");
        return new SessionAccount(actor, false);
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(clock);
    }

    private static String normalizeUsername(String username) {
        String normalized = username == null ? "" : username.trim();
        return normalized.length() <= 120 ? normalized : normalized.substring(0, 120);
    }

    private static String boundedPassword(String password) {
        return password == null || password.length() > 72 ? "" : password;
    }

    public record SessionAccount(Actor actor, boolean passwordChangeRequired) {}
}
