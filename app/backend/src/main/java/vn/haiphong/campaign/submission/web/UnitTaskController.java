package vn.haiphong.campaign.submission.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import vn.haiphong.campaign.submission.application.UnitTaskService;
import vn.haiphong.campaign.submission.application.UnitTaskView;

@RestController
@RequestMapping("/api/unit/tasks")
public final class UnitTaskController {
    private final UnitTaskService tasks;

    public UnitTaskController(UnitTaskService tasks) {
        this.tasks = tasks;
    }

    @GetMapping
    UnitTaskView view() {
        return tasks.view();
    }

    @PutMapping("/{lineId}/draft")
    UnitTaskView saveDraft(@PathVariable String lineId, @RequestBody UnitTaskService.SaveTask command) {
        return tasks.saveDraft(lineId, command);
    }

    @PostMapping("/{lineId}/submit")
    UnitTaskView submit(
            @PathVariable String lineId,
            @RequestBody UnitTaskService.SaveTask command,
            @RequestHeader("Idempotency-Key") String idempotencyKey
    ) {
        return tasks.submit(lineId, command, idempotencyKey);
    }

    @PostMapping("/{lineId}/explanation")
    UnitTaskView submitExplanation(
            @PathVariable String lineId,
            @RequestBody UnitTaskService.Explanation command,
            @RequestHeader("Idempotency-Key") String idempotencyKey
    ) {
        return tasks.submitExplanation(lineId, command, idempotencyKey);
    }
}
