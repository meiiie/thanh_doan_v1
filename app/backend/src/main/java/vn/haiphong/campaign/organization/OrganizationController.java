package vn.haiphong.campaign.organization;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/organization-directory")
public final class OrganizationController {
    private final OrganizationService organizations;

    public OrganizationController(OrganizationService organizations) {
        this.organizations = organizations;
    }

    @GetMapping
    OrganizationService.DirectoryView directory() {
        return organizations.directory();
    }

    @PostMapping("/organizations")
    OrganizationRepository.OrganizationView createOrganization(
            @RequestBody OrganizationService.CreateOrganization command
    ) {
        return organizations.createOrganization(command);
    }

    @PostMapping("/teams")
    OrganizationRepository.TeamView createTeam(@RequestBody OrganizationService.CreateTeam command) {
        return organizations.createTeam(command);
    }
}
