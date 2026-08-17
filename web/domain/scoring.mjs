export const BONUS_CAP = 25;

export function classify(rate) {
  if (!Number.isFinite(rate) || rate < 0) throw new Error("INVALID_RATE");
  if (rate >= 90) return "EXCELLENT_CANDIDATE";
  if (rate >= 70) return "ADVANCED";
  if (rate >= 50) return "COMPLETED";
  return "NOT_COMPLETED";
}

export function calculateResult(rows, bonusCap = BONUS_CAP) {
  let coreMaximum = 0;
  let coreScore = 0;
  let bonusRaw = 0;

  for (const row of rows) {
    if (!row.applicable) continue;
    assertScore(row.score, row.maximum);
    if (row.section === "CORE") {
      coreMaximum += row.maximum;
      coreScore += row.score;
    } else if (row.section === "BONUS") {
      bonusRaw += row.score;
    } else {
      throw new Error("INVALID_SECTION");
    }
  }

  if (coreMaximum <= 0) throw new Error("CORE_MAXIMUM_REQUIRED");
  const bonusScore = Math.min(bonusRaw, bonusCap);
  const totalScore = coreScore + bonusScore;
  const rate = (totalScore / coreMaximum) * 100;

  return {
    coreMaximum,
    coreScore,
    bonusRaw,
    bonusScore,
    totalScore,
    rate,
    classification: classify(rate),
  };
}

export function validateReviewScore(selfScore, score, maximum, reason) {
  assertScore(score, maximum);
  if (score < selfScore && !reason.trim()) throw new Error("DEDUCTION_REASON_REQUIRED");
}

function assertScore(score, maximum) {
  if (
    !Number.isFinite(score) ||
    !Number.isFinite(maximum) ||
    maximum < 0 ||
    score < 0 ||
    score > maximum ||
    !Number.isInteger(score * 2)
  ) {
    throw new Error("INVALID_SCORE");
  }
}
