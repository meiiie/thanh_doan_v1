package vn.haiphong.campaign.assignment.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import vn.haiphong.campaign.assignment.application.AssignmentService;
import vn.haiphong.campaign.assignment.application.AssignmentWorkbenchView;

@RestController
@RequestMapping("/api/assignments/current")
public final class AssignmentController {
    private final AssignmentService assignments;

    public AssignmentController(AssignmentService assignments) {
        this.assignments = assignments;
    }

    @GetMapping
    AssignmentWorkbenchView view() {
        return assignments.view();
    }

    @PutMapping("/groups/{groupId}")
    AssignmentWorkbenchView save(@PathVariable String groupId,
                                  @RequestBody AssignmentService.SaveAssignment command) {
        return assignments.save(groupId, command);
    }

    @PutMapping("/bulk")
    AssignmentWorkbenchView saveBulk(@RequestBody AssignmentService.BulkAssignment command) {
        return assignments.saveBulk(command);
    }

    @PostMapping("/release")
    AssignmentWorkbenchView release(
            @RequestBody AssignmentService.VersionCommand command,
            @RequestHeader("Idempotency-Key") String idempotencyKey
    ) {
        return assignments.release(command, idempotencyKey);
    }

    @PostMapping("/start-review")
    AssignmentWorkbenchView startReview(
            @RequestBody AssignmentService.VersionCommand command,
            @RequestHeader("Idempotency-Key") String idempotencyKey
    ) {
        return assignments.startReview(command, idempotencyKey);
    }

    @PostMapping("/publish-round-one")
    AssignmentWorkbenchView publishRoundOne(
            @RequestBody AssignmentService.VersionCommand command,
            @RequestHeader("Idempotency-Key") String idempotencyKey
    ) {
        return assignments.publishRoundOne(command, idempotencyKey);
    }

    @PostMapping("/start-round-two")
    AssignmentWorkbenchView startRoundTwo(
            @RequestBody AssignmentService.VersionCommand command,
            @RequestHeader("Idempotency-Key") String idempotencyKey
    ) {
        return assignments.startRoundTwo(command, idempotencyKey);
    }
}
