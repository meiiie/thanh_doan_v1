import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateResult,
  classify,
  validateReviewScore,
} from "../domain/scoring.mjs";
import { canTransition, requireTransition } from "../domain/workflow.mjs";

test("calculates capped bonus and rates above 100 percent", () => {
  const result = calculateResult([
    { section: "CORE", maximum: 83, score: 83, applicable: true },
    { section: "BONUS", maximum: 30, score: 30, applicable: true },
  ]);
  assert.deepEqual(result, {
    coreMaximum: 83,
    coreScore: 83,
    bonusRaw: 30,
    bonusScore: 25,
    totalScore: 108,
    rate: (108 / 83) * 100,
    classification: "EXCELLENT_CANDIDATE",
  });
});

test("excluded core criteria reduce the denominator", () => {
  const result = calculateResult([
    { section: "CORE", maximum: 80, score: 56, applicable: true },
    { section: "CORE", maximum: 20, score: 0, applicable: false },
  ]);
  assert.equal(result.coreMaximum, 80);
  assert.equal(result.rate, 70);
  assert.equal(result.classification, "ADVANCED");
});

test("classification boundaries match the workbook", () => {
  assert.equal(classify(49.99), "NOT_COMPLETED");
  assert.equal(classify(50), "COMPLETED");
  assert.equal(classify(70), "ADVANCED");
  assert.equal(classify(90), "EXCELLENT_CANDIDATE");
});

test("scores use half-point increments and require deduction reasons", () => {
  assert.throws(() => validateReviewScore(3, 2.5, 3, " "), /DEDUCTION/);
  assert.doesNotThrow(() => validateReviewScore(3, 2.5, 3, "Thiếu minh chứng"));
  assert.throws(() => validateReviewScore(1, 1.25, 3, "ok"), /INVALID_SCORE/);
});

test("campaign phases only move through the approved state machine", () => {
  assert.equal(canTransition("ROUND1", "ROUND1_RELEASED"), true);
  assert.equal(canTransition("ROUND1", "FINALIZED"), false);
  assert.doesNotThrow(() => requireTransition("FINALIZED", "ROUND2"));
  assert.throws(() => requireTransition("ARCHIVED", "DRAFT"), /INVALID_TRANSITION/);
});
