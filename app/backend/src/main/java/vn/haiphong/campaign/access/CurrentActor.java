package vn.haiphong.campaign.access;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public final class CurrentActor {
    public Actor required() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken
                || !(authentication.getPrincipal() instanceof Actor actor)) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException(
                    "Actor is required"
            );
        }
        return actor;
    }
}
