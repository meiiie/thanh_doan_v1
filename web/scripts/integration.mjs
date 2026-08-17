import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const port = 4173;
const origin = `http://localhost:${port}`;
const logs = [];
const server = spawn(
  process.execPath,
  [resolve("node_modules/vinext/dist/cli.js"), "dev", "--port", String(port)],
  {
    env: {
      ...process.env,
      DOAN_D1_PERSIST: "false",
      WRANGLER_LOG_PATH: `.wrangler/smoke-${port}.log`,
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

server.stdout.on("data", (chunk) => logs.push(chunk.toString()));
server.stderr.on("data", (chunk) => logs.push(chunk.toString()));
let actionSequence = 0;

try {
  await waitForServer(`${origin}/api/health`);

  const health = await fetch(`${origin}/api/health`);
  assert.equal(health.status, 200);
  assert.deepEqual((await health.json()).status, "ok");
  assert.equal(health.headers.get("x-frame-options"), "DENY");
  assert.equal(health.headers.get("x-content-type-options"), "nosniff");
  assert.match(health.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);

  const admin = await fetchText(`${origin}/admin?demo=admin`);
  assert.match(admin, /16 hồ sơ Đại học, Cao đẳng/);
  assert.match(admin, /134/);

  const unit = await fetchText(`${origin}/scorecard?demo=unit`);
  assert.match(unit, /Nộp bảng tự chấm/);
  assert.match(unit, /Nội dung điểm thưởng/);
  assert.doesNotMatch(unit, /Hàng chờ chấm/);

  const reviewer = await fetchText(`${origin}/review?demo=reviewer`);
  assert.match(reviewer, /Hàng chờ chấm/);
  assert.match(reviewer, /Tổ Phong trào/);
  assert.doesNotMatch(reviewer, /Báo cáo đơn vị:/);

  const exportResponse = await fetch(`${origin}/api/export?demo=admin`);
  assert.equal(exportResponse.status, 200);
  assert.match(exportResponse.headers.get("content-type") ?? "", /^text\/csv/);
  assert.match(await exportResponse.text(), /Mã đơn vị/);

  const noOrigin = await fetch(`${origin}/api/actions`, {
    method: "POST",
    body: form({ action: "saveAssessment", idempotencyKey: "smoke-no-origin-0001" }),
    redirect: "manual",
  });
  assert.equal(noOrigin.status, 403);

  const key = `smoke-invalid-${Date.now()}`;
  const invalidBody = {
    action: "saveAssessment",
    assessmentId: "assessment-unit-115-criterion-001",
    score: "999",
    report: "Kiểm thử không làm đổi dữ liệu",
    evidenceUrl: "https://example.org/evidence",
    idempotencyKey: key,
    returnTo: "/scorecard?demo=unit",
    demo: "unit",
  };
  const invalid = await post(invalidBody);
  assert.equal(invalid.status, 303);
  assert.match(invalid.headers.get("location") ?? "", /error=INVALID_SCORE/);

  const duplicate = await post(invalidBody);
  assert.equal(duplicate.status, 303);
  assert.match(duplicate.headers.get("location") ?? "", /error=DUPLICATE_ACTION/);

  await expectAction(
    {
      action: "saveAssessment",
      assessmentId: "assessment-unit-116-criterion-001",
      score: "0",
      report: "Không được phép sửa hồ sơ đơn vị khác",
      evidenceUrl: "",
      demo: "unit",
      returnTo: "/scorecard?demo=unit",
    },
    /error=FORBIDDEN/,
  );
  await expectAction(
    {
      action: "transitionCampaign",
      nextPhase: "ROUND1",
      demo: "auditor",
      returnTo: "/audit?demo=auditor",
    },
    /error=FORBIDDEN/,
  );
  await expectAction(
    {
      action: "updateCampaignSettings",
      name: "Chiến dịch Thanh niên tình nguyện Hè 2026 — Đại học, Cao đẳng",
      selfDeadline: "2026-09-01T23:59",
      demo: "admin",
      returnTo: "/admin?demo=admin",
    },
    /success=campaignUpdated/,
  );
  await expectAction(
    {
      action: "setAssessmentApplicability",
      assessmentId: "assessment-unit-115-criterion-035",
      applicable: "0",
      demo: "admin",
      returnTo: "/scorecard?unitId=unit-115&demo=admin",
    },
    /success=applicabilityChanged/,
  );
  await expectAction(
    {
      action: "saveAssessment",
      assessmentId: "assessment-unit-115-criterion-035",
      score: "0",
      report: "Không được lưu tiêu chí đã loại trừ",
      evidenceUrl: "",
      demo: "unit",
      returnTo: "/scorecard?demo=unit",
    },
    /error=NOT_APPLICABLE/,
  );

  const backupResponse = await fetch(`${origin}/api/backup?demo=admin`);
  assert.equal(backupResponse.status, 200);
  const backup = await backupResponse.json();
  assert.equal(backup.format, "doan-scorecard-backup");
  assert.equal(backup.data.units.length, 134);
  assert.equal(
    backup.data.assessments.find(
      (assessment) => assessment.id === "assessment-unit-115-criterion-035",
    ).applicable,
    0,
  );
  assert.equal((await fetch(`${origin}/api/backup?demo=auditor`)).status, 403);

  await saveCompleteUnitDraft();
  await expectAction(
    { action: "submitUnit", demo: "unit", returnTo: "/scorecard?demo=unit" },
    /success=submitted/,
  );
  await transition("ROUND1");

  const openedQueue = await fetchText(`${origin}/review?demo=reviewer`);
  assert.match(openedQueue, /Báo cáo đơn vị:/);
  assert.doesNotMatch(openedQueue, /Đăng cai tổ chức hoạt động cấp thành phố/);
  await expectAction(
    {
      action: "saveReview",
      assessmentId: "assessment-unit-115-criterion-035",
      score: "0",
      reason: "",
      demo: "reviewerVp",
      returnTo: "/review?demo=reviewerVp",
    },
    /error=NOT_APPLICABLE/,
  );
  await expectAction(
    {
      action: "saveReview",
      assessmentId: "assessment-unit-115-criterion-031",
      score: "0",
      reason: "",
      demo: "reviewer",
      returnTo: "/review?demo=reviewer",
    },
    /error=FORBIDDEN/,
  );

  await saveAllRoundOneDecisions();
  await transition("ROUND1_RELEASED");
  await transition("EXPLANATION");
  await expectAction(
    {
      action: "saveExplanation",
      assessmentId: "assessment-unit-115-criterion-001",
      message: "Đơn vị xác nhận và bổ sung căn cứ đối chiếu.",
      evidenceUrl: "https://example.org/explanation",
      demo: "unit",
      returnTo: "/scorecard?demo=unit",
    },
    /success=saved/,
  );
  await transition("ROUND2");
  await expectAction(
    {
      action: "saveReview",
      assessmentId: "assessment-unit-115-criterion-001",
      score: "1",
      reason: "Bổ sung hợp lệ sau giải trình",
      demo: "admin",
      returnTo: "/review?demo=admin",
    },
    /success=saved/,
  );
  await transition("FINALIZED");

  const finalizedAdmin = await fetchText(`${origin}/admin?demo=admin`);
  assert.match(finalizedAdmin, /Mở lại vòng 2/);
  assert.match(finalizedAdmin, /Đã chốt<\/span><strong>16<\/strong>/);
  const finalCsv = await (await fetch(`${origin}/api/export?demo=admin`)).text();
  assert.match(finalCsv, /DV-115/);
  assert.match(finalCsv, /Không hoàn thành/);

  await expectAction(
    {
      action: "transitionCampaign",
      nextPhase: "ROUND2",
      reason: "",
      demo: "admin",
      returnTo: "/admin?demo=admin",
    },
    /error=REOPEN_REASON_REQUIRED/,
  );
  await expectAction(
    {
      action: "transitionCampaign",
      nextPhase: "ROUND2",
      reason: "Đối chiếu lại biên bản hội đồng theo yêu cầu kiểm tra.",
      demo: "admin",
      returnTo: "/admin?demo=admin",
    },
    /success=transitioned/,
  );
  const audit = await fetchText(`${origin}/audit?demo=admin`);
  assert.match(audit, /Mở lại vòng 2/);
  const historyResponse = await fetch(`${origin}/api/export?history=1&demo=admin`);
  assert.equal(historyResponse.status, 200);
  const history = await historyResponse.json();
  assert.equal(history.snapshots.length, 16);
  assert.equal(
    history.snapshots.find((snapshot) => snapshot.unitCode === "DV-115").totalScore,
    1,
  );
  assert.equal(
    history.snapshots
      .find((snapshot) => snapshot.unitCode === "DV-115")
      .criteria.find((criterion) => criterion.code === "II.5").applicable,
    0,
  );

  console.log("Integration smoke: full self-score → two reviews → finalization → audited reopen passed.");
} catch (error) {
  console.error(logs.join("").slice(-12000));
  throw error;
} finally {
  server.kill("SIGINT");
  await Promise.race([
    new Promise((resolveExit) => server.once("exit", resolveExit)),
    new Promise((resolveTimeout) => setTimeout(resolveTimeout, 5000)),
  ]);
  if (server.exitCode === null) server.kill("SIGKILL");
}

async function post(values) {
  return fetch(`${origin}/api/actions`, {
    method: "POST",
    headers: { origin },
    body: form(values),
    redirect: "manual",
  });
}

async function expectAction(values, locationPattern) {
  actionSequence += 1;
  const response = await post({
    ...values,
    idempotencyKey: `smoke-action-${Date.now()}-${actionSequence}`,
  });
  assert.equal(response.status, 303);
  assert.match(response.headers.get("location") ?? "", locationPattern);
  return response;
}

async function transition(nextPhase) {
  await expectAction(
    {
      action: "transitionCampaign",
      nextPhase,
      demo: "admin",
      returnTo: "/admin?demo=admin",
    },
    /success=transitioned/,
  );
}

async function saveCompleteUnitDraft() {
  const jobs = Array.from({ length: 34 }, (_, index) => ({
    action: "saveAssessment",
    assessmentId: `assessment-unit-115-criterion-${String(index + 1).padStart(3, "0")}`,
    score: "0",
    report: `Báo cáo kiểm thử tiêu chí ${index + 1}`,
    evidenceUrl: "",
    demo: "unit",
    returnTo: "/scorecard?demo=unit",
  }));
  await runInChunks(jobs, 10, (job) => expectAction(job, /success=saved/));
}

async function saveAllRoundOneDecisions() {
  const jobs = [];
  for (let unit = 115; unit <= 130; unit += 1) {
    for (let criterion = 1; criterion <= 35; criterion += 1) {
      if (unit === 115 && criterion === 35) continue;
      jobs.push({
        action: "saveReview",
        assessmentId: `assessment-unit-${unit}-criterion-${String(criterion).padStart(3, "0")}`,
        score: "0",
        reason: "",
        demo: "admin",
        returnTo: "/review?demo=admin",
      });
    }
  }
  await runInChunks(jobs, 20, (job) => expectAction(job, /success=saved/));
}

async function runInChunks(items, size, operation) {
  for (let index = 0; index < items.length; index += size) {
    await Promise.all(items.slice(index, index + size).map(operation));
  }
}

function form(values) {
  return new URLSearchParams(values);
}

async function fetchText(url) {
  const response = await fetch(url);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  return response.text();
}

async function waitForServer(url) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error("Development server exited early");
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Startup races are expected.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error("Timed out waiting for the development server");
}
