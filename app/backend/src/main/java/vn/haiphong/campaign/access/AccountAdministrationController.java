package vn.haiphong.campaign.access;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/accounts")
public final class AccountAdministrationController {
    private final AccountAdministrationService service;

    public AccountAdministrationController(AccountAdministrationService service) {
        this.service = service;
    }

    @GetMapping
    List<AccountRepository.AccountView> list() {
        return service.list();
    }

    @PostMapping
    AccountRepository.AccountView create(@RequestBody AccountAdministrationService.CreateAccount command) {
        return service.create(command);
    }
}
