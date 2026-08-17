package vn.haiphong.campaign.access;

import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
final class SessionCookies {
    private final boolean secure;

    SessionCookies(@Value("${server.servlet.session.cookie.secure:false}") boolean secure) {
        this.secure = secure;
    }

    void expire(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, expiredCookie("CAMPAIGN_SESSION", true).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, expiredCookie("XSRF-TOKEN", false).toString());
    }

    private ResponseCookie expiredCookie(String name, boolean httpOnly) {
        return ResponseCookie.from(name, "")
                .path("/")
                .httpOnly(httpOnly)
                .secure(secure)
                .sameSite("Strict")
                .maxAge(Duration.ZERO)
                .build();
    }
}
