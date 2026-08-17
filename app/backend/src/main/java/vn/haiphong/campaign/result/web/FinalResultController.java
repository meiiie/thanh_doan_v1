package vn.haiphong.campaign.result.web;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.haiphong.campaign.result.application.FinalResultService;
import vn.haiphong.campaign.result.application.FinalResultView;

@RestController
@RequestMapping("/api/results/current")
public final class FinalResultController {
    private static final MediaType XLSX = MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    private final FinalResultService results;

    public FinalResultController(FinalResultService results) {
        this.results = results;
    }

    @GetMapping
    FinalResultView view() {
        return results.view();
    }

    @PostMapping("/prepare")
    FinalResultView prepare(
            @RequestBody FinalResultService.PrepareCommand command,
            @RequestHeader("Idempotency-Key") String idempotencyKey
    ) {
        return results.prepare(command, idempotencyKey);
    }

    @PostMapping("/approve")
    FinalResultView approve(
            @RequestBody FinalResultService.ResultCommand command,
            @RequestHeader("Idempotency-Key") String idempotencyKey
    ) {
        return results.approve(command, idempotencyKey);
    }

    @PostMapping("/publish")
    FinalResultView publish(
            @RequestBody FinalResultService.PublishCommand command,
            @RequestHeader("Idempotency-Key") String idempotencyKey
    ) {
        return results.publish(command, idempotencyKey);
    }

    @GetMapping("/export")
    ResponseEntity<byte[]> export() {
        FinalResultService.ExportFile file = results.export();
        return ResponseEntity.ok()
                .contentType(XLSX)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(file.filename()).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(file.content());
    }
}
