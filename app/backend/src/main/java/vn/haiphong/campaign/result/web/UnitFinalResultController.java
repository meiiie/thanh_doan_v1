package vn.haiphong.campaign.result.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.haiphong.campaign.result.application.UnitFinalResultService;
import vn.haiphong.campaign.result.application.UnitFinalResultView;

@RestController
@RequestMapping("/api/unit/results/final")
public final class UnitFinalResultController {
    private final UnitFinalResultService results;

    public UnitFinalResultController(UnitFinalResultService results) {
        this.results = results;
    }

    @GetMapping
    UnitFinalResultView view() {
        return results.view();
    }
}
