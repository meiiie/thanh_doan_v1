import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("all state-changing form posts require same-origin and idempotency", async () => {
  const actions = await source("app/api/actions/route.ts");
  assert.match(actions, /if \(!sameOrigin\(request\)\).*status: 403/);
  assert.match(actions, /claimIdempotency\(actor, key, action\)/);
  assert.match(actions, /safeReturnTo/);
});

test("worker protects private HTML from framing and caching", async () => {
  const worker = await source("worker/index.ts");
  assert.match(worker, /x-frame-options", "DENY/);
  assert.match(worker, /x-content-type-options", "nosniff/);
  assert.match(worker, /cache-control", "private, no-store/);
  assert.match(worker, /strict-transport-security/);
  assert.match(worker, /content-security-policy/);
  assert.match(worker, /frame-ancestors 'none'/);
});

test("CSV export neutralizes spreadsheet formulas", async () => {
  const route = await source("app/api/export/route.ts");
  assert.match(route, /\[=\+\\-@\]/);
  assert.match(route, /`'\$\{raw\}`/);
});

test("production authentication never enables local demo identities", async () => {
  const auth = await source("app/auth.ts");
  assert.match(auth, /\^localhost/);
  assert.match(auth, /localDemo \? null : await getChatGPTUser\(\)/);
});

test("reviewers cannot read draft self-assessments", async () => {
  const app = await source("db/app.ts");
  assert.match(app, /\["DRAFT", "SELF_ASSESSMENT"\]\.includes\(campaign\.phase\)/);
  assert.match(app, /cu\.status IN \('SUBMITTED','LOCKED','EXPLAINED','FINALIZED'\)/);
});

test("reopening requires a reason and preserves immutable snapshots", async () => {
  const app = await source("db/app.ts");
  assert.match(app, /REOPEN_REASON_REQUIRED/);
  assert.match(app, /INSERT INTO final_result_snapshots/);
  assert.match(app, /CAMPAIGN_REOPENED/);
});
