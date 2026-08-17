package vn.haiphong.campaign.submission.application;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.OffsetDateTime;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.haiphong.campaign.access.Actor;
import vn.haiphong.campaign.access.ActorRole;
import vn.haiphong.campaign.access.CurrentActor;
import vn.haiphong.campaign.lifecycle.domain.DomainRuleViolation;
import vn.haiphong.campaign.lifecycle.domain.Submission;
import vn.haiphong.campaign.lifecycle.infrastructure.IdempotencyStore;
import vn.haiphong.campaign.submission.infrastructure.UnitTaskRepository;

@Service
public class UnitTaskService {
    private final UnitTaskRepository tasks;
    private final CurrentActor currentActor;
    private final Clock clock;
    private final IdempotencyStore idempotency;

    public UnitTaskService(UnitTaskRepository tasks, CurrentActor currentActor, Clock clock,
                           IdempotencyStore idempotency) {
        this.tasks = tasks;
        this.currentActor = currentActor;
        this.clock = clock;
        this.idempotency = idempotency;
    }

    @Transactional(readOnly = true)
    public UnitTaskView view() {
        Actor actor = requireUnit();
        UnitTaskRepository.CampaignRow campaign = tasks.campaign();
        UnitTaskRepository.OrganizationRow organization = tasks.organization(actor.organizationId())
                .orElseThrow(() -> new AccessDeniedException("Account organization is unavailable"));
        return new UnitTaskView(
                campaign.id(), campaign.name(), campaign.phase(), organization.id(), organization.name(),
                organization.unitGroupName(), "PREPARATION".equals(campaign.phase()) ? java.util.List.of() :
                tasks.tasks(organization.id())
        );
    }

    @Transactional
    public UnitTaskView saveDraft(String lineId, SaveTask command) {
        Actor actor = requireUnit();
        UnitTaskRepository.TaskContext context = requireTask(actor.organizationId(), lineId);
        requireSubmissionWindow(actor.organizationId(), lineId);
        validateDraft(context, command);
        OffsetDateTime now = OffsetDateTime.now(clock);
        Submission draft = tasks.draft(
                actor.organizationId(), lineId, command.selfScore(), command.evidenceUrl(), command.summary(),
                command.expectedVersion(), actor.id(), now
        );
        tasks.draftAudit(now, actor.id(), draft);
        return view();
    }

    @Transactional
    public UnitTaskView submit(String lineId, SaveTask command, String idempotencyKey) {
        Actor actor = requireUnit();
        String action = "SUBMIT_SUBMISSION";
        if (idempotency.isReplay(
                actor.id(), action, idempotencyKey, lineId, command.selfScore(), command.evidenceUrl(),
                command.summary(), command.expectedVersion()
        )) return view();
        UnitTaskRepository.TaskContext context = requireTask(actor.organizationId(), lineId);
        requireSubmissionWindow(actor.organizationId(), lineId);
        validateDraft(context, command);
        OffsetDateTime now = OffsetDateTime.now(clock);
        Submission draft = tasks.draft(
                actor.organizationId(), lineId, command.selfScore(), command.evidenceUrl(), command.summary(),
                command.expectedVersion(), actor.id(), now
        );
        Submission submitted = draft.submit(
                context.maximumScore(), !"INTERNAL".equals(context.evidencePolicy()), context.summaryRequired(),
                draft.selfScore(), draft.evidenceUrl(), draft.summary()
        );
        tasks.submit(draft, submitted, actor.id(), now, context.teamId(), context.reviewerId());
        idempotency.record(
                actor.id(), action, idempotencyKey, now, lineId, command.selfScore(), command.evidenceUrl(),
                command.summary(), command.expectedVersion()
        );
        return view();
    }

    @Transactional
    public UnitTaskView submitExplanation(String lineId, Explanation command, String idempotencyKey) {
        Actor actor = requireUnit();
        String action = "SUBMIT_EXPLANATION";
        if (idempotency.isReplay(
                actor.id(), action, idempotencyKey, lineId, command.body(), command.evidenceUrl(),
                command.expectedRevision()
        )) return view();
        if (!"EXPLANATION".equals(tasks.campaign().phase())) {
            throw new DomainRuleViolation("EXPLANATION_NOT_ACTIVE", "Chiến dịch chưa mở thời gian giải trình.");
        }
        requireTask(actor.organizationId(), lineId);
        UnitTaskRepository.ExplanationContext context = tasks.explanationContext(actor.organizationId(), lineId)
                .orElseThrow(() -> new DomainRuleViolation(
                        "EXPLANATION_NOT_AVAILABLE", "Dòng này chưa có kết quả vòng 1 để giải trình."
                ));
        if (context.roundOneScore().compareTo(context.selfScore()) >= 0) {
            throw new DomainRuleViolation(
                    "EXPLANATION_NOT_REQUIRED", "Dòng không bị giảm điểm nên không cần giải trình."
            );
        }
        String body = command.body() == null ? "" : command.body().trim();
        if (body.length() < 10 || body.length() > 4000) {
            throw new DomainRuleViolation(
                    "EXPLANATION_BODY_INVALID", "Nội dung giải trình cần từ 10 đến 4.000 ký tự."
            );
        }
        if (command.evidenceUrl() != null && command.evidenceUrl().length() > 2000) {
            throw new DomainRuleViolation("EVIDENCE_URL_TOO_LONG", "Link bổ sung không quá 2.000 ký tự.");
        }
        OffsetDateTime now = OffsetDateTime.now(clock);
        tasks.addExplanation(
                context, body, command.evidenceUrl(), command.expectedRevision(), actor.id(), now
        );
        idempotency.record(
                actor.id(), action, idempotencyKey, now, lineId, body, command.evidenceUrl(),
                command.expectedRevision()
        );
        return view();
    }

    private UnitTaskRepository.TaskContext requireTask(String organizationId, String lineId) {
        return tasks.taskContext(organizationId, lineId)
                .orElseThrow(() -> new AccessDeniedException("Task is outside the organization assignment"));
    }

    private Actor requireUnit() {
        Actor actor = currentActor.required();
        if (actor.role() != ActorRole.UNIT_MEMBER || actor.organizationId() == null ||
                !actor.hasCampaign(UnitTaskRepository.CAMPAIGN_ID)) {
            throw new AccessDeniedException("Unit workspace requires an organization-scoped account");
        }
        return actor;
    }

    private void requireSubmissionWindow(String organizationId, String lineId) {
        String phase = tasks.campaign().phase();
        if ("SELF_ASSESSMENT".equals(phase)) return;
        boolean returnedDuringRoundOne = "ROUND_1".equals(phase) && tasks.submission(organizationId, lineId)
                .map(value -> value.status() == vn.haiphong.campaign.lifecycle.domain.SubmissionStatus.RETURNED)
                .orElse(false);
        if (!returnedDuringRoundOne) {
            throw new DomainRuleViolation("SUBMISSION_WINDOW_CLOSED", "Chiến dịch chưa mở hoặc đã khóa nhận hồ sơ.");
        }
    }

    private static void validateDraft(UnitTaskRepository.TaskContext context, SaveTask command) {
        if (command.selfScore() != null && (command.selfScore().signum() < 0 ||
                command.selfScore().compareTo(context.maximumScore()) > 0)) {
            throw new DomainRuleViolation("SELF_SCORE_OUT_OF_RANGE", "Điểm tự chấm phải nằm trong khung điểm.");
        }
        if (command.evidenceUrl() != null && command.evidenceUrl().length() > 2000) {
            throw new DomainRuleViolation("EVIDENCE_URL_TOO_LONG", "Link minh chứng không quá 2.000 ký tự.");
        }
        if (command.summary() != null && command.summary().length() > 4000) {
            throw new DomainRuleViolation("SUMMARY_TOO_LONG", "Báo cáo tóm tắt không quá 4.000 ký tự.");
        }
    }

    public record SaveTask(BigDecimal selfScore, String evidenceUrl, String summary, int expectedVersion) {}
    public record Explanation(String body, String evidenceUrl, int expectedRevision) {}
}
