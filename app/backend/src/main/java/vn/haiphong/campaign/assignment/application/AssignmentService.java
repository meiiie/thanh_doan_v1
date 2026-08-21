package vn.haiphong.campaign.assignment.application;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.haiphong.campaign.access.Actor;
import vn.haiphong.campaign.access.ActorRole;
import vn.haiphong.campaign.access.CurrentActor;
import vn.haiphong.campaign.lifecycle.application.IdempotencyPort;
import vn.haiphong.campaign.lifecycle.domain.DomainRuleViolation;

@Service
public class AssignmentService {
    private final AssignmentGateway assignments;
    private final CurrentActor currentActor;
    private final Clock clock;
    private final IdempotencyPort idempotency;

    public AssignmentService(AssignmentGateway assignments, CurrentActor currentActor, Clock clock,
                             IdempotencyPort idempotency) {
        this.assignments = assignments;
        this.currentActor = currentActor;
        this.clock = clock;
        this.idempotency = idempotency;
    }

    @Transactional(readOnly = true)
    public AssignmentWorkbenchView view() {
        requireAdministrator();
        AssignmentGateway.CampaignRow campaign = assignments.campaign();
        List<AssignmentWorkbenchView.PlanView> plans = assignments.plans().stream()
                .map(AssignmentService::planView).toList();
        List<AssignmentGateway.ReviewerRow> reviewers = assignments.reviewers();
        AssignmentGateway.Counts counts = assignments.counts();
        long ready = plans.stream().filter(this::ready).count();
        return new AssignmentWorkbenchView(
                campaign.id(), campaign.name(), campaign.phase(), campaign.version(), campaign.scorecardStatus(),
                assignments.unitGroups().stream().map(row -> new AssignmentWorkbenchView.UnitGroupView(
                        row.code(), row.name(), row.documentedUnitCount()
                )).toList(),
                assignments.teams().stream().map(row -> teamView(row, reviewers)).toList(),
                reviewers.stream().map(row -> new AssignmentWorkbenchView.ReviewerView(
                        row.id(), row.displayName(), row.teamId(), row.enabled(), row.teamMonitor()
                )).toList(),
                plans,
                new AssignmentWorkbenchView.ProgressView(
                        plans.size(), Math.toIntExact(ready), counts.expected(), counts.submitted(), counts.reviewed()
                )
        );
    }

    @Transactional
    public AssignmentWorkbenchView save(String groupId, SaveAssignment command) {
        Actor actor = requireAdministrator();
        requirePreparation();
        saveOne(actor, groupId, command.unitGroupCodes(), command.teamId(), command.reviewerId(),
                command.expectedVersion());
        return view();
    }

    @Transactional
    public AssignmentWorkbenchView saveBulk(BulkAssignment command) {
        Actor actor = requireAdministrator();
        requirePreparation();
        if (command.groups() == null || command.groups().isEmpty()) {
            throw new DomainRuleViolation("GROUP_SELECTION_REQUIRED", "Cần chọn ít nhất một hạng mục.");
        }
        BulkMode mode = BulkMode.from(command.mode());
        List<AssignmentGateway.AssignmentPlanRow> currentPlans = assignments.plans();
        for (GroupVersion group : command.groups()) {
            AssignmentGateway.AssignmentPlanRow current = currentPlans.stream()
                    .filter(plan -> plan.groupId().equals(group.groupId()))
                    .findFirst().orElseThrow(() -> new DomainRuleViolation(
                            "SCORECARD_GROUP_UNKNOWN", "Hạng mục không thuộc bảng điểm hiện tại."
                    ));
            List<String> unitGroupCodes = mode == BulkMode.REVIEW
                    ? current.unitGroupCodes() : command.unitGroupCodes();
            String teamId = mode == BulkMode.SCOPE ? current.teamId() : command.teamId();
            String reviewerId = mode == BulkMode.SCOPE ? current.reviewerId() : command.reviewerId();
            saveOne(actor, group.groupId(), unitGroupCodes, teamId, reviewerId, group.expectedVersion());
        }
        return view();
    }

    @Transactional
    public AssignmentWorkbenchView release(VersionCommand command, String idempotencyKey) {
        Actor actor = requireAdministrator();
        requireCapability(actor, "scorecard.release");
        String action = "RELEASE_ASSIGNMENT_SNAPSHOT";
        if (idempotency.isReplay(actor.id(), action, idempotencyKey, command.expectedVersion())) return view();
        AssignmentGateway.CampaignRow campaign = assignments.campaign();
        if (!"PREPARATION".equals(campaign.phase())) {
            throw new DomainRuleViolation("SCORECARD_ALREADY_RELEASED", "Bảng phân công đã được ban hành.");
        }
        int total = assignments.totalGroupCount();
        int ready = assignments.readyGroupCount();
        if (total == 0 || ready != total) {
            throw new DomainRuleViolation(
                    "ASSIGNMENTS_INCOMPLETE",
                    "Cần đủ Khối áp dụng, Tổ theo dõi và Cán bộ chấm cho cả " + total + " hạng mục trước khi ban hành."
            );
        }
        OffsetDateTime now = now();
        assignments.release(command.expectedVersion(), now, actor.id());
        idempotency.record(actor.id(), action, idempotencyKey, now, command.expectedVersion());
        return view();
    }

    @Transactional
    public AssignmentWorkbenchView startReview(VersionCommand command, String idempotencyKey) {
        Actor actor = requireAdministrator();
        requireCapability(actor, "round1.start");
        String action = "START_ROUND_ONE";
        if (idempotency.isReplay(actor.id(), action, idempotencyKey, command.expectedVersion())) return view();
        AssignmentGateway.CampaignRow campaign = assignments.campaign();
        if (!"SELF_ASSESSMENT".equals(campaign.phase())) {
            throw new DomainRuleViolation("SELF_ASSESSMENT_NOT_OPEN", "Chiến dịch không ở giai đoạn nhận hồ sơ.");
        }
        AssignmentGateway.Counts counts = assignments.counts();
        if (counts.expected() == 0 || counts.submitted() != counts.expected()) {
            throw new DomainRuleViolation(
                    "SUBMISSIONS_INCOMPLETE",
                    "Đã nhận " + counts.submitted() + "/" + counts.expected() + " hồ sơ; chưa thể mở vòng thẩm định."
            );
        }
        OffsetDateTime now = now();
        assignments.startReview(command.expectedVersion(), now, actor.id());
        idempotency.record(actor.id(), action, idempotencyKey, now, command.expectedVersion());
        return view();
    }

    @Transactional
    public AssignmentWorkbenchView openExplanation(VersionCommand command, String idempotencyKey) {
        Actor actor = requireAdministrator();
        requireCapability(actor, "explanation.open");
        String action = "OPEN_EXPLANATION";
        if (idempotency.isReplay(actor.id(), action, idempotencyKey, command.expectedVersion())) return view();
        AssignmentGateway.CampaignRow campaign = assignments.campaign();
        if (!"ROUND_1".equals(campaign.phase())) {
            throw new DomainRuleViolation("ROUND_ONE_NOT_ACTIVE", "Chiến dịch không ở vòng thẩm định thứ nhất.");
        }
        AssignmentGateway.Counts counts = assignments.counts();
        if (counts.expected() == 0 || counts.reviewed() != counts.expected()) {
            throw new DomainRuleViolation(
                    "ROUND_ONE_INCOMPLETE",
                    "Đã thẩm định " + counts.reviewed() + "/" + counts.expected() + " hồ sơ; chưa thể mở giải trình."
            );
        }
        OffsetDateTime now = now();
        assignments.openExplanation(command.expectedVersion(), now, actor.id());
        idempotency.record(actor.id(), action, idempotencyKey, now, command.expectedVersion());
        return view();
    }

    @Transactional
    public AssignmentWorkbenchView startRoundTwo(VersionCommand command, String idempotencyKey) {
        Actor actor = requireAdministrator();
        requireCapability(actor, "round2.start");
        String action = "START_ROUND_TWO";
        if (idempotency.isReplay(actor.id(), action, idempotencyKey, command.expectedVersion())) return view();
        AssignmentGateway.CampaignRow campaign = assignments.campaign();
        if (!"EXPLANATION".equals(campaign.phase())) {
            throw new DomainRuleViolation("EXPLANATION_NOT_ACTIVE", "Chiến dịch không ở thời gian giải trình.");
        }
        AssignmentGateway.ExplanationCounts counts = assignments.explanationCounts();
        if (counts.explained() != counts.reduced()) {
            throw new DomainRuleViolation(
                    "EXPLANATIONS_INCOMPLETE",
                    "Đã nhận " + counts.explained() + "/" + counts.reduced() + " giải trình bắt buộc."
            );
        }
        OffsetDateTime now = now();
        assignments.startRoundTwo(command.expectedVersion(), now, actor.id());
        idempotency.record(actor.id(), action, idempotencyKey, now, command.expectedVersion());
        return view();
    }

    private void saveOne(Actor actor, String groupId, List<String> rawCodes, String teamId,
                         String reviewerId, int expectedVersion) {
        if (!assignments.groupExists(groupId)) {
            throw new DomainRuleViolation("SCORECARD_GROUP_UNKNOWN", "Hạng mục không thuộc bảng điểm hiện tại.");
        }
        List<String> codes = rawCodes == null ? List.of() : rawCodes.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(value -> value.trim().toUpperCase(Locale.ROOT)).distinct().sorted().toList();
        if (!assignments.unitGroupsExist(codes)) {
            throw new DomainRuleViolation("UNIT_GROUP_UNKNOWN", "Danh sách khối áp dụng có giá trị không hợp lệ.");
        }
        String normalizedTeam = blankToNull(teamId);
        String normalizedReviewer = blankToNull(reviewerId);
        if (normalizedTeam != null && !assignments.teamExists(normalizedTeam)) {
            throw new DomainRuleViolation("TEAM_UNKNOWN", "Tổ theo dõi không thuộc chiến dịch hoặc đã bị khóa.");
        }
        if (normalizedReviewer != null && (normalizedTeam == null ||
                !assignments.assessorBelongsToTeam(normalizedReviewer, normalizedTeam))) {
            throw new DomainRuleViolation("REVIEWER_SCOPE_INVALID", "Cán bộ chấm phải thuộc đúng Tổ theo dõi.");
        }
        OffsetDateTime now = now();
        int version = assignments.savePlan(
                groupId, codes, normalizedTeam, normalizedReviewer, expectedVersion, now, actor.id()
        );
        assignments.assignmentAudit(now, actor.id(), groupId, version);
    }

    private Actor requireAdministrator() {
        Actor actor = currentActor.required();
        if (actor.role() != ActorRole.SUPERADMIN && actor.role() != ActorRole.CAMPAIGN_ADMIN) {
            throw new AccessDeniedException("Assignment workbench requires campaign administration");
        }
        if (!actor.hasCampaign(AssignmentGateway.CAMPAIGN_ID)) {
            throw new AccessDeniedException("Campaign is outside the account scope");
        }
        return actor;
    }

    private static void requireCapability(Actor actor, String capability) {
        if (!actor.hasCapability(capability)) {
            throw new AccessDeniedException("Account lacks capability: " + capability);
        }
    }

    private void requirePreparation() {
        if (!"PREPARATION".equals(assignments.campaign().phase())) {
            throw new DomainRuleViolation("ASSIGNMENT_SNAPSHOT_IMMUTABLE", "Bản phân công đã ban hành là bất biến.");
        }
    }

    private boolean ready(AssignmentWorkbenchView.PlanView plan) {
        return !plan.unitGroupCodes().isEmpty() && plan.teamId() != null && plan.reviewerId() != null;
    }

    private static AssignmentWorkbenchView.PlanView planView(AssignmentGateway.AssignmentPlanRow row) {
        return new AssignmentWorkbenchView.PlanView(
                row.groupId(), row.unitGroupCodes(), row.teamId(), row.reviewerId(), row.version(),
                row.expectedTasks(), row.submittedTasks(), row.reviewedTasks(),
                row.lastReviewedBy(), row.lastReviewedAt()
        );
    }

    private static AssignmentWorkbenchView.TeamView teamView(
            AssignmentGateway.TeamRow team, List<AssignmentGateway.ReviewerRow> reviewers
    ) {
        AssignmentGateway.ReviewerRow monitor = reviewers.stream()
                .filter(reviewer -> reviewer.teamId().equals(team.id()) && reviewer.teamMonitor())
                .findFirst().orElse(null);
        int available = Math.toIntExact(reviewers.stream()
                .filter(reviewer -> reviewer.teamId().equals(team.id()) && reviewer.enabled())
                .count());
        int locked = Math.toIntExact(reviewers.stream()
                .filter(reviewer -> reviewer.teamId().equals(team.id()) && !reviewer.enabled())
                .count());
        return new AssignmentWorkbenchView.TeamView(
                team.id(), team.name(), monitor == null ? null : monitor.id(),
                monitor == null ? null : monitor.displayName(),
                available, locked
        );
    }

    private OffsetDateTime now() { return OffsetDateTime.now(clock); }
    private static String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    public record SaveAssignment(List<String> unitGroupCodes, String teamId, String reviewerId,
                                 int expectedVersion) {}
    public record GroupVersion(String groupId, int expectedVersion) {}
    public record BulkAssignment(List<GroupVersion> groups, List<String> unitGroupCodes,
                                 String teamId, String reviewerId, String mode) {}
    public record VersionCommand(int expectedVersion) {}

    private enum BulkMode {
        ALL, SCOPE, REVIEW;

        private static BulkMode from(String value) {
            if (value == null || value.isBlank()) return ALL;
            try {
                return valueOf(value.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException exception) {
                throw new DomainRuleViolation("BULK_MODE_INVALID", "Kiểu thao tác hàng loạt không hợp lệ.");
            }
        }
    }
}
