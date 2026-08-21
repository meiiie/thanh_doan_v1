package vn.haiphong.campaign.access;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public final class SessionActorAuthenticationFilter extends OncePerRequestFilter {
    public static final String ACCOUNT_ID = "authenticatedAccountId";
    public static final String AUTHENTICATED_AT = "authenticatedAt";
    public static final String SESSION_EXPIRES_AT_HEADER = "X-Session-Expires-At";

    private final AccountRepository accounts;
    private final SessionCookies sessionCookies;
    private final Duration maximumLifetime;

    public SessionActorAuthenticationFilter(
            AccountRepository accounts,
            SessionCookies sessionCookies,
            @Value("${app.security.session.max-lifetime:12h}") Duration maximumLifetime
    ) {
        this.accounts = accounts;
        this.sessionCookies = sessionCookies;
        this.maximumLifetime = maximumLifetime;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        if (session != null
                && session.getAttribute(ACCOUNT_ID) instanceof String
                && absoluteLifetimeExpired(session)) {
            session.invalidate();
            sessionCookies.expire(response);
            session = null;
        }
        Object accountId = session == null ? null : session.getAttribute(ACCOUNT_ID);
        if (accountId instanceof String id) {
            AccountRepository.SessionAccount sessionAccount = accounts.sessionAccountById(id).orElse(null);
            if (sessionAccount != null && sessionAccount.passwordChangeRequired()
                    && !request.getRequestURI().startsWith("/api/auth/")) {
                response.setStatus(428);
                response.setCharacterEncoding("UTF-8");
                response.setContentType("application/problem+json");
                response.getWriter().write(
                        "{\"type\":\"about:blank\",\"title\":\"Cần đổi mật khẩu\",\"status\":428," +
                                "\"code\":\"PASSWORD_CHANGE_REQUIRED\"}"
                );
                return;
            }
            if (sessionAccount != null) {
                Actor actor = sessionAccount.actor();
                var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + actor.role().name()));
                var authentication = UsernamePasswordAuthenticationToken.authenticated(actor, "[SESSION]", authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
            response.setHeader(SESSION_EXPIRES_AT_HEADER, expiresAt(session).toString());
        }
        try {
            chain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private boolean absoluteLifetimeExpired(HttpSession session) {
        Object value = session.getAttribute(AUTHENTICATED_AT);
        if (!(value instanceof Long authenticatedAt)) return true;
        return Instant.ofEpochMilli(authenticatedAt).plus(maximumLifetime).isBefore(Instant.now());
    }

    private Instant expiresAt(HttpSession session) {
        Instant inactivityExpiry = Instant.now().plusSeconds(session.getMaxInactiveInterval());
        long authenticatedAt = (Long) session.getAttribute(AUTHENTICATED_AT);
        Instant absoluteExpiry = Instant.ofEpochMilli(authenticatedAt).plus(maximumLifetime);
        return inactivityExpiry.isBefore(absoluteExpiry) ? inactivityExpiry : absoluteExpiry;
    }
}
