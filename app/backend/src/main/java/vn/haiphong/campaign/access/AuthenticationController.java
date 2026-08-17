package vn.haiphong.campaign.access;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public final class AuthenticationController {
    private final AuthenticationService authentication;
    private final SessionCookies sessionCookies;

    public AuthenticationController(AuthenticationService authentication, SessionCookies sessionCookies) {
        this.authentication = authentication;
        this.sessionCookies = sessionCookies;
    }

    @GetMapping("/csrf")
    CsrfView csrf(CsrfToken token) {
        return new CsrfView(token.getToken());
    }

    @PostMapping("/login")
    SessionView login(@RequestBody LoginCommand command, HttpServletRequest request) {
        return SessionView.from(authentication.login(command.username(), command.password(), request));
    }

    @GetMapping("/me")
    SessionView me() {
        return SessionView.from(authentication.me());
    }

    @PostMapping("/change-password")
    SessionView changePassword(@RequestBody ChangePasswordCommand command) {
        return SessionView.from(authentication.changePassword(command.currentPassword(), command.newPassword()));
    }

    @PostMapping("/logout")
    void logout(HttpServletRequest request, HttpServletResponse response) {
        authentication.logout(request);
        sessionCookies.expire(response);
    }

    public record LoginCommand(String username, String password) {}
    public record ChangePasswordCommand(String currentPassword, String newPassword) {}
    public record CsrfView(String token) {}

    public record SessionView(
            String id,
            String displayName,
            String role,
            List<String> campaignIds,
            List<String> capabilities,
            String organizationId,
            String teamId,
            boolean passwordChangeRequired
    ) {
        static SessionView from(AuthenticationService.SessionAccount session) {
            Actor actor = session.actor();
            return new SessionView(
                    actor.id(), actor.displayName(), actor.role().name(),
                    actor.campaignIds().stream().sorted().toList(),
                    actor.capabilities().stream().sorted().toList(),
                    actor.organizationId(), actor.teamId(), session.passwordChangeRequired()
            );
        }
    }
}
