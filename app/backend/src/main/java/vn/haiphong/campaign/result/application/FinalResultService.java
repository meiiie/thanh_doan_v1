package vn.haiphong.campaign.result.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.haiphong.campaign.access.Actor;
import vn.haiphong.campaign.access.ActorRole;
import vn.haiphong.campaign.access.CurrentActor;
import vn.haiphong.campaign.lifecycle.application.IdempotencyPort;
import vn.haiphong.campaign.lifecycle.application.OptimisticConflict;
import vn.haiphong.campaign.lifecycle.domain.DomainRuleViolation;
import vn.haiphong.campaign.lifecycle.domain.FinalResult;

@Service
public class FinalResultService {
    private final FinalResultGateway results;
    private final CurrentActor currentActor;
    private final Clock clock;
    private final IdempotencyPort idempotency;
    private final XlsxExportService xlsx;

    public FinalResultService(FinalResultGateway results, CurrentActor currentActor, Clock clock,
                              IdempotencyPort idempotency, XlsxExportService xlsx) {
        this.results = results;
        this.currentActor = currentActor;
        this.clock = clock;
        this.idempotency = idempotency;
        this.xlsx = xlsx;
    }

    @Transactional(readOnly = true)
    public FinalResultView view() {
        requireAdministrator(null);
        FinalResultGateway.CampaignRow campaign = results.campaign();
        return results.current().map(header -> {
            FinalResult result = header.result();
            int snapshotTasks = results.snapshotTaskCount(result.id());
            return new FinalResultView(
                    campaign.id(), campaign.name(), campaign.phase(), campaign.version(), snapshotTasks, snapshotTasks,
                    result.id(), result.resultVersion(), result.status().name(), result.totalScore(), result.checksum(),
                    header.preparedByName(), header.preparedAt(), header.approvedByName(), header.approvedAt(),
                    header.publishedByName(), header.publishedAt(), result.version(),
                    results.units(result.id()).stream().map(FinalResultService::unitView).toList()
            );
        }).orElseGet(() -> {
            int expected = results.expectedTasks();
            int completed = results.resolvedTasks();
            return new FinalResultView(
                    campaign.id(), campaign.name(), campaign.phase(), campaign.version(), expected, completed,
                    null, null, null, BigDecimal.ZERO, null, null, null, null, null, null, null, 0, List.of()
            );
        });
    }

    @Transactional
    public FinalResultView prepare(PrepareCommand command, String idempotencyKey) {
        Actor actor = requireAdministrator("result.prepare");
        String action = "PREPARE_FINAL_RESULT";
        if (idempotency.isReplay(actor.id(), action, idempotencyKey, command.expectedCampaignVersion())) {
            return view();
        }
        FinalResultGateway.CampaignRow campaign = results.campaign();
        if (!"ROUND_2".equals(campaign.phase())) {
            throw new DomainRuleViolation("ROUND_TWO_NOT_ACTIVE", "Chỉ lập kết quả sau khi vòng 2 đang mở.");
        }
        if (campaign.version() != command.expectedCampaignVersion()) {
            throw new OptimisticConflict("Chiến dịch đã thay đổi. Hãy tải lại.");
        }
        int expected = results.expectedTasks();
        int completed = results.resolvedTasks();
        if (expected == 0 || completed != expected) {
            throw new DomainRuleViolation(
                    "SCORING_INCOMPLETE", "Đã chốt " + completed + "/" + expected +
                    " hồ sơ; các dòng bị giảm điểm phải hoàn tất vòng 2."
            );
        }
        List<FinalResultGateway.SnapshotLine> lines = results.sourceLines();
        if (lines.size() != expected) {
            throw new DomainRuleViolation("SNAPSHOT_SOURCE_INCOMPLETE", "Dữ liệu nguồn snapshot chưa đầy đủ.");
        }
        List<FinalResultGateway.UnitSnapshot> units = calculateUnits(lines, results.bonusCap());
        BigDecimal aggregateTotal = units.stream().map(FinalResultGateway.UnitSnapshot::totalScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int resultVersion = results.nextResultVersion();
        String checksum = checksum(resultVersion, units, lines);
        String resultId = "final-" + campaign.id() + "-v" + resultVersion;
        OffsetDateTime now = OffsetDateTime.now(clock);
        results.insertSnapshot(
                resultId, resultVersion, aggregateTotal, checksum, actor.id(), now,
                command.expectedCampaignVersion(), units, lines
        );
        idempotency.record(actor.id(), action, idempotencyKey, now, command.expectedCampaignVersion());
        return view();
    }

    @Transactional
    public FinalResultView approve(ResultCommand command, String idempotencyKey) {
        Actor actor = requireAdministrator("result.approve");
        String action = "APPROVE_FINAL_RESULT";
        if (idempotency.isReplay(actor.id(), action, idempotencyKey, command.expectedResultVersion())) return view();
        FinalResultGateway.ResultHeader current = results.current()
                .orElseThrow(() -> new DomainRuleViolation("RESULT_NOT_FOUND", "Chưa có snapshot kết quả để duyệt."));
        if (current.result().version() != command.expectedResultVersion()) {
            throw new OptimisticConflict("Kết quả đã thay đổi. Hãy tải lại.");
        }
        FinalResult approved = current.result().approve(actor.id());
        OffsetDateTime now = OffsetDateTime.now(clock);
        results.approve(current, approved, actor.id(), now);
        idempotency.record(actor.id(), action, idempotencyKey, now, command.expectedResultVersion());
        return view();
    }

    @Transactional
    public FinalResultView publish(PublishCommand command, String idempotencyKey) {
        Actor actor = requireAdministrator("campaign.publish");
        String action = "PUBLISH_FINAL_RESULT";
        if (idempotency.isReplay(
                actor.id(), action, idempotencyKey, command.expectedResultVersion(),
                command.expectedCampaignVersion()
        )) return view();
        FinalResultGateway.CampaignRow campaign = results.campaign();
        if (campaign.version() != command.expectedCampaignVersion()) {
            throw new OptimisticConflict("Chiến dịch đã thay đổi. Hãy tải lại.");
        }
        FinalResultGateway.ResultHeader current = results.current()
                .orElseThrow(() -> new DomainRuleViolation("RESULT_NOT_FOUND", "Chưa có snapshot kết quả để công bố."));
        if (current.result().version() != command.expectedResultVersion()) {
            throw new OptimisticConflict("Kết quả đã thay đổi. Hãy tải lại.");
        }
        FinalResult published = current.result().publish(actor.id());
        OffsetDateTime now = OffsetDateTime.now(clock);
        results.publish(current, published, command.expectedCampaignVersion(), actor.id(), now);
        idempotency.record(
                actor.id(), action, idempotencyKey, now, command.expectedResultVersion(),
                command.expectedCampaignVersion()
        );
        return view();
    }

    @Transactional(readOnly = true)
    public ExportFile export() {
        requireAdministrator(null);
        FinalResultGateway.ResultHeader header = results.current()
                .orElseThrow(() -> new DomainRuleViolation("RESULT_NOT_FOUND", "Chưa có snapshot kết quả để xuất."));
        FinalResultGateway.CampaignRow campaign = results.campaign();
        byte[] content = xlsx.create(
                campaign, header, results.units(header.result().id()), results.snapshotLines(header.result().id())
        );
        String filename = "doi-soat-tntn-he-2026-v" + header.result().resultVersion() + ".xlsx";
        return new ExportFile(filename, content);
    }

    private Actor requireAdministrator(String capability) {
        Actor actor = currentActor.required();
        if (actor.role() != ActorRole.SUPERADMIN && actor.role() != ActorRole.CAMPAIGN_ADMIN) {
            throw new AccessDeniedException("Final results require campaign administration");
        }
        if (!actor.hasCampaign(FinalResultGateway.CAMPAIGN_ID)) {
            throw new AccessDeniedException("Campaign is outside the account scope");
        }
        if (capability != null && !actor.hasCapability(capability)) {
            throw new AccessDeniedException("Account lacks capability: " + capability);
        }
        return actor;
    }

    private static List<FinalResultGateway.UnitSnapshot> calculateUnits(
            List<FinalResultGateway.SnapshotLine> lines, BigDecimal bonusCap
    ) {
        Map<String, MutableUnit> byOrganization = new LinkedHashMap<>();
        for (FinalResultGateway.SnapshotLine line : lines) {
            MutableUnit unit = byOrganization.computeIfAbsent(
                    line.organizationId(), ignored -> new MutableUnit(
                            line.organizationId(), line.organizationCode(), line.organizationName(),
                            line.unitGroupCode()
                    )
            );
            if ("CORE".equals(line.section())) {
                unit.coreMaximum = unit.coreMaximum.add(line.maximumScore());
                unit.coreScore = unit.coreScore.add(line.effectiveScore());
            } else {
                unit.bonusRaw = unit.bonusRaw.add(line.effectiveScore());
            }
        }
        List<FinalResultGateway.UnitSnapshot> values = new ArrayList<>();
        for (MutableUnit unit : byOrganization.values()) {
            BigDecimal cappedBonus = unit.bonusRaw.min(bonusCap);
            BigDecimal total = unit.coreScore.add(cappedBonus);
            BigDecimal rate = unit.coreMaximum.signum() == 0 ? BigDecimal.ZERO :
                    unit.coreScore.divide(unit.coreMaximum, 4, RoundingMode.HALF_UP);
            values.add(new FinalResultGateway.UnitSnapshot(
                    unit.id, unit.code, unit.name, unit.unitGroup, unit.coreMaximum, unit.coreScore,
                    unit.bonusRaw, cappedBonus, total, rate
            ));
        }
        return List.copyOf(values);
    }

    private static FinalResultView.UnitResultView unitView(FinalResultGateway.UnitSnapshot unit) {
        return new FinalResultView.UnitResultView(
                unit.organizationId(), unit.organizationCode(), unit.organizationName(), unit.unitGroupCode(),
                unit.applicableCoreMaximum(), unit.coreScore(), unit.bonusRawScore(), unit.bonusCappedScore(),
                unit.totalScore(), unit.completionRate()
        );
    }

    private static String checksum(int version, List<FinalResultGateway.UnitSnapshot> units,
                                   List<FinalResultGateway.SnapshotLine> lines) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            update(digest, "result-version", Integer.toString(version));
            for (FinalResultGateway.UnitSnapshot unit : units) {
                update(digest, unit.organizationId(), unit.applicableCoreMaximum().toPlainString(),
                        unit.coreScore().toPlainString(), unit.bonusRawScore().toPlainString(),
                        unit.bonusCappedScore().toPlainString(), unit.totalScore().toPlainString());
            }
            for (FinalResultGateway.SnapshotLine line : lines) {
                update(digest, line.organizationId(), line.lineId(), line.selfScore().toPlainString(),
                        line.roundOneScore().toPlainString(), line.explanationBody(),
                        line.roundTwoScore() == null ? null : line.roundTwoScore().toPlainString(),
                        line.effectiveScore().toPlainString(),
                        line.submissionEvidenceUrl(), Integer.toString(line.submissionRevision()),
                        line.roundOneDecidedBy(), line.roundTwoDecidedBy());
            }
            return HexFormat.of().withUpperCase().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }

    private static void update(MessageDigest digest, String... fields) {
        for (String field : fields) {
            byte[] bytes = (field == null ? "<null>" : field).getBytes(StandardCharsets.UTF_8);
            digest.update(Integer.toString(bytes.length).getBytes(StandardCharsets.US_ASCII));
            digest.update((byte) ':');
            digest.update(bytes);
            digest.update((byte) '|');
        }
        digest.update((byte) '\n');
    }

    private static final class MutableUnit {
        private final String id;
        private final String code;
        private final String name;
        private final String unitGroup;
        private BigDecimal coreMaximum = BigDecimal.ZERO;
        private BigDecimal coreScore = BigDecimal.ZERO;
        private BigDecimal bonusRaw = BigDecimal.ZERO;

        private MutableUnit(String id, String code, String name, String unitGroup) {
            this.id = id; this.code = code; this.name = name; this.unitGroup = unitGroup;
        }
    }

    public record PrepareCommand(int expectedCampaignVersion) {}
    public record ResultCommand(int expectedResultVersion) {}
    public record PublishCommand(int expectedResultVersion, int expectedCampaignVersion) {}
    public record ExportFile(String filename, byte[] content) {}
}
